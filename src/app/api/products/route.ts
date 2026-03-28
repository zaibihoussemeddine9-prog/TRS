import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all");

  try {
    const products = await prisma.product.findMany({
      where: all === "true" ? {} : { active: true },
      include: {
        formats: { where: all === "true" ? {} : { active: true }, orderBy: { name: "asc" } },
        productLineConfigs: {
          where: all === "true" ? {} : { active: true },
          include: { line: { select: { id: true, name: true, code: true } } },
        },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(products);
  } catch (err) {
    console.error("[GET /api/products]", err);
    return NextResponse.json({ error: "Erreur lors du chargement des produits" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, family, form, dosage, primaryPackaging, secondaryPackaging,
      standardLotSize, targetYield, targetRejectRate, targetOEE,
      qualityConstraints, processConstraints, planningNotes, comments,
      active, formats, lineConfigs, userId } = body;

    if (!name || !code) {
      return NextResponse.json({ error: "Nom et code produit sont obligatoires" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: `Le code "${code}" existe déjà` }, { status: 409 });
    }

    const product = await prisma.product.create({
      data: {
        name, code,
        family: family || null,
        form: form || null,
        dosage: dosage || null,
        primaryPackaging: primaryPackaging || null,
        secondaryPackaging: secondaryPackaging || null,
        standardLotSize: standardLotSize ? parseFloat(String(standardLotSize)) : null,
        targetYield: targetYield ? parseFloat(String(targetYield)) : null,
        targetRejectRate: targetRejectRate ? parseFloat(String(targetRejectRate)) : null,
        targetOEE: targetOEE ? parseFloat(String(targetOEE)) : null,
        qualityConstraints: qualityConstraints || null,
        processConstraints: processConstraints || null,
        planningNotes: planningNotes || null,
        comments: comments || null,
        active: active !== false,
        ...(formats && formats.length > 0 && {
          formats: {
            create: formats.map((f: any) => ({
              name: f.name,
              code: f.code,
              unitsPerBlister: f.unitsPerBlister ? parseInt(String(f.unitsPerBlister)) : null,
              blistersPerBox: f.blistersPerBox ? parseInt(String(f.blistersPerBox)) : null,
              boxesPerCarton: f.boxesPerCarton ? parseInt(String(f.boxesPerCarton)) : null,
              cartonsPerPallet: f.cartonsPerPallet ? parseInt(String(f.cartonsPerPallet)) : null,
              unitsPerPack: f.unitsPerPack ? parseInt(String(f.unitsPerPack)) : null,
            })),
          },
        }),
        ...(lineConfigs && lineConfigs.length > 0 && {
          productLineConfigs: {
            create: lineConfigs.map((lc: any) => ({
              lineId: lc.lineId,
              nominalSpeed: lc.nominalSpeed ? parseFloat(String(lc.nominalSpeed)) : null,
              standardSpeed: lc.standardSpeed ? parseFloat(String(lc.standardSpeed)) : null,
              startupTime: lc.startupTime ? parseFloat(String(lc.startupTime)) : null,
              lineEmptyingTime: lc.lineEmptyingTime ? parseFloat(String(lc.lineEmptyingTime)) : null,
              formatChangeTime: lc.formatChangeTime ? parseFloat(String(lc.formatChangeTime)) : null,
              lotChangeTime: lc.lotChangeTime ? parseFloat(String(lc.lotChangeTime)) : null,
              cleaningTime: lc.cleaningTime ? parseFloat(String(lc.cleaningTime)) : null,
              adjustmentTime: lc.adjustmentTime ? parseFloat(String(lc.adjustmentTime)) : null,
              targetOEE: lc.targetOEE ? parseFloat(String(lc.targetOEE)) : null,
              comments: lc.comments || null,
            })),
          },
        }),
      },
      include: {
        formats: true,
        productLineConfigs: { include: { line: { select: { id: true, name: true, code: true } } } },
      },
    });

    createAuditLog({
      userId: userId || null,
      action: "CREATE",
      entity: "Product",
      entityId: product.id,
      newValue: { name, code, family, form, dosage },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (err) {
    console.error("[POST /api/products] erreur:", err);
    const message = err instanceof Error ? err.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, code, name, family, form, dosage, primaryPackaging, secondaryPackaging,
      standardLotSize, targetYield, targetRejectRate, targetOEE,
      qualityConstraints, processConstraints, planningNotes, comments,
      active, formats, lineConfigs, userId } = body;

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    if (code && code !== existing.code) {
      const codeExists = await prisma.product.findUnique({ where: { code } });
      if (codeExists) {
        return NextResponse.json({ error: `Le code "${code}" est déjà utilisé` }, { status: 409 });
      }
    }

    // Update product
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(code !== undefined && { code }),
        ...(family !== undefined && { family: family || null }),
        ...(form !== undefined && { form: form || null }),
        ...(dosage !== undefined && { dosage: dosage || null }),
        ...(primaryPackaging !== undefined && { primaryPackaging: primaryPackaging || null }),
        ...(secondaryPackaging !== undefined && { secondaryPackaging: secondaryPackaging || null }),
        ...(standardLotSize !== undefined && { standardLotSize: standardLotSize ? parseFloat(String(standardLotSize)) : null }),
        ...(targetYield !== undefined && { targetYield: targetYield ? parseFloat(String(targetYield)) : null }),
        ...(targetRejectRate !== undefined && { targetRejectRate: targetRejectRate ? parseFloat(String(targetRejectRate)) : null }),
        ...(targetOEE !== undefined && { targetOEE: targetOEE ? parseFloat(String(targetOEE)) : null }),
        ...(qualityConstraints !== undefined && { qualityConstraints: qualityConstraints || null }),
        ...(processConstraints !== undefined && { processConstraints: processConstraints || null }),
        ...(planningNotes !== undefined && { planningNotes: planningNotes || null }),
        ...(comments !== undefined && { comments: comments || null }),
        ...(active !== undefined && { active }),
      },
    });

    // Replace formats if provided
    if (formats !== undefined) {
      await prisma.format.deleteMany({ where: { productId: id } });
      if (formats.length > 0) {
        await prisma.format.createMany({
          data: formats.map((f: any) => ({
            name: f.name,
            code: f.code,
            productId: id,
            unitsPerBlister: f.unitsPerBlister ? parseInt(String(f.unitsPerBlister)) : null,
            blistersPerBox: f.blistersPerBox ? parseInt(String(f.blistersPerBox)) : null,
            boxesPerCarton: f.boxesPerCarton ? parseInt(String(f.boxesPerCarton)) : null,
            cartonsPerPallet: f.cartonsPerPallet ? parseInt(String(f.cartonsPerPallet)) : null,
            unitsPerPack: f.unitsPerPack ? parseInt(String(f.unitsPerPack)) : null,
          })),
        });
      }
    }

    // Replace line configs if provided
    if (lineConfigs !== undefined) {
      await prisma.productLineConfig.deleteMany({ where: { productId: id } });
      if (lineConfigs.length > 0) {
        await prisma.productLineConfig.createMany({
          data: lineConfigs.map((lc: any) => ({
            productId: id,
            lineId: lc.lineId,
            nominalSpeed: lc.nominalSpeed ? parseFloat(String(lc.nominalSpeed)) : null,
            standardSpeed: lc.standardSpeed ? parseFloat(String(lc.standardSpeed)) : null,
            startupTime: lc.startupTime ? parseFloat(String(lc.startupTime)) : null,
            lineEmptyingTime: lc.lineEmptyingTime ? parseFloat(String(lc.lineEmptyingTime)) : null,
            formatChangeTime: lc.formatChangeTime ? parseFloat(String(lc.formatChangeTime)) : null,
            lotChangeTime: lc.lotChangeTime ? parseFloat(String(lc.lotChangeTime)) : null,
            cleaningTime: lc.cleaningTime ? parseFloat(String(lc.cleaningTime)) : null,
            adjustmentTime: lc.adjustmentTime ? parseFloat(String(lc.adjustmentTime)) : null,
            targetOEE: lc.targetOEE ? parseFloat(String(lc.targetOEE)) : null,
            comments: lc.comments || null,
          })),
        });
      }
    }

    const updated = await prisma.product.findUnique({
      where: { id },
      include: {
        formats: true,
        productLineConfigs: { include: { line: { select: { id: true, name: true, code: true } } } },
      },
    });

    createAuditLog({
      userId: userId || null,
      action: "UPDATE",
      entity: "Product",
      entityId: product.id,
      oldValue: existing as unknown as Record<string, unknown>,
      newValue: { name, code, family, form, dosage },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("[PUT /api/products] erreur:", err);
    const message = err instanceof Error ? err.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
