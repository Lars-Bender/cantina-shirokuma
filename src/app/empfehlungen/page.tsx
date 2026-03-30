"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "../layout-shell";
import { useCellarStore } from "@/lib/store";
import { WINE_CATALOG, getDrinkingStatus } from "@/lib/mock-wines";
import WineTypeBadge from "@/components/WineTypeBadge";
import DrinkStatusBadge from "@/components/DrinkStatusBadge";

const FOOD_TAGS = ["Rind", "Lamm", "Wild", "Fisch", "Meeresfrüchte", "Geflügel", "Pasta", "Käse", "Desserts", "Aperitif"];

export default function EmpfehlungenPage() {
  const { inventory } = useCellarStore();
  const [foodFilter, setFoodFilter] = useState("");

  const wineMap = useMemo(
    () => Object.fromEntries(WINE_CATALOG.map((w) => [w.id, w])),
    []
  );

  const enriched = useMemo(() => {
    return inventory
      .map((item) => {
        const wine = wineMap[item.wineId];
        if (!wine) return null;
        return { item, wine, status: getDrinkingStatus(wine) };
      })
      .filter(Boolean) as { item: typeof inventory[0]; wine: typeof WINE_CATALOG[0]; status: ReturnType<typeof getDrinkingStatus> }[];
  }, [inventory, wineMap]);

  const now = useMemo(() =>
    enriched.filter((e) => e.status === "peak"),
    [enriched]
  );

  const soon = useMemo(() =>
    enriched.filter((e) => e.status === "ready").slice(0, 5),
    [enriched]
  );

  const overdue = useMemo(() =>
    enriched.filter((e) => e.status === "overdue"),
    [enriched]
  );

  const pairing = useMemo(() => {
    if (!foodFilter) return [];
    return enriched.filter((e) =>
      e.wine.pairing.some((p) => p.toLowerCase().includes(foodFilter.toLowerCase()))
    );
  }, [enriched, foodFilter]);

  if (inventory.length === 0) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto px-4 pt-14">
          <h1 className="text-2xl font-bold mb-2" style={{ color: "#1A1208" }}>Empfehlungen</h1>
          <div className="text-center py-20">
            <p className="text-5xl mb-4">✨</p>
            <p className="font-medium mb-2" style={{ color: "#1A1208" }}>Kein Keller, keine Empfehlungen</p>
            <p className="text-sm" style={{ color: "#6B5E4E" }}>
              Füge zuerst Weine zu deinem Keller hinzu
            </p>
            <Link
              href="/scan"
              className="inline-block mt-4 px-5 py-2.5 rounded-xl font-semibold text-sm"
              style={{ background: "#6B1A2A", color: "white" }}
            >
              Wein hinzufügen
            </Link>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto px-4">
        <div className="pt-14 pb-5">
          <h1 className="text-2xl font-bold" style={{ color: "#1A1208" }}>Empfehlungen</h1>
          <p className="text-sm mt-1" style={{ color: "#6B5E4E" }}>
            Basierend auf deinem Keller
          </p>
        </div>

        {/* Food Pairing Filter */}
        <section className="mb-8">
          <h2 className="text-base font-bold mb-3" style={{ color: "#1A1208" }}>
            Passt zu…
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {FOOD_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setFoodFilter(foodFilter === tag ? "" : tag)}
                className="flex-shrink-0 px-3 py-2 rounded-full text-sm font-medium border transition-all"
                style={{
                  background: foodFilter === tag ? "#B5862B" : "white",
                  color: foodFilter === tag ? "white" : "#6B5E4E",
                  borderColor: foodFilter === tag ? "#B5862B" : "#D4C9B8",
                }}
              >
                {tag}
              </button>
            ))}
          </div>

          {foodFilter && pairing.length > 0 && (
            <div className="mt-3 space-y-2 animate-fade-up">
              {pairing.map(({ item, wine, status }) => (
                <WineRecoCard key={item.id} item={item} wine={wine} status={status} />
              ))}
            </div>
          )}
          {foodFilter && pairing.length === 0 && (
            <p className="text-sm mt-3" style={{ color: "#9B8E7E" }}>
              Kein passender Wein im Keller für &quot;{foodFilter}&quot;
            </p>
          )}
        </section>

        {/* Jetzt im Peak */}
        {now.length > 0 && (
          <section className="mb-8">
            <SectionHeader title="Jetzt im idealen Trinkfenster" badge={`${now.length}`} badgeColor="#1A6B2A" />
            <div className="space-y-2 mt-3">
              {now.map(({ item, wine, status }) => (
                <WineRecoCard key={item.id} item={item} wine={wine} status={status} />
              ))}
            </div>
          </section>
        )}

        {/* Bald trinken */}
        {soon.length > 0 && (
          <section className="mb-8">
            <SectionHeader title="Bald trinken" badge={`${soon.length}`} badgeColor="#B5862B" />
            <div className="space-y-2 mt-3">
              {soon.map(({ item, wine, status }) => (
                <WineRecoCard key={item.id} item={item} wine={wine} status={status} />
              ))}
            </div>
          </section>
        )}

        {/* Überreif */}
        {overdue.length > 0 && (
          <section className="mb-8">
            <SectionHeader title="Über dem Peak — schnell öffnen" badge={`${overdue.length}`} badgeColor="#802020" />
            <div className="space-y-2 mt-3">
              {overdue.map(({ item, wine, status }) => (
                <WineRecoCard key={item.id} item={item} wine={wine} status={status} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function SectionHeader({ title, badge, badgeColor }: { title: string; badge: string; badgeColor: string }) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-base font-bold" style={{ color: "#1A1208" }}>{title}</h2>
      <span
        className="text-xs px-2 py-0.5 rounded-full font-semibold"
        style={{ background: `${badgeColor}18`, color: badgeColor }}
      >
        {badge}
      </span>
    </div>
  );
}

function WineRecoCard({ item, wine, status }: {
  item: { id: string; quantity: number };
  wine: typeof WINE_CATALOG[0];
  status: ReturnType<typeof getDrinkingStatus>;
}) {
  return (
    <Link
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
          {wine.producer}
        </p>
        <div className="flex items-center gap-2 mt-1.5">
          <WineTypeBadge type={wine.type} small />
          <DrinkStatusBadge status={status} />
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-xl font-bold" style={{ color: "#6B1A2A", fontFamily: "Georgia, serif" }}>
          {item.quantity}×
        </p>
        <p className="text-xs" style={{ color: "#9B8E7E" }}>Fl.</p>
      </div>
    </Link>
  );
}
