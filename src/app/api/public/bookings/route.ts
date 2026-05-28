import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateReference } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serviceId, customerName, customerPhone, customerEmail, carBrand, carModel, carPlate, carColor, date, timeSlot, notes } = body;

    if (!serviceId || !customerName || !customerPhone || !date || !timeSlot) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const service = await prisma.service.findUnique({ where: { id: serviceId, active: true } });
    if (!service) return NextResponse.json({ error: "Service introuvable" }, { status: 404 });

    // Check slot availability
    const settings = await prisma.stationSettings.findUnique({ where: { id: "settings" } });
    const maxCars = settings?.maxCarsPerSlot || 3;

    const dateStart = new Date(date);
    const dateEnd = new Date(date);
    dateEnd.setDate(dateEnd.getDate() + 1);

    const existing = await prisma.booking.count({
      where: {
        date: { gte: dateStart, lt: dateEnd },
        timeSlot,
        status: { in: ["PENDING", "CONFIRMED"] },
      },
    });

    if (existing >= maxCars) {
      return NextResponse.json({ error: "Ce créneau est complet. Veuillez en choisir un autre." }, { status: 409 });
    }

    let reference = generateReference();
    // Ensure uniqueness
    let attempts = 0;
    while (await prisma.booking.findUnique({ where: { reference } }) && attempts < 5) {
      reference = generateReference();
      attempts++;
    }

    const booking = await prisma.booking.create({
      data: {
        reference,
        serviceId,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerEmail: customerEmail?.trim() || null,
        carBrand: carBrand?.trim() || null,
        carModel: carModel?.trim() || null,
        carPlate: carPlate?.trim() || null,
        carColor: carColor?.trim() || null,
        date: dateStart,
        timeSlot,
        notes: notes?.trim() || null,
        totalPrice: service.price,
        status: "PENDING",
      },
    });

    return NextResponse.json({ booking: { id: booking.id, reference: booking.reference } }, { status: 201 });
  } catch (err) {
    console.error("[POST /api/public/bookings]", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
