"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Building2, Mail, Lock, Phone, ArrowLeft } from "lucide-react";
import { loginSchema, type LoginInput } from "@/lib/validations";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Step = "credentials" | "otp";

export default function LoginPage() {
  const router = useRouter();

  const [step, setStep] = useState<Step>("credentials");
  const [credError, setCredError] = useState<string | null>(null);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
  });

  async function onCredentialsSubmit(data: LoginInput) {
    setCredError(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      setCredError(json.error ?? "Login failed. Please try again.");
      return;
    }
    setPendingEmail(data.email);
    setMaskedPhone(json.maskedPhone);
    setStep("otp");
  }

  async function onOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (otp.length !== 6) {
      setOtpError("Please enter the 6-digit code.");
      return;
    }
    setOtpError(null);
    setVerifying(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail, code: otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOtpError(json.error ?? "Verification failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setVerifying(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setResendSent(false);
    setOtpError(null);
    try {
      const res = await fetch("/api/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingEmail }),
      });
      const json = await res.json();
      if (!res.ok) {
        setOtpError(json.error ?? "Failed to resend code.");
        return;
      }
      setOtp("");
      setResendSent(true);
    } finally {
      setResending(false);
    }
  }

  function goBack() {
    setStep("credentials");
    setOtp("");
    setOtpError(null);
    setResendSent(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEE9DF] px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#1B2632] mb-4">
            <Building2 className="w-7 h-7 text-[#FFB162]" />
          </div>
          <h1 className="text-2xl font-bold text-[#1B2632]">ClientHub</h1>
          <p className="text-sm text-[#C9C1B1] mt-1">
            {step === "credentials" ? "Sign in to your account" : "Verify your identity"}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-6 px-1">
          <div className="flex items-center gap-2 flex-1">
            <div className="w-6 h-6 rounded-full bg-[#2C3B4D] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">1</span>
            </div>
            <div className="h-px flex-1 bg-[#C9C1B1]/50" />
          </div>
          <div className="flex items-center gap-2 flex-1">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                step === "otp"
                  ? "bg-[#2C3B4D]"
                  : "bg-[#C9C1B1]/40"
              }`}
            >
              <span className="text-xs font-bold text-white">2</span>
            </div>
            <div className="h-px flex-1 bg-[#C9C1B1]/50" />
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#C9C1B1]/30 p-8">
          {step === "credentials" ? (
            <form onSubmit={handleSubmit(onCredentialsSubmit)} className="space-y-5">
              <Input
                label="Email address"
                type="email"
                placeholder="you@example.com"
                icon={<Mail className="w-4 h-4" />}
                error={errors.email?.message}
                required
                {...register("email")}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                icon={<Lock className="w-4 h-4" />}
                error={errors.password?.message}
                required
                {...register("password")}
              />

              {credError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#A35139]">
                  {credError}
                </div>
              )}

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                loading={isSubmitting}
                className="w-full"
              >
                Continue
              </Button>
            </form>
          ) : (
            <form onSubmit={onOtpSubmit} className="space-y-5">
              {/* Masked phone info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#EEE9DF]">
                <Phone className="w-4 h-4 text-[#2C3B4D] shrink-0" />
                <p className="text-sm text-[#2C3B4D]">
                  Code sent to{" "}
                  <span className="font-semibold">{maskedPhone}</span>
                </p>
              </div>

              {/* OTP input */}
              <div>
                <label className="text-sm font-medium text-[#2C3B4D] block mb-1.5">
                  Verification code <span className="text-[#A35139]">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ""));
                    setOtpError(null);
                    setResendSent(false);
                  }}
                  placeholder="000000"
                  autoFocus
                  className="w-full h-14 rounded-xl border border-[#C9C1B1] bg-white px-4 text-center text-3xl font-mono tracking-[0.6em] text-[#1B2632] placeholder:text-[#C9C1B1]/50 placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-[#FFB162] focus:border-transparent transition-shadow"
                />
                <p className="text-xs text-[#C9C1B1] mt-1.5 text-center">
                  Code expires in 10 minutes
                </p>
              </div>

              {otpError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-[#A35139]">
                  {otpError}
                </div>
              )}

              {resendSent && (
                <div className="rounded-lg bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                  A new code has been sent.
                </div>
              )}

              <Button
                type="submit"
                variant="secondary"
                size="lg"
                loading={verifying}
                className="w-full"
              >
                Verify &amp; Sign in
              </Button>

              {/* Back + resend */}
              <div className="flex items-center justify-between text-sm pt-1">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-[#C9C1B1] hover:text-[#2C3B4D] transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resending}
                  className="text-[#FFB162] hover:text-[#e09a45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {resending ? "Sending…" : "Resend code"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
