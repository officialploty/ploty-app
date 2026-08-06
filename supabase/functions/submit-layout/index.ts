// submit-layout
// Submits a developer layout for review — always lands as status='pending',
// invisible to the public until staff approves it (enforced by RLS too,
// this is just the intent made explicit here).

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
      locality, city, area, landmark, notes, owner, contact, lat, lng,
      plot_count, size_min, size_max, ppsf_min, ppsf_max,
      amenity_count, amenities,
      planning_approval, planning_approval_number, rera_status, rera_number,
    } = body as {
      locality?: string; city?: string; area?: string; landmark?: string; notes?: string;
      owner?: string; contact?: string; lat?: number; lng?: number;
      plot_count?: number; size_min?: number; size_max?: number; ppsf_min?: number; ppsf_max?: number;
      amenity_count?: number; amenities?: string[];
      planning_approval?: string; planning_approval_number?: string; rera_status?: string; rera_number?: string;
    };

    if (
      !locality || !city || !area || typeof lat !== "number" || typeof lng !== "number" ||
      !plot_count || !size_min || !size_max || !ppsf_min || !ppsf_max
    ) {
      return Response.json(
        { error: "locality, city, area, lat, lng, plot_count, size_min, size_max, ppsf_min, and ppsf_max are required" },
        { status: 400 },
      );
    }

    const approvalErr = validateApproval(body);
    if (approvalErr) return Response.json({ error: approvalErr }, { status: 400 });

    const { data: layout, error: insertErr } = await ctx.supabase
      .from("layouts")
      .insert({
        locality, city, area, landmark, notes, owner, contact,
        location: `POINT(${lng} ${lat})`,
        plot_count, size_min, size_max, ppsf_min, ppsf_max, amenity_count,
        planning_approval, planning_approval_number, rera_status, rera_number,
        status: "pending",
        submitted_by: ctx.userClaims!.id,
      })
      .select()
      .single();

    if (insertErr) return Response.json({ error: insertErr.message }, { status: 400 });

    if (amenities?.length) {
      const amenityErr = await attachAmenities(ctx.supabase, "layout", layout.id, amenities);
      if (amenityErr) console.error("amenity tagging failed:", amenityErr);
    }

    // Call unconditionally first — optional-chaining on EdgeRuntime would
    // otherwise short-circuit the whole expression (including this call)
    // if the global doesn't exist, silently skipping refinement entirely.
    const distancePromise = refineListingDistances("layout", layout.id, lat, lng);
    // deno-lint-ignore no-explicit-any
    (globalThis as any).EdgeRuntime?.waitUntil(distancePromise);

    return Response.json({ layout }, { status: 201 });
  }),
};
