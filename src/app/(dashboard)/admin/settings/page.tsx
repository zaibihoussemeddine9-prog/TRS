"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Paramètres KPI</h1>

      <Card>
        <CardHeader><h3 className="font-semibold">Seuils par défaut</h3></CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-sm font-medium text-slate-600 border-b pb-2">
              <span>KPI</span>
              <span className="text-emerald-600">Vert (min)</span>
              <span className="text-amber-600">Orange (min)</span>
              <span className="text-red-600">Rouge (max)</span>
            </div>
            {[
              { name: "TRS / OEE", green: "85%", orange: "65%", red: "65%" },
              { name: "Disponibilité", green: "90%", orange: "75%", red: "75%" },
              { name: "Performance", green: "95%", orange: "80%", red: "80%" },
              { name: "Qualité", green: "99%", orange: "95%", red: "95%" },
              { name: "Taux de rejet", green: "1%", orange: "3%", red: "5%" },
            ].map((kpi) => (
              <div key={kpi.name} className="grid grid-cols-4 gap-4 text-sm py-2 border-b border-slate-50">
                <span className="font-medium">{kpi.name}</span>
                <span className="text-emerald-600">{kpi.green}</span>
                <span className="text-amber-600">{kpi.orange}</span>
                <span className="text-red-600">{kpi.red}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
