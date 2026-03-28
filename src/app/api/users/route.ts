import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, firstName: true, lastName: true, email: true, department: true, position: true, role: true, active: true, createdAt: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error("[GET /api/users]", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { firstName, lastName, email, password, role, department, position } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email et mot de passe requis" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });

    const name = [firstName, lastName].filter(Boolean).join(" ") || email.split("@")[0];
    const hashed = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: { name, firstName: firstName || null, lastName: lastName || null, email, password: hashed, role: role || "OPERATEUR", department: department || null, position: position || null },
      select: { id: true, name: true, firstName: true, lastName: true, email: true, department: true, position: true, role: true, active: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("[POST /api/users]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, firstName, lastName, email, password, role, department, position, active } = body;
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    if (email && email !== existing.email) {
      const dup = await prisma.user.findUnique({ where: { email } });
      if (dup) return NextResponse.json({ error: "Email déjà utilisé" }, { status: 409 });
    }

    const data: Record<string, unknown> = {};
    if (firstName !== undefined) data.firstName = firstName || null;
    if (lastName !== undefined) data.lastName = lastName || null;
    if (firstName !== undefined || lastName !== undefined) {
      const fn = firstName ?? existing.firstName ?? "";
      const ln = lastName ?? existing.lastName ?? "";
      data.name = [fn, ln].filter(Boolean).join(" ") || existing.name;
    }
    if (email !== undefined) data.email = email;
    if (department !== undefined) data.department = department || null;
    if (position !== undefined) data.position = position || null;
    if (role !== undefined) data.role = role;
    if (active !== undefined) data.active = active;
    if (password) data.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, firstName: true, lastName: true, email: true, department: true, position: true, role: true, active: true },
    });
    return NextResponse.json(user);
  } catch (err) {
    console.error("[PUT /api/users]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const [batches, downtimes, declarations] = await Promise.all([
      prisma.batch.count({ where: { createdById: id } }),
      prisma.downtimeEvent.count({ where: { createdById: id } }),
      prisma.productionDeclaration.count({ where: { createdById: id } }),
    ]);

    if (batches + downtimes + declarations > 0) {
      return NextResponse.json({
        error: `Impossible de supprimer : ${batches} lot(s), ${downtimes} arrêt(s), ${declarations} déclaration(s) liée(s). Désactivez le compte.`,
      }, { status: 400 });
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[DELETE /api/users]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
