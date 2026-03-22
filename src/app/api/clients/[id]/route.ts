import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { clientSchema } from "@/lib/validations";
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
  const client = await db.client.findUnique({
    where: { id },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
      },
      _count: { select: { documents: true } },
    },
  });

  if (!client) {
    return Response.json({ error: "Client not found" }, { status: 404 });
  }

  return Response.json(client);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const parsed = clientSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const existing = await db.client.findUnique({ where: { id } });
    if (!existing) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    const client = await db.client.update({
      where: { id },
      data: {
        ...parsed.data,
        idNumber: parsed.data.idNumber ?? null,
        registrationNumber: parsed.data.registrationNumber ?? null,
        contactPerson: parsed.data.contactPerson ?? null,
        notes: parsed.data.notes ?? null,
      },
    });

    return Response.json(client);
  } catch (error) {
    console.error("[CLIENT UPDATE]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
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
    const existing = await db.client.findUnique({ where: { id } });

    if (!existing) {
      return Response.json({ error: "Client not found" }, { status: 404 });
    }

    await db.client.delete({ where: { id } });

    return Response.json({ success: true });
  } catch (error) {
    console.error("[CLIENT DELETE]", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
