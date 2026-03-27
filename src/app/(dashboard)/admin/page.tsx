"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Boxes, Package, AlertTriangle, Settings, Factory } from "lucide-react";

const adminItems = [
  { href: "/admin/users", label: "Utilisateurs", description: "Gestion des comptes et rôles", icon: Users },
  { href: "/admin/lines", label: "Lignes", description: "Lignes de conditionnement", icon: Factory },
  { href: "/admin/products", label: "Produits & Formats", description: "Référentiel produits", icon: Package },
  { href: "/admin/causes", label: "Causes d'arrêt", description: "Référentiel des causes", icon: AlertTriangle },
  { href: "/admin/settings", label: "Paramètres KPI", description: "Seuils et objectifs", icon: Settings },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        <p className="text-sm text-slate-500">Gestion des référentiels et paramètres</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {adminItems.map((item) => (
          <Link key={item.href} href={item.href}>
            <Card className="transition-shadow hover:shadow-md cursor-pointer">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{item.label}</h3>
                  <p className="text-sm text-slate-500">{item.description}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
