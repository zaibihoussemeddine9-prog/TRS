import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import * as XLSX from "xlsx";

interface ImportRow {
  code: string;
  name: string;
  family?: string;
  form?: string;
  dosage?: string;
  primaryPackaging?: string;
  secondaryPackaging?: string;
  standardLotSize?: number;
  targetYield?: number;
  targetRejectRate?: number;
  targetOEE?: number;
  formatName?: string;
  formatCode?: string;
  unitsPerBlister?: number;
  blistersPerBox?: number;
  boxesPerCarton?: number;
  cartonsPerPallet?: number;
  unitsPerPack?: number;
}

interface ImportResult {
  row: number;
  code: string;
  status: "created" | "updated" | "error";
  message: string;
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Fichier requis" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json({ error: "Fichier Excel vide" }, { status: 400 });
    }

    const rows = XLSX.utils.sheet_to_json<ImportRow>(workbook.Sheets[sheetName]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "Aucune ligne de données trouvée" }, { status: 400 });
    }

    const results: ImportResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Excel row (header is row 1)

      if (!row.code || !row.name) {
        results.push({ row: rowNum, code: row.code || "?", status: "error", message: "Code et nom obligatoires" });
        continue;
      }

      const code = String(row.code).trim().toUpperCase();
      const name = String(row.name).trim();

      try {
        const existing = await prisma.product.findUnique({ where: { code } });

        const productData = {
          name,
          family: row.family ? String(row.family).trim() : null,
          form: row.form ? String(row.form).trim() : null,
          dosage: row.dosage ? String(row.dosage).trim() : null,
          primaryPackaging: row.primaryPackaging ? String(row.primaryPackaging).trim() : null,
          secondaryPackaging: row.secondaryPackaging ? String(row.secondaryPackaging).trim() : null,
          standardLotSize: row.standardLotSize ? Number(row.standardLotSize) : null,
          targetYield: row.targetYield ? Number(row.targetYield) / 100 : null,
          targetRejectRate: row.targetRejectRate ? Number(row.targetRejectRate) / 100 : null,
          targetOEE: row.targetOEE ? Number(row.targetOEE) / 100 : null,
        };

        if (existing) {
          await prisma.product.update({ where: { code }, data: productData });

          // Add format if provided and not duplicate
          if (row.formatCode && row.formatName) {
            const fCode = String(row.formatCode).trim().toUpperCase();
            const existingFormat = await prisma.format.findUnique({ where: { code: fCode } });
            if (!existingFormat) {
              await prisma.format.create({
                data: {
                  name: String(row.formatName).trim(),
                  code: fCode,
                  productId: existing.id,
                  unitsPerBlister: row.unitsPerBlister ? Number(row.unitsPerBlister) : null,
                  blistersPerBox: row.blistersPerBox ? Number(row.blistersPerBox) : null,
                  boxesPerCarton: row.boxesPerCarton ? Number(row.boxesPerCarton) : null,
                  cartonsPerPallet: row.cartonsPerPallet ? Number(row.cartonsPerPallet) : null,
                  unitsPerPack: row.unitsPerPack ? Number(row.unitsPerPack) : null,
                },
              });
            }
          }

          results.push({ row: rowNum, code, status: "updated", message: `Produit "${name}" mis à jour` });
        } else {
          const product = await prisma.product.create({ data: { ...productData, code } });

          if (row.formatCode && row.formatName) {
            const fCode = String(row.formatCode).trim().toUpperCase();
            await prisma.format.create({
              data: {
                name: String(row.formatName).trim(),
                code: fCode,
                productId: product.id,
                unitsPerBlister: row.unitsPerBlister ? Number(row.unitsPerBlister) : null,
                blistersPerBox: row.blistersPerBox ? Number(row.blistersPerBox) : null,
                boxesPerCarton: row.boxesPerCarton ? Number(row.boxesPerCarton) : null,
                cartonsPerPallet: row.cartonsPerPallet ? Number(row.cartonsPerPallet) : null,
                unitsPerPack: row.unitsPerPack ? Number(row.unitsPerPack) : null,
              },
            });
          }

          results.push({ row: rowNum, code, status: "created", message: `Produit "${name}" créé` });
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Erreur inconnue";
        results.push({ row: rowNum, code, status: "error", message: msg });
      }
    }

    const created = results.filter((r) => r.status === "created").length;
    const updated = results.filter((r) => r.status === "updated").length;
    const errors = results.filter((r) => r.status === "error").length;

    return NextResponse.json({
      summary: { total: results.length, created, updated, errors },
      results,
    });
  } catch (err) {
    console.error("[POST /api/products/import] erreur:", err);
    const message = err instanceof Error ? err.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
