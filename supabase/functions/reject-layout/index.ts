// reject-layout
// Staff-only. Flips a pending layout to rejected and notifies the submitter.

import { withSupabase } from "@supabase/server";
import { sendSms } from "../_shared/msg91.ts";

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

    const { layout_id } = body as { layout_id?: string };
    if (!layout_id) return Response.json({ error: "layout_id is required" }, { status: 400 });

    const { data: layout, error: updateErr } = await ctx.supabase
      .from("layouts")
      .update({ status: "rejected" })
      .eq("id", layout_id)
      .select("id, locality, submitted_by")
      .single();

    if (updateErr) return Response.json({ error: updateErr.message }, { status: 400 });

    const { data: submitter } = await ctx.supabase
      .from("profiles")
      .select("phone")
      .eq("id", layout.submitted_by)
      .maybeSingle();

    await sendSms(submitter?.phone ?? null, `Your layout "${layout.locality}" was not approved. Contact Ploty support for details.`);

    return Response.json({ layout }, { status: 200 });
  }),
};
