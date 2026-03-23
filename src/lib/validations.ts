import { z } from "zod";

export const loginSchema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const clientSchema = z.object({
  type: z.enum(["individual", "company"] as const, "Type must be individual or company"),
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  idNumber: z.string().max(50).optional().nullable(),
  registrationNumber: z.string().max(50).optional().nullable(),
  contactPerson: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email address"),
  phone: z
    .string()
    .min(7, "Phone number is too short")
    .max(20, "Phone number is too long"),
  address: z
    .string()
    .min(5, "Address must be at least 5 characters")
    .max(300, "Address cannot exceed 300 characters"),
  notes: z.string().max(1000).optional().nullable(),
});

export const documentUploadSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  documentType: z.string().min(1, "Document type is required"),
  expiryDate: z.string().optional().nullable(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;
