import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const jsonHeaders = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function allowedOrigin(req: Request): string | null {
  const origin = req.headers.get("origin");
  const configured = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
    .split(",").map((item) => item.trim()).filter(Boolean);
  if (!origin || !configured.includes(origin)) return null;
  return origin;
}

function respond(req: Request, status: number, body: Record<string, unknown>) {
  const origin = allowedOrigin(req);
  const headers = new Headers(jsonHeaders);
  if (origin) {
    headers.set("access-control-allow-origin", origin);
    headers.set("vary", "Origin");
    headers.set("access-control-allow-methods", "POST, OPTIONS");
    headers.set("access-control-allow-headers", "authorization, apikey, content-type, x-client-info");
    headers.set("access-control-max-age", "600");
  }
  return new Response(JSON.stringify(body), { status, headers });
}

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const result = value.trim();
  return result.length > 0 && result.length <= max ? result : null;
}

Deno.serve(async (req: Request) => {
  const origin = allowedOrigin(req);
  if (req.method === "OPTIONS") {
    if (!origin) return respond(req, 403, { error: "Origin not allowed" });
    return respond(req, 204, {});
  }
  if (req.method !== "POST") return respond(req, 405, { error: "Method not allowed" });
  if (!origin) return respond(req, 403, { error: "Origin not allowed" });

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (contentLength > 16384) return respond(req, 413, { error: "Request is too large" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey || !Deno.env.get("ALLOWED_ORIGINS")) {
    return respond(req, 503, { error: "Reservation service is not configured" });
  }

  let body: Record<string, unknown>;
  try {
    const parsed = await req.json();
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("Invalid body");
    body = parsed as Record<string, unknown>;
  } catch {
    return respond(req, 400, { error: "A valid JSON body is required" });
  }

  // Honeypot: reject automated submissions without revealing the field name.
  if (typeof body.website === "string" && body.website.trim() !== "") {
    return respond(req, 200, { ok: true, message: "Your request has been received." });
  }

  const locationId = text(body.locationId, 36);
  const guestName = text(body.guestName, 120);
  const guestEmail = text(body.guestEmail, 254);
  const guestPhone = body.guestPhone == null || body.guestPhone === "" ? null : text(body.guestPhone, 40);
  const partySize = Number(body.partySize);
  const startsAt = text(body.startsAt, 40);
  const customerNotes = body.customerNotes == null || body.customerNotes === "" ? null : text(body.customerNotes, 1000);

  if (!locationId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(locationId)
    || !guestName || !guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)
    || (body.guestPhone != null && body.guestPhone !== "" && !guestPhone)
    || !Number.isInteger(partySize) || partySize < 1 || partySize > 20
    || !startsAt || Number.isNaN(Date.parse(startsAt))
    || (body.customerNotes != null && body.customerNotes !== "" && customerNotes === null)) {
    return respond(req, 400, { error: "Check the name, email, party size and requested date/time." });
  }

  const clientIp = req.headers.get("cf-connecting-ip")
    ?? req.headers.get("x-real-ip")
    ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
  const client = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { "x-application-name": "rooms-reservation-edge" } },
  });

  try {
    const ipHash = await sha256("reservation-ip:" + clientIp);
    const ipLimit = await client.rpc("consume_public_rate_limit", {
      p_key_hash: ipHash, p_window_seconds: 600, p_max_requests: 12,
    });
    if (ipLimit.error) throw new Error("Rate limiter unavailable");
    if (ipLimit.data !== true) return respond(req, 429, { error: "Too many requests. Please try again later." });

    const emailHash = await sha256("reservation-email:" + guestEmail.toLowerCase());
    const emailLimit = await client.rpc("consume_public_rate_limit", {
      p_key_hash: emailHash, p_window_seconds: 3600, p_max_requests: 4,
    });
    if (emailLimit.error) throw new Error("Rate limiter unavailable");
    if (emailLimit.data !== true) return respond(req, 429, { error: "Too many requests for this email. Please try again later." });

    const { data, error } = await client.rpc("create_guest_reservation", {
      p_location_id: locationId,
      p_guest_name: guestName,
      p_guest_email: guestEmail,
      p_guest_phone: guestPhone,
      p_party_size: partySize,
      p_starts_at: new Date(startsAt).toISOString(),
      p_customer_notes: customerNotes,
    });

    if (error) {
      if (error.code === "P0001") return respond(req, 409, { error: "That time is no longer available. Please choose another time." });
      if (error.code === "P0002") return respond(req, 404, { error: "This location is unavailable." });
      if (error.code === "22023") return respond(req, 400, { error: error.message });
      if (error.code === "55000") return respond(req, 503, { error: "Reservations are not available for this location yet." });
      throw new Error("Reservation database operation failed");
    }

    const reservation = Array.isArray(data) ? data[0] : data;
    if (!reservation?.confirmation_code) throw new Error("Reservation response was incomplete");
    return respond(req, 201, {
      ok: true,
      status: "pending",
      confirmationCode: reservation.confirmation_code,
      startsAt: reservation.starts_at,
      endsAt: reservation.ends_at,
      message: "Your request is received and is pending confirmation. Please keep your confirmation code.",
    });
  } catch {
    // Never log customer payloads, email addresses, or phone numbers.
    return respond(req, 503, { error: "We could not complete the reservation request. Please try again shortly." });
  }
});
