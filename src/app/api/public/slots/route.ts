import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateTimeSlots } from "@/lib/utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");

  const settings = await prisma.stationSettings.findUnique({ where: { id: "settings" } });
  if (!settings) return NextResponse.json({ settings: null, slots: [] });

  if (!date) {
    return NextResponse.json({ settings: {
      name: settings.name,
      openingTime: settings.openingTime,
      closingTime: settings.closingTime,
      slotDuration: settings.slotDuration,
      currency: settings.currency,
      workingDays: settings.workingDays,
    }});
  }

  const allSlots = generateTimeSlots(settings.openingTime, settings.closingTime, settings.slotDuration);

  // Count existing bookings per slot for the requested date
  const dateStart = new Date(date);
  const dateEnd = new Date(date);
  dateEnd.setDate(dateEnd.getDate() + 1);

  const bookings = await prisma.booking.findMany({
    where: {
      date: { gte: dateStart, lt: dateEnd },
      status: { in: ["PENDING", "CONFIRMED"] },
    },
    select: { timeSlot: true },
  });

  const slotCounts: Record<string, number> = {};
  for (const b of bookings) {
    slotCounts[b.timeSlot] = (slotCounts[b.timeSlot] || 0) + 1;
  }

  const availableSlots = allSlots.filter(
    (slot) => (slotCounts[slot] || 0) < settings.maxCarsPerSlot
  );

  return NextResponse.json({ slots: availableSlots, settings: {
    name: settings.name,
    openingTime: settings.openingTime,
    closingTime: settings.closingTime,
    slotDuration: settings.slotDuration,
    currency: settings.currency,
    workingDays: settings.workingDays,
  }});
}
