"use client";

import { useEffect, useState, useCallback } from "react";
import { STATUS_LABELS, STATUS_COLORS, formatDate, formatPrice } from "@/lib/utils";

interface Booking {
  id: string;
  reference: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  carBrand?: string;
  carModel?: string;
  carPlate?: string;
  carColor?: string;
  date: string;
  timeSlot: string;
  status: string;
  notes?: string;
  totalPrice: number;
  service: { name: string; duration: number };
  createdAt: string;
}

const STATUSES = [
  { value: "", label: "Tous les statuts" },
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Confirmés" },
  { value: "COMPLETED", label: "Terminés" },
  { value: "CANCELLED", label: "Annulés" },
];

export default function BookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Booking | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [search, setSearch] = useState("");

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (dateFilter) params.set("date", dateFilter);
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/bookings?${params}`);
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  }, [statusFilter, dateFilter, search]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const updateStatus = async (id: string, status: string) => {
    await fetch(`/api/admin/bookings/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchBookings();
    setSelected((prev) => prev ? { ...prev, status } : null);
  };

  const deleteBooking = async (id: string) => {
    if (!confirm("Supprimer cette réservation ?")) return;
    await fetch(`/api/admin/bookings/${id}`, { method: "DELETE" });
    setSelected(null);
    fetchBookings();
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Réservations</h1>
        <p className="text-slate-500">{bookings.length} réservation(s) trouvée(s)</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <input
            type="text"
            placeholder="Rechercher par nom, tél, référence..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-48 rounded-xl border border-slate-300 px-4 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
          />
          <button
            onClick={() => { setSearch(""); setStatusFilter(""); setDateFilter(""); }}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Table */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-sky-500 rounded-full animate-spin"></div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-medium">Aucune réservation trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left">Réf.</th>
                    <th className="px-4 py-3 text-left">Client</th>
                    <th className="px-4 py-3 text-left">Service</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-right">Prix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {bookings.map((booking) => (
                    <tr
                      key={booking.id}
                      onClick={() => setSelected(booking)}
                      className={`cursor-pointer hover:bg-slate-50 transition-colors ${selected?.id === booking.id ? "bg-sky-50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono text-xs font-medium text-sky-600">{booking.reference}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-slate-900 text-sm">{booking.customerName}</p>
                        <p className="text-slate-400 text-xs">{booking.customerPhone}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">{booking.service.name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        <p>{formatDate(booking.date)}</p>
                        <p className="text-slate-400 text-xs">{booking.timeSlot}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[booking.status] || "bg-slate-100 text-slate-600"}`}>
                          {STATUS_LABELS[booking.status] || booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">
                        {booking.totalPrice} TND
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-y-auto max-h-[calc(100vh-200px)]">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm font-bold text-sky-600">{selected.reference}</span>
                <button onClick={() => setSelected(null)} className="text-slate-400 hover:text-slate-600 text-lg">×</button>
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase mb-2">Statut</p>
                <select
                  value={selected.status}
                  onChange={(e) => updateStatus(selected.id, e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none"
                >
                  <option value="PENDING">En attente</option>
                  <option value="CONFIRMED">Confirmé</option>
                  <option value="COMPLETED">Terminé</option>
                  <option value="CANCELLED">Annulé</option>
                </select>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 mb-1">Service</p>
                <p className="font-semibold text-slate-900">{selected.service.name}</p>
                <p className="text-sm text-slate-500">{selected.service.duration} min — <span className="font-medium">{selected.totalPrice} TND</span></p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 mb-1">Date & Heure</p>
                <p className="font-medium text-slate-900">{formatDate(selected.date)}</p>
                <p className="text-sky-600 font-bold">{selected.timeSlot}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs font-medium text-slate-500 mb-1">Client</p>
                <p className="font-medium text-slate-900">{selected.customerName}</p>
                <p className="text-sm text-slate-600">{selected.customerPhone}</p>
                {selected.customerEmail && <p className="text-sm text-slate-500">{selected.customerEmail}</p>}
              </div>
              {(selected.carBrand || selected.carModel || selected.carPlate) && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 mb-1">Véhicule</p>
                  {(selected.carBrand || selected.carModel) && (
                    <p className="font-medium text-slate-900">{[selected.carBrand, selected.carModel].filter(Boolean).join(" ")}</p>
                  )}
                  {selected.carPlate && <p className="text-sm font-mono text-slate-600">{selected.carPlate}</p>}
                  {selected.carColor && <p className="text-sm text-slate-500">{selected.carColor}</p>}
                </div>
              )}
              {selected.notes && (
                <div className="p-3 bg-slate-50 rounded-xl">
                  <p className="text-xs font-medium text-slate-500 mb-1">Notes</p>
                  <p className="text-sm text-slate-700">{selected.notes}</p>
                </div>
              )}
              <button
                onClick={() => deleteBooking(selected.id)}
                className="w-full py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
              >
                Supprimer la réservation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
