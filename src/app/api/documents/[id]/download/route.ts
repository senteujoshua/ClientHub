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
  const document = await db.document.findUnique({ where: { id } });

  if (!document) {
    return Response.json({ error: "Document not found" }, { status: 404 });
  }

  // fileUrl is stored as "data:<mimeType>;base64,<content>"
  const commaIndex = document.fileUrl.indexOf(",");
  if (commaIndex === -1) {
    return Response.json({ error: "File data is corrupted" }, { status: 500 });
  }

  const base64Data = document.fileUrl.slice(commaIndex + 1);
  const buffer = Buffer.from(base64Data, "base64");

  return new Response(buffer, {
    headers: {
      "Content-Type": document.mimeType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(document.fileName)}"`,
      "Content-Length": buffer.length.toString(),
    },
  });
}
