import { NextResponse } from "next/server";
import { format } from "date-fns";
import { upcomingBookingsForUser, getSessionById, getUser } from "@/server/db/mock";
import { CLASSES, LOCATIONS, STUDIOS, SOFIA_USER_ID } from "@/server/db/fixtures";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const { token } = params;

  // In mock mode the Sofia ical token is her fixture UUID.
  // In production this would resolve token -> user via a DB lookup on users.ical_token.
  const user = getUser(token) ?? (token === SOFIA_USER_ID ? getUser(SOFIA_USER_ID) : null);
  if (!user) {
    return new NextResponse("Not found", { status: 404 });
  }

  const bookings = upcomingBookingsForUser(user.id);
  const now = new Date();
  const dtstamp = format(now, "yyyyMMdd'T'HHmmss'Z'");

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//syncfit//NONSGML v1.0//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:syncfit",
    "X-WR-TIMEZONE:America/New_York",
  ];

  for (const b of bookings) {
    const s = getSessionById(b.sessionId);
    if (!s) continue;
    const cls = CLASSES.find((c) => c.id === s.classId);
    if (!cls) continue;
    const loc = LOCATIONS.find((l) => l.id === s.locationId);
    const studio = STUDIOS.find((x) => x.id === cls.studioId);

    const dtstart = format(s.startTime, "yyyyMMdd'T'HHmmss'Z'");
    const dtend = format(s.endTime, "yyyyMMdd'T'HHmmss'Z'");
    const summary = `${cls.name} · ${studio?.name ?? ""}`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${b.id}@syncfit`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${dtstart}`,
      `DTEND:${dtend}`,
      `SUMMARY:${escapeIcs(summary)}`,
      `DESCRIPTION:${escapeIcs(
        `${cls.name} at ${studio?.name ?? ""}. Booked via syncfit.`,
      )}`,
      `LOCATION:${escapeIcs(loc?.address ?? "")}`,
      "STATUS:CONFIRMED",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");

  // RFC 5545 requires CRLF line endings.
  const body = lines.join("\r\n") + "\r\n";
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename=\"syncfit.ics\"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}

function escapeIcs(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}
