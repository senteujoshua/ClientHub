import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations";
import { sendVerification } from "@/lib/twilio";
import bcrypt from "bcryptjs";

function maskPhone(phone: string): string {
  if (phone.length <= 4) return "****";
  return phone.slice(0, -4).replace(/\d/g, "*") + phone.slice(-4);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return Response.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.phone) {
      return Response.json(
        { error: "No phone number configured for your account. Contact your administrator." },
        { status: 403 }
      );
    }

    // Mark that the user has passed the password step (10-min window)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.user.update({
      where: { id: user.id },
      data: { otpCode: null, otpExpiresAt: expiresAt },
    });

    await sendVerification(user.phone);

    return Response.json({
      requiresOtp: true,
      maskedPhone: maskPhone(user.phone),
      email: user.email,
    });
  } catch (error) {
    console.error("[AUTH LOGIN]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
