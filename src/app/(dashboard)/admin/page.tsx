"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Package, AlertTriangle, Factory } from "lucide-react";

const adminItems = [
  { href: "/admin/users", label: "Utilisateurs", description: "Gestion des comptes et r\u00f4les", icon: Users },
  { href: "/admin/lines", label: "Lignes", description: "Lignes de conditionnement", icon: Factory },
  { href: "/admin/products", label: "Produits", description: "R\u00e9f\u00e9rentiel produits", icon: Package },
  { href: "/admin/causes", label: "Types d'arr\u00eat", description: "R\u00e9f\u00e9rentiel des types d'arr\u00eat", icon: AlertTriangle },
];

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Administration</h1>
        <p className="text-sm text-slate-500">Gestion des r\u00e9f\u00e9rentiels et param\u00e8tres</p>
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
