"use client";

import { useState } from "react";
import AppShell from "../layout-shell";
import { useCellarStore } from "@/lib/store";
import { WINE_CATALOG } from "@/lib/mock-wines";

export default function ProfilPage() {
  const { inventory, transactions, locations, addLocation, removeLocation } = useCellarStore();
  const [newLoc, setNewLoc] = useState("");
  const [showAddLoc, setShowAddLoc] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const totalBottles = inventory.reduce((s, i) => s + i.quantity, 0);
  const totalWines = inventory.length;
  const totalTx = transactions.length;

  const wineMap = Object.fromEntries(WINE_CATALOG.map((w) => [w.id, w]));
  const cellarValue = inventory.reduce((sum, i) => {
    const price = i.purchasePrice ?? wineMap[i.wineId]?.referencePrice ?? 0;
    return sum + price * i.quantity;
  }, 0);

  function handleAddLocation() {
    if (newLoc.trim()) {
      addLocation(newLoc.trim());
      setNewLoc("");
      setShowAddLoc(false);
    }
  }

  function exportCSV() {
    const rows = [["Name", "Produzent", "Jahrgang", "Typ", "Region", "Menge", "Lagerort", "Kaufpreis"]];
    inventory.forEach((item) => {
      const wine = wineMap[item.wineId];
      const loc = locations.find((l) => l.id === item.storageLocationId);
      if (wine) {
        rows.push([
          wine.name, wine.producer, String(wine.vintage), wine.type, wine.region,
          String(item.quantity), loc?.name ?? "", String(item.purchasePrice ?? wine.referencePrice),
        ]);
      }
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cantina-keller.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="pt-14 pb-6">
          <h1 className="text-2xl font-bold" style={{ color: "#1A1208" }}>Profil</h1>
        </div>

        {/* Stats */}
        <div className="p-5 rounded-2xl mb-6" style={{ background: "#6B1A2A" }}>
          <p className="text-sm mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>Dein Keller</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-3xl font-bold" style={{ color: "white", fontFamily: "Georgia, serif" }}>
                {totalBottles}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>Flaschen</p>
            </div>
            <div>
              <p className="text-3xl font-bold" style={{ color: "white", fontFamily: "Georgia, serif" }}>
                {totalWines}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>Positionen</p>
            </div>
            <div>
              <p className="text-2xl font-bold" style={{ color: "#D4A845", fontFamily: "Georgia, serif" }}>
                {cellarValue > 0 ? `${cellarValue.toLocaleString("de-CH", { maximumFractionDigits: 0 })}` : "—"}
              </p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>CHF Wert</p>
            </div>
          </div>
        </div>

        {/* Storage Locations */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-bold" style={{ color: "#1A1208" }}>Lagerorte</h2>
            <button
              onClick={() => setShowAddLoc(true)}
              className="text-sm font-medium"
              style={{ color: "#B5862B" }}
            >
              + Neu
            </button>
          </div>

          <div className="space-y-2">
            {locations.map((loc) => {
              const count = inventory.filter((i) => i.storageLocationId === loc.id)
                .reduce((s, i) => s + i.quantity, 0);
              return (
                <div
                  key={loc.id}
                  className="flex items-center justify-between p-4 rounded-2xl border"
                  style={{ background: "white", borderColor: "#EDE8DF" }}
                >
                  <div>
                    <p className="font-medium text-sm" style={{ color: "#1A1208" }}>{loc.name}</p>
                    {loc.description && (
                      <p className="text-xs mt-0.5" style={{ color: "#9B8E7E" }}>{loc.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color: "#6B5E4E" }}>
                      {count} Fl.
                    </span>
                    {!["loc1", "loc2", "loc3"].includes(loc.id) && (
                      <button
                        onClick={() => removeLocation(loc.id)}
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: "#EDE8DF" }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#9B8E7E" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {showAddLoc && (
            <div className="mt-3 flex gap-2">
              <input
                autoFocus
                type="text"
                value={newLoc}
                onChange={(e) => setNewLoc(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddLocation()}
                placeholder="Name des Lagerorts…"
                className="flex-1 px-4 py-2.5 rounded-xl border text-sm outline-none"
                style={{ background: "white", borderColor: "#D4C9B8", color: "#1A1208" }}
              />
              <button
                onClick={handleAddLocation}
                className="px-4 py-2.5 rounded-xl font-semibold text-sm"
                style={{ background: "#6B1A2A", color: "white" }}
              >
                OK
              </button>
            </div>
          )}
        </section>

        {/* Transaction History */}
        {transactions.length > 0 && (
          <section className="mb-6">
            <h2 className="text-base font-bold mb-3" style={{ color: "#1A1208" }}>
              Verlauf ({totalTx} Einträge)
            </h2>
            <div className="space-y-1.5">
              {transactions.slice(0, 10).map((tx) => {
                const wine = wineMap[tx.wineId];
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl"
                    style={{ background: "#EDE8DF" }}
                  >
                    <span className="text-base">
                      {tx.type === "add" ? "🍾" : tx.type === "drink" ? "🍷" : "📦"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1A1208" }}>
                        {wine ? `${wine.name} ${wine.vintage}` : "—"}
                      </p>
                      <p className="text-xs" style={{ color: "#9B8E7E" }}>
                        {new Date(tx.date).toLocaleDateString("de-CH", { day: "2-digit", month: "short", year: "2-digit" })}
                      </p>
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: tx.type === "add" ? "#1A6B2A" : "#6B1A2A" }}
                    >
                      {tx.type === "add" ? "+" : "−"}{tx.quantity}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Export */}
        <section className="mb-6">
          <h2 className="text-base font-bold mb-3" style={{ color: "#1A1208" }}>Daten</h2>
          <button
            onClick={exportCSV}
            className="w-full py-3.5 rounded-2xl border font-medium text-sm flex items-center justify-center gap-2 transition-all active:opacity-80"
            style={{ background: "white", borderColor: "#D4C9B8", color: "#1A1208" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Keller als CSV exportieren
          </button>
        </section>

        {/* App Info */}
        <div className="pb-8 text-center">
          <p className="text-xs" style={{ color: "#9B8E7E" }}>Cantina Shirokuma · v1.0 MVP</p>
          <p className="text-xs mt-1" style={{ color: "#9B8E7E" }}>Dein digitaler Weinkeller. Immer dabei.</p>
        </div>
      </div>
    </AppShell>
  );
}
