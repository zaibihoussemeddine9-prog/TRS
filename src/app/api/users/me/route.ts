import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveUserId } from "@/lib/resolve-user";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, firstName: true, lastName: true, email: true, department: true, position: true, role: true, active: true, createdAt: true },
    });
    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    return NextResponse.json(user);
  } catch (err) {
    console.error("[GET /api/users/me]", err);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId = await resolveUserId();
    if (!userId) return NextResponse.json({ error: "Non connecté" }, { status: 401 });

    const { firstName, lastName, department, position, currentPassword, newPassword } = await req.json();

    const existing = await prisma.user.findUnique({ where: { id: userId } });
    if (!existing) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    const data: Record<string, unknown> = {};

    if (firstName !== undefined) data.firstName = firstName || null;
    if (lastName !== undefined) data.lastName = lastName || null;
    if (firstName !== undefined || lastName !== undefined) {
      const fn = firstName ?? existing.firstName ?? "";
      const ln = lastName ?? existing.lastName ?? "";
      data.name = [fn, ln].filter(Boolean).join(" ") || existing.name;
    }
    if (department !== undefined) data.department = department || null;
    if (position !== undefined) data.position = position || null;

    // Password change
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json({ error: "Mot de passe actuel requis" }, { status: 400 });
      }
      const valid = await bcrypt.compare(currentPassword, existing.password);
      if (!valid) {
        return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
      }
      if (newPassword.length < 6) {
        return NextResponse.json({ error: "Le nouveau mot de passe doit faire au moins 6 caractères" }, { status: 400 });
      }
      data.password = await bcrypt.hash(newPassword, 12);
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, name: true, firstName: true, lastName: true, email: true, department: true, position: true, role: true },
    });
    return NextResponse.json(user);
  } catch (err) {
    console.error("[PUT /api/users/me]", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Erreur" }, { status: 500 });
  }
}
