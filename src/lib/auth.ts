import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: { id: string; email: string; name: string; role: UserRole };
  }
  interface User {
    id: string;
    role: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
  }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email } });
        if (!user || !user.active) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) { token.id = user.id; token.role = user.role; }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: { signIn: "/login" },
};

export function hasAccess(role: UserRole, module: string): boolean {
  const perms: Record<string, UserRole[]> = {
    dashboard: ["ADMIN", "RESPONSABLE", "OPERATEUR", "LECTURE_SEULE"],
    production: ["ADMIN", "RESPONSABLE", "OPERATEUR"],
    downtimes: ["ADMIN", "RESPONSABLE", "OPERATEUR"],
    admin: ["ADMIN"],
  };
  return (perms[module] || []).includes(role);
}

export function canEdit(role: UserRole): boolean {
  return role !== "LECTURE_SEULE";
}
