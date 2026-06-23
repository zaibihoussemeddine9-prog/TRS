import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateOrderNumber } from "@/lib/utils";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { firstName, lastName, phone, phone2, wilaya, commune, address, notes, source, items, subtotal, shippingFee, total } = body;

    if (!firstName || !lastName || !phone || !wilaya || !commune || !address || !items?.length) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }

    const orderNumber = generateOrderNumber();

    const order = await prisma.order.create({
      data: {
        orderNumber,
        firstName,
        lastName,
        phone,
        phone2: phone2 || null,
        wilaya,
        commune,
        address,
        notes: notes || null,
        source: source || "direct",
        subtotal,
        shippingFee: shippingFee || 0,
        total,
        status: "PENDING",
        items: {
          create: items.map((item: { productId: string; productName: string; quantity: number; price: number; total: number }) => ({
            productId: item.productId,
            productName: item.productName,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          })),
        },
      },
      include: { items: true },
    });

    // Increment sold count
    for (const item of items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: { sold: { increment: item.quantity }, stock: { decrement: item.quantity } },
      }).catch(() => {});
    }

    return NextResponse.json({ orderNumber: order.orderNumber, id: order.id }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const admin = await verifyAdminRequest(req);
  if (!admin) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  const where = status ? { status } : {};
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { items: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return NextResponse.json({ orders, total, page, limit });
}
