import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { signToken, setAuthCookie } from "@/lib/auth";
import { checkVerification } from "@/lib/twilio";
import { z } from "zod";

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6, "Code must be 6 digits"),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, code } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });

    if (!user || !user.otpExpiresAt) {
      return Response.json(
        { error: "Invalid or expired session. Please sign in again." },
        { status: 401 }
      );
    }

    if (new Date() > user.otpExpiresAt) {
      await db.user.update({
        where: { id: user.id },
        data: { otpExpiresAt: null },
      });
      return Response.json(
        { error: "Session expired. Please sign in again." },
        { status: 401 }
      );
    }

    if (!user.phone) {
      return Response.json(
        { error: "No phone number on account." },
        { status: 403 }
      );
    }

    const approved = await checkVerification(user.phone, code);
    if (!approved) {
      return Response.json(
        { error: "Incorrect verification code." },
        { status: 401 }
      );
    }

    // Clear the OTP session
    await db.user.update({
      where: { id: user.id },
      data: { otpExpiresAt: null },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    await setAuthCookie(token);

    return Response.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("[AUTH VERIFY OTP]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
