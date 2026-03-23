-- AlterTable
ALTER TABLE "users" ADD COLUMN "phone" TEXT;
ALTER TABLE "users" ADD COLUMN "otp_code" TEXT;
ALTER TABLE "users" ADD COLUMN "otp_expires_at" TIMESTAMP(3);
