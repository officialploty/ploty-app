// Shared between submit-plot, submit-layout, update-plot, update-layout.
//
// sync_listing_landmarks() (supabase/sql/landmarks.sql) already ran as a DB
// trigger by the time this is called — it wrote up to 5-per-category
// candidate rows into listing_landmarks using straight-line distance. This
// function refines those candidates to real routable distance/time via Ola
// Maps Distance Matrix Basic (no live traffic needed — landmark distance is
// static), re-scores with the same decay formula sync_listing_landmarks
// uses (score = weight * (1 / (1 + distance_km / 3)) + priority * 0.5, see
// that function's comment for why), then keeps the top 3 per category —
// no overall cap, so a listing with all 6 categories present can show up
// to 18 landmarks total, not squeezed down to a fixed 10.
//
// Call this fire-and-forget, after the HTTP response has already been sent
// (via EdgeRuntime.waitUntil) — a buyer publishing a plot shouldn't wait on
// an external API round-trip. If OLA_MAPS_API_KEY isn't set, or the call
// fails for any reason, this no-ops and the straight-line placeholders from
// step one simply stay in place — never a crash, never missing data.
//
// Uses its own service-role client rather than the caller's RLS-scoped
// ctx.supabase — listing_landmarks only grants SELECT to authenticated/anon
// (buyers/sellers should never write computed distances directly), so this
// needs the same kind of privilege bypass sync_listing_landmarks() gets via
// `security definer` at the SQL layer, just done at the app layer instead
// since the actual work (calling Ola Maps) has to happen here in Deno.

import { createClient } from "@supabase/supabase-js";

const CATEGORY_CAP = 3;

export async function refineListingDistances(
  ownerType: "plot" | "layout",
  ownerId: string,
  lat: number,
  lng: number,
) {
  const apiKey = Deno.env.get("OLA_MAPS_API_KEY");
  if (!apiKey) {
    console.log("[ola maps not configured — skipping distance refinement]");
    return;
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const { data: candidates, error: fetchErr } = await supabase
    .from("listing_landmarks")
    .select("landmark_id, landmarks(lat, lng, category, weight, priority)")
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId);

  if (fetchErr || !candidates?.length) {
    if (fetchErr) console.error("refineListingDistances: failed to load candidates:", fetchErr.message);
    return;
  }

  const destinations = candidates.map((c: any) => `${c.landmarks.lat},${c.landmarks.lng}`).join("|");
  const url = `https://api.olamaps.io/routing/v1/distanceMatrix/basic`
    + `?origins=${lat},${lng}&destinations=${encodeURIComponent(destinations)}&api_key=${apiKey}`;

  let json: any;
  try {
    const res = await fetch(url, { method: "GET", headers: { "X-Request-Id": crypto.randomUUID() } });
    if (!res.ok) {
      console.error("Ola Maps distanceMatrix/basic failed:", res.status, await res.text());
      return;
    }
    json = await res.json();
  } catch (err) {
    console.error("Ola Maps distanceMatrix/basic request threw:", err);
    return;
  }

  const elements = json?.rows?.[0]?.elements;
  if (!Array.isArray(elements) || elements.length !== candidates.length) {
    console.error("Ola Maps distanceMatrix/basic returned an unexpected shape:", JSON.stringify(json));
    return;
  }

  // Re-score each candidate with real distance, same decay formula
  // sync_listing_landmarks used with the straight-line estimate.
  const refined = candidates.map((c: any, i: number) => {
    const el = elements[i];
    const distanceKm = el?.status === "OK" ? el.distance / 1000 : null;
    const driveTimeMin = el?.status === "OK" ? Math.max(1, Math.round(el.duration / 60)) : null;
    const score = distanceKm === null
      ? -Infinity
      : c.landmarks.weight * (1 / (1 + distanceKm / 3)) + c.landmarks.priority * 0.5;
    return {
      landmark_id: c.landmark_id,
      category: c.landmarks.category,
      distanceKm,
      driveTimeMin,
      score,
    };
  }).filter((c) => c.distanceKm !== null);

  if (!refined.length) return;

  refined.sort((a, b) => b.score - a.score);

  // Top 3 per category, no overall cap.
  const perCategoryCount: Record<string, number> = {};
  const final: typeof refined = [];
  for (const c of refined) {
    const used = perCategoryCount[c.category] || 0;
    if (used >= CATEGORY_CAP) continue;
    perCategoryCount[c.category] = used + 1;
    final.push(c);
  }

  final.sort((a, b) => b.score - a.score);

  const keepIds = final.map((c) => c.landmark_id);

  const { error: deleteErr } = await supabase
    .from("listing_landmarks")
    .delete()
    .eq("owner_type", ownerType)
    .eq("owner_id", ownerId)
    .not("landmark_id", "in", `(${keepIds.join(",")})`);
  if (deleteErr) console.error("refineListingDistances: failed to trim candidates:", deleteErr.message);

  for (let i = 0; i < final.length; i++) {
    const c = final[i];
    const { error: updateErr } = await supabase
      .from("listing_landmarks")
      .update({ rank: i + 1, distance_km: Math.round(c.distanceKm! * 10) / 10, drive_time_min: c.driveTimeMin })
      .eq("owner_type", ownerType)
      .eq("owner_id", ownerId)
      .eq("landmark_id", c.landmark_id);
    if (updateErr) console.error("refineListingDistances: failed to update rank", i + 1, updateErr.message);
  }
}
