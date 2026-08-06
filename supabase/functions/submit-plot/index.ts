// submit-plot
// Publishes an individual plot instantly (no review gate).
// Runs the 12m duplicate-pin check server-side and returns any nearby
// plots as a *warning*, not a block — the lister can still publish.

import { withSupabase } from "@supabase/server";
import { attachAmenities } from "../_shared/amenities.ts";
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
      locality, city, area, landmark, notes, owner, contact, lat, lng, sqft, ppsf, amenity_count, amenities,
      planning_approval, planning_approval_number, rera_status, rera_number,
    } = body as {
      locality?: string; city?: string; area?: string; landmark?: string; notes?: string;
      owner?: string; contact?: string; lat?: number; lng?: number; sqft?: number; ppsf?: number;
      amenity_count?: number; amenities?: string[];
      planning_approval?: string; planning_approval_number?: string; rera_status?: string; rera_number?: string;
    };

    if (!locality || !city || !area || typeof lat !== "number" || typeof lng !== "number" || !sqft || !ppsf) {
      return Response.json(
        { error: "locality, city, area, lat, lng, sqft, and ppsf are required" },
        { status: 400 },
      );
    }

    const approvalErr = validateApproval(body);
    if (approvalErr) return Response.json({ error: approvalErr }, { status: 400 });

    // 12m proximity check — informational only, never blocks the publish.
    const { data: nearby, error: nearbyErr } = await ctx.supabase.rpc("nearby_plots", {
      p_lat: lat,
      p_lng: lng,
      p_radius_m: 12,
    });
    if (nearbyErr) console.error("nearby_plots check failed:", nearbyErr.message);

    const { data: plot, error: insertErr } = await ctx.supabase
      .from("plots")
      .insert({
        locality, city, area, landmark, notes, owner, contact,
        location: `POINT(${lng} ${lat})`,
        sqft, ppsf, amenity_count,
        planning_approval, planning_approval_number, rera_status, rera_number,
        submitted_by: ctx.userClaims!.id,
      })
      .select()
      .single();

    if (insertErr) return Response.json({ error: insertErr.message }, { status: 400 });

    if (amenities?.length) {
      const amenityErr = await attachAmenities(ctx.supabase, "plot", plot.id, amenities);
      if (amenityErr) console.error("amenity tagging failed:", amenityErr);
    }

    // deferred: DB trigger already wrote straight-line candidates before this
    // insert returned; refine them to real distance/time after responding.
    // Call unconditionally first — optional-chaining on EdgeRuntime would
    // otherwise short-circuit the whole expression (including this call)
    // if the global doesn't exist, silently skipping refinement entirely.
    const distancePromise = refineListingDistances("plot", plot.id, lat, lng);
    // deno-lint-ignore no-explicit-any
    (globalThis as any).EdgeRuntime?.waitUntil(distancePromise);

    return Response.json({ plot, nearby_warning: nearby?.length ? nearby : null }, { status: 201 });
  }),
};
