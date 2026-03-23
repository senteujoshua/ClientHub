import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { sendVerification } from "@/lib/twilio";
import { z } from "zod";

const resendSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = resendSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }

    const { email } = parsed.data;
    const user = await db.user.findUnique({ where: { email } });

    // Only allow resend if the user already authenticated with their password
    if (!user || !user.phone || !user.otpExpiresAt) {
      return Response.json(
        { error: "No active session. Please sign in again." },
        { status: 400 }
      );
    }

    // Refresh the session window
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.user.update({
      where: { id: user.id },
      data: { otpExpiresAt: expiresAt },
    });

    await sendVerification(user.phone);

    return Response.json({ ok: true });
  } catch (error) {
    console.error("[AUTH RESEND OTP]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
