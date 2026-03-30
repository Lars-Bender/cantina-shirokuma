"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import AppShell from "../layout-shell";
import { useCellarStore } from "@/lib/store";
import { WINE_CATALOG, getDrinkingStatus } from "@/lib/mock-wines";
import { WineType } from "@/lib/types";
import WineTypeBadge from "@/components/WineTypeBadge";
import DrinkStatusBadge from "@/components/DrinkStatusBadge";

const TYPES: WineType[] = ["Rot", "Weiss", "Rosé", "Schaumwein", "Dessertwein"];
const SORT_OPTIONS = [
  { value: "name", label: "Name" },
  { value: "vintage", label: "Jahrgang" },
  { value: "status", label: "Trinkstatus" },
  { value: "quantity", label: "Anzahl" },
];

const STATUS_ORDER = { peak: 0, ready: 1, soon: 2, wait: 3, overdue: 4 };

export default function KellerPage() {
  const { inventory, locations } = useCellarStore();
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<WineType | "">("");
  const [filterLocation, setFilterLocation] = useState("");
  const [sort, setSort] = useState("status");

  const wineMap = useMemo(
    () => Object.fromEntries(WINE_CATALOG.map((w) => [w.id, w])),
    []
  );

  const filtered = useMemo(() => {
    return inventory
      .filter((item) => {
        const wine = wineMap[item.wineId];
        if (!wine) return false;
        if (filterType && wine.type !== filterType) return false;
        if (filterLocation && item.storageLocationId !== filterLocation) return false;
        if (search) {
          const q = search.toLowerCase();
          return (
            wine.name.toLowerCase().includes(q) ||
            wine.producer.toLowerCase().includes(q) ||
            wine.region.toLowerCase().includes(q) ||
            String(wine.vintage).includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        const wa = wineMap[a.wineId];
        const wb = wineMap[b.wineId];
        if (!wa || !wb) return 0;
        switch (sort) {
          case "name": return wa.name.localeCompare(wb.name);
          case "vintage": return wb.vintage - wa.vintage;
          case "quantity": return b.quantity - a.quantity;
          case "status":
          default:
            return STATUS_ORDER[getDrinkingStatus(wa)] - STATUS_ORDER[getDrinkingStatus(wb)];
        }
      });
  }, [inventory, wineMap, search, filterType, filterLocation, sort]);

  const totalBottles = inventory.reduce((s, i) => s + i.quantity, 0);

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="pt-14 pb-4 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: "#1A1208" }}>Mein Keller</h1>
            <p className="text-sm mt-0.5" style={{ color: "#6B5E4E" }}>
              {totalBottles} Flasche{totalBottles !== 1 ? "n" : ""} · {inventory.length} Position{inventory.length !== 1 ? "en" : ""}
            </p>
          </div>
          <Link
            href="/scan"
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "#6B1A2A", color: "white" }}
          >
            + Wein
          </Link>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-2xl border mb-4"
          style={{ background: "white", borderColor: "#D4C9B8" }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9B8E7E" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Suchen…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "#1A1208" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ color: "#9B8E7E" }}>✕</button>
          )}
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-1 mb-4 scrollbar-hide">
          {TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(filterType === t ? "" : t)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={{
                background: filterType === t ? "#6B1A2A" : "transparent",
                color: filterType === t ? "white" : "#6B5E4E",
                borderColor: filterType === t ? "#6B1A2A" : "#D4C9B8",
              }}
            >
              {t}
            </button>
          ))}
          {locations.map((l) => (
            <button
              key={l.id}
              onClick={() => setFilterLocation(filterLocation === l.id ? "" : l.id)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all"
              style={{
                background: filterLocation === l.id ? "#B5862B" : "transparent",
                color: filterLocation === l.id ? "white" : "#6B5E4E",
                borderColor: filterLocation === l.id ? "#B5862B" : "#D4C9B8",
              }}
            >
              {l.name}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
          <span className="text-xs flex-shrink-0" style={{ color: "#9B8E7E" }}>Sortierung:</span>
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => setSort(o.value)}
              className="flex-shrink-0 text-xs px-2.5 py-1 rounded-full font-medium transition-all"
              style={{
                background: sort === o.value ? "#EDE8DF" : "transparent",
                color: sort === o.value ? "#1A1208" : "#9B8E7E",
                fontWeight: sort === o.value ? "600" : "400",
              }}
            >
              {o.label}
            </button>
          ))}
        </div>

        {/* Wine List */}
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            {inventory.length === 0 ? (
              <>
                <p className="text-4xl mb-3">🍾</p>
                <p className="font-medium mb-1" style={{ color: "#1A1208" }}>Keller ist leer</p>
                <p className="text-sm" style={{ color: "#6B5E4E" }}>Füge deinen ersten Wein hinzu</p>
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: "#6B1A2A", color: "white" }}
                >
                  + Wein hinzufügen
                </Link>
              </>
            ) : (
              <>
                <p className="text-4xl mb-3">🔍</p>
                <p className="font-medium" style={{ color: "#1A1208" }}>Keine Treffer</p>
                <p className="text-sm mt-1" style={{ color: "#6B5E4E" }}>Filter anpassen</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2 animate-fade-up">
            {filtered.map((item) => {
              const wine = wineMap[item.wineId];
              if (!wine) return null;
              const status = getDrinkingStatus(wine);
              const loc = locations.find((l) => l.id === item.storageLocationId);
              return (
                <Link
                  key={item.id}
                  href={`/keller/${item.id}`}
                  className="flex items-center gap-3 p-4 rounded-2xl border transition-all active:opacity-80"
                  style={{ background: "white", borderColor: "#EDE8DF" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                    style={{ background: "#6B1A2A10" }}
                  >
                    🍷
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate" style={{ color: "#1A1208" }}>
                      {wine.name} {wine.vintage}
                    </p>
                    <p className="text-xs truncate mt-0.5" style={{ color: "#6B5E4E" }}>
                      {wine.producer} · {wine.region}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <WineTypeBadge type={wine.type} small />
                      <DrinkStatusBadge status={status} />
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-2xl font-bold" style={{ color: "#6B1A2A", fontFamily: "Georgia, serif" }}>
                      {item.quantity}
                    </p>
                    <p className="text-xs" style={{ color: "#9B8E7E" }}>
                      {loc?.name ?? "—"}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
