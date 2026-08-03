// Shared between approve-layout and reject-layout.
// MSG91/DLT registration is deliberately deferred (see Ploty-Phase1-Sprint-Plan.md,
// Day 3 status). Until MSG91_AUTH_KEY etc. are set via `supabase secrets set`,
// this no-ops with a log line instead of failing the request — approve/reject
// must keep working even without SMS wired up yet.

export async function sendSms(phone: string | null, message: string) {
  const authKey = Deno.env.get("MSG91_AUTH_KEY");
  const senderId = Deno.env.get("MSG91_SENDER_ID");

  if (!authKey || !senderId) {
    console.log(`[msg91 not configured — skipping] would SMS ${phone ?? "(no phone on file)"}: ${message}`);
    return;
  }
  if (!phone) {
    console.warn("sendSms called with no phone number on file — skipping");
    return;
  }

  try {
    const res = await fetch("https://control.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: { authkey: authKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: senderId,
        mobiles: phone,
        message,
      }),
    });
    if (!res.ok) console.error("MSG91 send failed:", await res.text());
  } catch (err) {
    console.error("MSG91 send threw:", err);
  }
}
