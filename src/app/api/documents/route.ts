import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { uploadFile } from "@/lib/storage";
import { documentUploadSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const clientId = searchParams.get("clientId");
  const documentType = searchParams.get("documentType");
  const search = searchParams.get("search") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("pageSize") ?? "10"))
  );

  const where = {
    ...(clientId && { clientId }),
    ...(documentType && { documentType }),
    ...(search && {
      OR: [
        { fileName: { contains: search, mode: "insensitive" as const } },
        { documentType: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [documents, total] = await Promise.all([
    db.document.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: {
        client: { select: { id: true, name: true } },
      },
    }),
    db.document.count({ where }),
  ]);

  return Response.json({
    data: documents,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const clientId = formData.get("clientId") as string;
    const documentType = formData.get("documentType") as string;
    const expiryDate = formData.get("expiryDate") as string | null;

    const metaParsed = documentUploadSchema.safeParse({
      clientId,
      documentType,
      expiryDate,
    });

    if (!metaParsed.success) {
      return Response.json(
        { error: metaParsed.error.issues[0].message },
        { status: 400 }
      );
    }

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "No file provided" }, { status: 400 });
    }

    const client = await db.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    const uploaded = await uploadFile(file);

    const document = await db.document.create({
      data: {
        clientId,
        fileName: uploaded.fileName,
        fileKey: uploaded.key,
        fileUrl: uploaded.url,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
        documentType,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
      },
      include: {
        client: { select: { id: true, name: true } },
      },
    });

    return Response.json(document, { status: 201 });
  } catch (error) {
    console.error("[DOCUMENT UPLOAD]", error);
    const message =
      error instanceof Error ? error.message : "Upload failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
