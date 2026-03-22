// Local database storage — stores file content as base64 in the database.
// Swap this out for S3 later by replacing uploadFile / deleteFile.

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export interface UploadResult {
  key: string;
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export function validateFile(
  file: File
): { valid: true } | { valid: false; error: string } {
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds 10 MB limit (${(file.size / 1024 / 1024).toFixed(1)} MB).`,
    };
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: `File type "${file.type}" is not allowed. Allowed: PDF, JPEG, PNG, WebP, Word, Excel.`,
    };
  }
  return { valid: true };
}

export async function uploadFile(file: File): Promise<UploadResult> {
  const validation = validateFile(file);
  if (!validation.valid) throw new Error(validation.error);

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  // Store as a data URL so it can be decoded at download time
  const dataUrl = `data:${file.type};base64,${base64}`;

  return {
    key: file.name,
    url: dataUrl,
    fileName: file.name,
    fileSize: file.size,
    mimeType: file.type,
  };
}

// No-op: content lives inside the DB record and is removed with it
export async function deleteFile(_key: string): Promise<void> {}

export const DOCUMENT_TYPES = [
  "National ID",
  "Passport",
  "Driver's License",
  "Company Registration",
  "Tax Certificate",
  "Contract",
  "Agreement",
  "Invoice",
  "Insurance Certificate",
  "Business License",
  "Financial Statement",
  "Bank Statement",
  "Other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];
