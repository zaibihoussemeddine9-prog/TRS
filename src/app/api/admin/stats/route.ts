import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const [total, available, rented, maintenance, offline] = await Promise.all([
    prisma.scooter.count(),
    prisma.scooter.count({ where: { status: "AVAILABLE" } }),
    prisma.scooter.count({ where: { status: "RENTED" } }),
    prisma.scooter.count({ where: { status: "MAINTENANCE" } }),
    prisma.scooter.count({ where: { status: "OFFLINE" } }),
  ]);

  // Revenue today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const todayRentals = await prisma.rental.findMany({
    where: {
      status: "COMPLETED",
      endTime: { gte: startOfDay },
    },
    select: { totalCost: true },
  });

  const revenueToday = todayRentals.reduce((sum, r) => sum + (r.totalCost ?? 0), 0);

  // Total revenue
  const allRentals = await prisma.rental.aggregate({
    _sum: { totalCost: true },
    where: { status: "COMPLETED" },
  });

  // Active rentals count
  const activeRentals = await prisma.rental.count({ where: { status: "ACTIVE" } });

  // Total users
  const totalUsers = await prisma.user.count({ where: { role: "RIDER" } });

  return NextResponse.json({
    fleet: { total, available, rented, maintenance, offline },
    revenue: {
      today: Math.round(revenueToday * 100) / 100,
      total: Math.round((allRentals._sum.totalCost ?? 0) * 100) / 100,
    },
    activeRentals,
    totalUsers,
  });
}
