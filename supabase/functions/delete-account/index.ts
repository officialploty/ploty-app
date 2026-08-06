// delete-account
// Permanently deletes the caller's own account and everything they own.
// Irreversible — the frontend must confirm before calling this.
//
// plots.submitted_by / layouts.submitted_by have no ON DELETE cascade, and
// media / listing_amenities / listing_landmarks / favorites.listing_id are
// all polymorphic owner_type+owner_id pairs, not real foreign keys — none
// of it cleans up automatically. So each of the user's listings gets torn
// down explicitly (storage files, media rows, amenities, landmarks, and
// any OTHER user's favorite pointing at it) before the listing itself is
// deleted. Only then is the auth user deleted, which cascades to
// public.profiles (real FK, on delete cascade) and from there to the
// user's own favorites (also on delete cascade).
//
// Runs as service_role throughout — this has to reach across other users'
// favorites rows (RLS on favorites only allows a user to touch their own),
// and auth.admin.deleteUser only works with the service role key.

import { withSupabase } from "@supabase/server";
import { createClient } from "@supabase/supabase-js";

const MEDIA_BUCKET = "listing-media";

export default {
  fetch: withSupabase({ auth: "user" }, async (req, ctx) => {
    const userId = ctx.userClaims!.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: plots, error: plotsErr } = await admin.from("plots").select("id").eq("submitted_by", userId);
    if (plotsErr) return Response.json({ error: plotsErr.message }, { status: 500 });
    const { data: layouts, error: layoutsErr } = await admin.from("layouts").select("id").eq("submitted_by", userId);
    if (layoutsErr) return Response.json({ error: layoutsErr.message }, { status: 500 });

    const owners = [
      ...(plots || []).map((p) => ({ type: "plot", id: p.id })),
      ...(layouts || []).map((l) => ({ type: "layout", id: l.id })),
    ];

    for (const { type, id } of owners) {
      const { data: mediaRows } = await admin
        .from("media").select("storage_path").eq("owner_type", type).eq("owner_id", id);
      const paths = (mediaRows || []).map((m) => m.storage_path);
      if (paths.length) {
        const { error: storageErr } = await admin.storage.from(MEDIA_BUCKET).remove(paths);
        if (storageErr) console.error(`delete-account: storage cleanup failed for ${type} ${id}:`, storageErr.message);
      }
      await admin.from("media").delete().eq("owner_type", type).eq("owner_id", id);
      await admin.from("listing_amenities").delete().eq("owner_type", type).eq("owner_id", id);
      await admin.from("listing_landmarks").delete().eq("owner_type", type).eq("owner_id", id);
      // Other users' favorites pointing at this listing — not just the
      // caller's own (their own favorites cascade later via profiles).
      await admin.from("favorites").delete().eq("listing_type", type).eq("listing_id", id);
    }

    if (plots?.length) {
      const { error } = await admin.from("plots").delete().eq("submitted_by", userId);
      if (error) return Response.json({ error: "failed to delete plots: " + error.message }, { status: 500 });
    }
    if (layouts?.length) {
      const { error } = await admin.from("layouts").delete().eq("submitted_by", userId);
      if (error) return Response.json({ error: "failed to delete layouts: " + error.message }, { status: 500 });
    }

    const { error: deleteUserErr } = await admin.auth.admin.deleteUser(userId);
    if (deleteUserErr) return Response.json({ error: deleteUserErr.message }, { status: 500 });

    return Response.json({ deleted: true }, { status: 200 });
  }),
};
