import { format } from "date-fns";
import { Resend } from "resend";
import webPush from "web-push";

let resend: Resend | null = null;
export function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

let vapidReady = false;
export function ensureVapid(): boolean {
  if (vapidReady) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT ?? "mailto:coach@syncfit.app";
  if (!pub || !priv) return false;
  webPush.setVapidDetails(subject, pub, priv);
  vapidReady = true;
  return true;
}

export type ReminderInput = {
  bookingId: string;
  title: string;
  body: string;
  recipient: { userId: string; email: string | null; pushSubs: Array<{ endpoint: string; keys: { p256dh: string; auth: string } }> };
};

export async function sendReminder(input: ReminderInput) {
  const results: Array<{ channel: string; ok: boolean }> = [];

  // Web Push
  if (ensureVapid() && input.recipient.pushSubs.length > 0) {
    for (const sub of input.recipient.pushSubs) {
      try {
        await webPush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify({
            title: input.title,
            body: input.body,
            url: `/calendar`,
          }),
        );
        results.push({ channel: "push", ok: true });
      } catch {
        results.push({ channel: "push", ok: false });
      }
    }
  }

  // Email (optional fallback)
  const resend = getResend();
  if (resend && input.recipient.email) {
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? "coach@syncfit.app",
        to: input.recipient.email,
        subject: input.title,
        html: `<p style="font-family:-apple-system,Inter,sans-serif;font-size:15px;line-height:22px;color:#0A0A0A">${input.body}</p>
<p style="color:#9A9A9A;font-size:12px">— syncfit · ${format(new Date(), "EEE MMM d, h:mma")}</p>`,
      });
      results.push({ channel: "email", ok: true });
    } catch {
      results.push({ channel: "email", ok: false });
    }
  }

  return results;
}
