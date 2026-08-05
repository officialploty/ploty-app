// update-layout
// Lets the original submitter edit their own layout. If the layout was
// already approved, an edit sends it back to "pending" — the review queue
// exists to vet what's actually shown to the public, so approved details
// shouldn't be swappable post-approval without another look. Edits to a
// layout that's still pending/rejected don't change its status further.

import { withSupabase } from "@supabase/server";
import { syncAmenities } from "../_shared/amenities.ts";
import { refineListingDistances } from "../_shared/landmarks.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const {
      id, locality, city, area, landmark, notes, owner, contact, lat, lng,
      plot_count, size_min, size_max, ppsf_min, ppsf_max, approval_number,
      amenity_count, amenities,
    } = body as {
      id?: string; locality?: string; city?: string; area?: string; landmark?: string; notes?: string;
      owner?: string; contact?: string; lat?: number; lng?: number;
      plot_count?: number; size_min?: number; size_max?: number; ppsf_min?: number; ppsf_max?: number;
      approval_number?: string; amenity_count?: number; amenities?: string[];
    };

    if (
      !id || !locality || !city || !area || typeof lat !== "number" || typeof lng !== "number" ||
      !plot_count || !size_min || !size_max || !ppsf_min || !ppsf_max
    ) {
      return Response.json(
        { error: "id, locality, city, area, lat, lng, plot_count, size_min, size_max, ppsf_min, and ppsf_max are required" },
        { status: 400 },
      );
    }

    const { data: existing, error: fetchErr } = await ctx.supabase
      .from("layouts")
      .select("status")
      .eq("id", id)
      .single();
    if (fetchErr || !existing) return Response.json({ error: "layout not found or not owned by you" }, { status: 404 });

    const nextStatus = existing.status === "approved" ? "pending" : existing.status;

    const { data: layout, error: updateErr } = await ctx.supabase
      .from("layouts")
      .update({
        locality, city, area, landmark, notes, owner, contact,
        location: `POINT(${lng} ${lat})`,
        plot_count, size_min, size_max, ppsf_min, ppsf_max, approval_number, amenity_count,
        status: nextStatus,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 400 });

    if (amenities) {
      const amenityErr = await syncAmenities(ctx.supabase, "layout", layout.id, amenities);
      if (amenityErr) console.error("amenity sync failed:", amenityErr);
    }

    // Call unconditionally first — optional-chaining on EdgeRuntime would
    // otherwise short-circuit the whole expression (including this call)
    // if the global doesn't exist, silently skipping refinement entirely.
    const distancePromise = refineListingDistances("layout", layout.id, lat, lng);
    // deno-lint-ignore no-explicit-any
    (globalThis as any).EdgeRuntime?.waitUntil(distancePromise);

    return Response.json({ layout, sent_back_to_review: existing.status === "approved" }, { status: 200 });
  }),
};
