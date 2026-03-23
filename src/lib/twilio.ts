/**
 * Twilio Verify v2 helpers.
 *
 * Required env vars:
 *   TWILIO_ACCOUNT_SID
 *   TWILIO_AUTH_TOKEN
 *   TWILIO_VERIFY_SERVICE_SID
 *
 * If any are missing (e.g. in development) calls are no-ops and the
 * code is logged to the console instead.
 */

function twilioAuth() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
  return { accountSid, authToken, serviceSid };
}

/** Sends a Verify OTP to the given phone number. */
export async function sendVerification(to: string): Promise<void> {
  const { accountSid, authToken, serviceSid } = twilioAuth();

  if (!accountSid || !authToken || !serviceSid) {
    console.log(`[2FA DEV] Verification SMS would be sent to ${to}`);
    return;
  }

  const url = `https://verify.twilio.com/v2/Services/${serviceSid}/Verifications`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, Channel: "sms" }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio Verify send failed: ${err}`);
  }
}

/** Checks an OTP code. Returns true if approved, false if incorrect. */
export async function checkVerification(to: string, code: string): Promise<boolean> {
  const { accountSid, authToken, serviceSid } = twilioAuth();

  if (!accountSid || !authToken || !serviceSid) {
    console.log(`[2FA DEV] Would check code ${code} for ${to} — auto-approving in dev`);
    return code === "000000";
  }

  const url = `https://verify.twilio.com/v2/Services/${serviceSid}/VerificationCheck`;
  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, Code: code }).toString(),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Twilio Verify check failed: ${err}`);
  }

  const data = await res.json();
  return data.status === "approved";
}
