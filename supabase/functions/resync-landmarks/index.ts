// resync-landmarks
// Staff-only. Re-runs the landmark pipeline (sync_listing_landmarks +
// refineListingDistances) for a single listing on demand, without needing
// to fake an edit. Useful whenever the landmarks table, category taxonomy,
// or scoring algorithm changes — existing listings only ever pick up such
// changes the next time they're actually created/edited otherwise.

import { withSupabase } from "@supabase/server";
import { refineListingDistances } from "../_shared/landmarks.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const { data: profile, error: profileErr } = await ctx.supabase
      .from("profiles")
      .select("role")
      .eq("id", ctx.userClaims!.id)
      .single();

    if (profileErr || profile?.role !== "staff") {
      return Response.json({ error: "staff access required" }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const { owner_type, owner_id } = body as { owner_type?: string; owner_id?: string };
    if (owner_type !== "plot" && owner_type !== "layout") {
      return Response.json({ error: "owner_type must be 'plot' or 'layout'" }, { status: 400 });
    }
    if (!owner_id) return Response.json({ error: "owner_id is required" }, { status: 400 });

    const table = owner_type === "plot" ? "plots" : "layouts";
    const { data: listing, error: fetchErr } = await ctx.supabase
      .from(table)
      .select("id, lat, lng")
      .eq("id", owner_id)
      .single();
    if (fetchErr || !listing) return Response.json({ error: "listing not found" }, { status: 404 });
    const { lat, lng } = listing as { lat: number; lng: number };

    const { error: syncErr } = await ctx.supabase.rpc("sync_listing_landmarks", {
      p_owner_type: owner_type,
      p_owner_id: owner_id,
      p_lat: lat,
      p_lng: lng,
    });
    if (syncErr) return Response.json({ error: "sync_listing_landmarks failed: " + syncErr.message }, { status: 500 });

    await refineListingDistances(owner_type, owner_id, lat, lng);

    return Response.json({ owner_type, owner_id, lat, lng }, { status: 200 });
  }),
};
