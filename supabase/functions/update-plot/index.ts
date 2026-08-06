// update-plot
// Lets the original submitter edit their own individual plot. Individual
// plots have no review gate either way, so an edit just updates the row.

import { withSupabase } from "@supabase/server";
import { syncAmenities } from "../_shared/amenities.ts";
import { refineListingDistances } from "../_shared/landmarks.ts";
import { validateApproval } from "../_shared/approval.ts";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return Response.json({ error: "invalid JSON body" }, { status: 400 });
    }

    const {
      id, locality, city, area, landmark, notes, owner, contact, lat, lng, sqft, ppsf, amenity_count, amenities,
      planning_approval, planning_approval_number, rera_status, rera_number,
    } = body as {
      id?: string; locality?: string; city?: string; area?: string; landmark?: string; notes?: string;
      owner?: string; contact?: string; lat?: number; lng?: number; sqft?: number; ppsf?: number;
      amenity_count?: number; amenities?: string[];
      planning_approval?: string; planning_approval_number?: string; rera_status?: string; rera_number?: string;
    };

    if (!id || !locality || !city || !area || typeof lat !== "number" || typeof lng !== "number" || !sqft || !ppsf) {
      return Response.json(
        { error: "id, locality, city, area, lat, lng, sqft, and ppsf are required" },
        { status: 400 },
      );
    }

    const approvalErr = validateApproval(body);
    if (approvalErr) return Response.json({ error: approvalErr }, { status: 400 });

    const { data: plot, error: updateErr } = await ctx.supabase
      .from("plots")
      .update({
        locality, city, area, landmark, notes, owner, contact,
        location: `POINT(${lng} ${lat})`,
        sqft, ppsf, amenity_count,
        planning_approval, planning_approval_number, rera_status, rera_number,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 400 });
    if (!plot) return Response.json({ error: "plot not found or not owned by you" }, { status: 404 });

    if (amenities) {
      const amenityErr = await syncAmenities(ctx.supabase, "plot", plot.id, amenities);
      if (amenityErr) console.error("amenity sync failed:", amenityErr);
    }

    // Call unconditionally first — optional-chaining on EdgeRuntime would
    // otherwise short-circuit the whole expression (including this call)
    // if the global doesn't exist, silently skipping refinement entirely.
    const distancePromise = refineListingDistances("plot", plot.id, lat, lng);
    // deno-lint-ignore no-explicit-any
    (globalThis as any).EdgeRuntime?.waitUntil(distancePromise);

    return Response.json({ plot }, { status: 200 });
  }),
};
