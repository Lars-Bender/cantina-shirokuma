"use client";

import { useMemo } from "react";
import Link from "next/link";
import AppShell from "./layout-shell";
import { useCellarStore, getTotalBottles, getCellarValue } from "@/lib/store";
import { WINE_CATALOG, getDrinkingStatus } from "@/lib/mock-wines";
import WineTypeBadge from "@/components/WineTypeBadge";

export default function HomePage() {
  const { inventory, transactions, locations } = useCellarStore();

  const wineMap = useMemo(() => {
    return Object.fromEntries(WINE_CATALOG.map((w) => [w.id, w]));
  }, []);

  const totalBottles = getTotalBottles(inventory);
  const cellarValue = getCellarValue(inventory, wineMap);

  const peakWines = useMemo(() => {
    return inventory
      .filter((item) => {
        const wine = wineMap[item.wineId];
        if (!wine) return false;
        const status = getDrinkingStatus(wine);
        return status === "peak" || status === "ready";
      })
      .slice(0, 5);
  }, [inventory, wineMap]);

  const recentTx = transactions.slice(0, 5);

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4">
        {/* Header */}
        <div className="pt-14 pb-6">
          <p className="text-sm" style={{ color: "#6B5E4E" }}>Guten Abend</p>
          <h1 className="text-3xl font-bold mt-0.5" style={{ color: "#1A1208" }}>
            Dein Keller
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            value={totalBottles}
            label="Flaschen"
            icon="🍾"
            href="/keller"
          />
          <StatCard
            value={`CHF ${cellarValue.toLocaleString("de-CH", { maximumFractionDigits: 0 })}`}
            label="Kellerwert"
            icon="💰"
          />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3 mb-8">
          <Link
            href="/scan"
            className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm transition-transform active:scale-98"
            style={{ background: "#6B1A2A", color: "white" }}
          >
            <ScanIcon />
            Wein scannen
          </Link>
          <Link
            href="/keller"
            className="flex-1 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-semibold text-sm border transition-transform active:scale-98"
            style={{ background: "transparent", color: "#6B1A2A", borderColor: "#D4C9B8" }}
          >
            <ListIcon />
            Keller öffnen
          </Link>
        </div>

        {/* Drink now */}
        {peakWines.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold" style={{ color: "#1A1208" }}>
                Jetzt trinken
              </h2>
              <Link href="/empfehlungen" className="text-sm font-medium" style={{ color: "#B5862B" }}>
                Alle →
              </Link>
            </div>
            <div className="space-y-2">
              {peakWines.map((item) => {
                const wine = wineMap[item.wineId];
                if (!wine) return null;
                return (
                  <Link
                    key={item.id}
                    href={`/keller/${item.id}`}
                    className="flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:opacity-80"
                    style={{ background: "white", borderColor: "#EDE8DF" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: "#6B1A2A12" }}
                    >
                      🍷
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate" style={{ color: "#1A1208" }}>
                        {wine.name} {wine.vintage}
                      </p>
                      <p className="text-xs truncate" style={{ color: "#6B5E4E" }}>
                        {wine.producer} · {item.quantity} Fl.
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <WineTypeBadge type={wine.type} small />
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Empty state */}
        {inventory.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🍾</div>
            <h2 className="text-xl font-bold mb-2" style={{ color: "#1A1208" }}>
              Dein Keller ist leer
            </h2>
            <p className="text-sm mb-6" style={{ color: "#6B5E4E" }}>
              Scanne deine erste Flasche und baue deinen digitalen Keller auf.
            </p>
            <Link
              href="/scan"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm"
              style={{ background: "#6B1A2A", color: "white" }}
            >
              <ScanIcon />
              Erste Flasche scannen
            </Link>
          </div>
        )}

        {/* Recent Activity */}
        {recentTx.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold mb-3" style={{ color: "#1A1208" }}>
              Letzte Aktivität
            </h2>
            <div className="space-y-2">
              {recentTx.map((tx) => {
                const wine = wineMap[tx.wineId];
                const txLabel =
                  tx.type === "add" ? "Hinzugefügt" :
                  tx.type === "drink" ? "Getrunken" : "Entfernt";
                const txColor =
                  tx.type === "add" ? "#1A6B2A" :
                  tx.type === "drink" ? "#6B1A2A" : "#6B5E4E";
                return (
                  <div
                    key={tx.id}
                    className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: "#EDE8DF" }}
                  >
                    <span className="text-lg">{tx.type === "add" ? "+" : "−"}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: "#1A1208" }}>
                        {wine ? `${wine.name} ${wine.vintage}` : "Unbekannter Wein"}
                      </p>
                      <p className="text-xs" style={{ color: "#6B5E4E" }}>
                        {new Date(tx.date).toLocaleDateString("de-CH", { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <span className="text-xs font-semibold" style={{ color: txColor }}>
                      {txLabel} {tx.quantity}×
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function StatCard({ value, label, icon, href }: { value: string | number; label: string; icon: string; href?: string }) {
  const content = (
    <div
      className="rounded-2xl p-4 border"
      style={{ background: "white", borderColor: "#EDE8DF" }}
    >
      <span className="text-2xl">{icon}</span>
      <p className="text-2xl font-bold mt-2" style={{ color: "#1A1208", fontFamily: "Georgia, serif" }}>
        {value}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "#6B5E4E" }}>{label}</p>
    </div>
  );
  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function ScanIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V4a1 1 0 011-1h3M17 3h3a1 1 0 011 1v3M21 17v3a1 1 0 01-1 1h-3M7 21H4a1 1 0 01-1-1v-3" />
      <line x1="7" y1="12" x2="17" y2="12" strokeWidth="2.5" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  );
}
