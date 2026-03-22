import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const document = await db.document.findUnique({
    where: { id },
    include: { client: { select: { id: true, name: true } } },
  });

  if (!document) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  return Response.json(document);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const document = await db.document.findUnique({ where: { id } });
    if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    await db.document.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[DOCUMENT DELETE]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
