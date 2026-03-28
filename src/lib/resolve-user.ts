import { prisma } from "./prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";

/**
 * Resolve the current user from session + fallback.
 * Returns the user ID or null.
 *
 * Strategy:
 * 1. Try getServerSession → user.id → find by id
 * 2. Try getServerSession → user.email → find by email
 * 3. Try body.userId → find by id
 * 4. Fallback: first active admin
 */
export async function resolveUserId(bodyUserId?: string | null): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);

    // 1. Session ID
    if (session?.user?.id) {
      const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
      if (user) return user.id;
    }

    // 2. Session email (robust after reseed — email stays the same, id changes)
    if (session?.user?.email) {
      const user = await prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true } });
      if (user) return user.id;
    }
  } catch {
    // getServerSession can fail if NEXTAUTH_SECRET is missing
  }

  // 3. Body userId
  if (bodyUserId) {
    const user = await prisma.user.findUnique({ where: { id: bodyUserId }, select: { id: true } });
    if (user) return user.id;
  }

  // 4. Fallback: first active admin
  const admin = await prisma.user.findFirst({ where: { role: "ADMIN", active: true }, select: { id: true } });
  return admin?.id || null;
}
