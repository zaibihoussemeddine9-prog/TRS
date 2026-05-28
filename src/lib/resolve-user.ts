import { prisma } from "./prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

export async function resolveUserId(bodyUserId?: string | null): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
      if (user) return user.id;
    }
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
      if (user) return user.id;
    }
  } catch { /* session can fail */ }
  if (bodyUserId) {
    const user = await prisma.user.findUnique({ where: { id: bodyUserId }, select: { id: true } });
    if (user) return user.id;
  }
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", active: true }, select: { id: true } });
  return admin?.id || null;
}
