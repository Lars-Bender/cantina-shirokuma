"use client";

import { use, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCellarStore } from "@/lib/store";
import { getWineById, getDrinkingStatus } from "@/lib/mock-wines";
import WineTypeBadge from "@/components/WineTypeBadge";
import DrinkStatusBadge from "@/components/DrinkStatusBadge";

export default function WineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { inventory, locations, drinkWine, removeWine, addTastingNote } = useCellarStore();

  const item = inventory.find((i) => i.id === id);
  const wine = item ? getWineById(item.wineId) : null;
  const loc = item ? locations.find((l) => l.id === item.storageLocationId) : null;

  // Snapshot wine/item so they survive the inventory update during "drink last bottle"
  const wineSnapshot = useRef(wine);
  const itemSnapshot = useRef(item);
  if (wine) wineSnapshot.current = wine;
  if (item) itemSnapshot.current = item;

  const [showDrink, setShowDrink] = useState(false);
  const [drinkQty, setDrinkQty] = useState(1);
  const [drinkNote, setDrinkNote] = useState("");
  const [showTasting, setShowTasting] = useState(false);
  const [rating, setRating] = useState(4);
  const [tastingText, setTastingText] = useState("");
  const [showRemove, setShowRemove] = useState(false);
  const [success, setSuccess] = useState<"drink" | "tasting" | "remove" | null>(null);
  const [successQty, setSuccessQty] = useState(1);

  // Use snapshots when item/wine might be gone (after last bottle drunk/removed)
  const displayItem = item ?? itemSnapshot.current;
  const displayWine = wine ?? wineSnapshot.current;

  if (!displayItem || !displayWine) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <p className="text-4xl mb-3">🍷</p>
        <p className="font-medium" style={{ color: "#1A1208" }}>Wein nicht gefunden</p>
        <Link href="/keller" className="mt-4 inline-block text-sm font-medium" style={{ color: "#6B1A2A" }}>
          ← Zurück zum Keller
        </Link>
      </div>
    );
  }

  const status = getDrinkingStatus(displayWine);
  const year = new Date().getFullYear();
  const range = displayWine.drinkUntil - displayWine.drinkFrom;
  const peakProgress = range > 0
    ? Math.min(100, Math.max(0, ((year - displayWine.drinkFrom) / range) * 100))
    : 50;

  function handleDrink() {
    const qty = drinkQty;
    setSuccessQty(qty);
    drinkWine(displayItem!.id, qty, drinkNote || undefined);
    setSuccess("drink");
    setShowDrink(false);
    setTimeout(() => { setSuccess(null); router.push("/keller"); }, 1500);
  }

  function handleTasting() {
    addTastingNote(displayWine!.id, rating, tastingText);
    setSuccess("tasting");
    setShowTasting(false);
    setTimeout(() => setSuccess(null), 1500);
  }

  function handleRemove() {
    removeWine(displayItem!.id, displayItem!.quantity);
    setSuccess("remove");
    setShowRemove(false);
    setTimeout(() => { setSuccess(null); router.push("/keller"); }, 1500);
  }

  return (
    <div className="min-h-screen" style={{ background: "#F5F0E8" }}>
      {/* Success toast */}
      {success && (
        <div
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg animate-fade-up"
          style={{ background: success === "remove" ? "#802020" : "#6B1A2A", color: "white", whiteSpace: "nowrap" }}
        >
          {success === "drink"
            ? `${successQty} Flasche${successQty > 1 ? "n" : ""} getrunken 🍷`
            : success === "tasting"
            ? "Tasting Note gespeichert ✓"
            : "Wein aus Keller entfernt"}
        </div>
      )}

      <div className="max-w-lg mx-auto">
        {/* Top bar */}
        <div className="px-4 pt-14 pb-2 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full flex items-center justify-center"
            style={{ background: "#EDE8DF" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1A1208" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <span className="text-sm font-medium" style={{ color: "#6B5E4E" }}>Keller</span>
        </div>

        {/* Wine header */}
        <div className="px-4 py-4">
          <div
            className="w-full rounded-3xl p-6 relative overflow-hidden"
            style={{ background: "#6B1A2A" }}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className="text-xs px-2.5 py-0.5 rounded-full font-medium"
                    style={{ background: "rgba(255,255,255,0.2)", color: "white" }}
                  >
                    {displayWine.type}
                  </span>
                  <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {displayWine.vintage}
                  </span>
                </div>
                <h1 className="text-2xl font-bold leading-tight" style={{ color: "white" }}>
                  {displayWine.name}
                </h1>
                <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                  {displayWine.producer}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                  {displayWine.region}, {displayWine.country}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p
                  className="text-5xl font-bold"
                  style={{ color: "white", fontFamily: "Georgia, serif", lineHeight: 1 }}
                >
                  {displayItem.quantity}
                </p>
                <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Flaschen
                </p>
              </div>
            </div>

            {/* Location */}
            <div
              className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: "rgba(255,255,255,0.12)" }}
            >
              <span className="text-sm">📍</span>
              <span className="text-sm" style={{ color: "rgba(255,255,255,0.85)" }}>
                {loc?.name ?? "Kein Lagerort"}{loc?.description ? ` · ${loc.description}` : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Drink window */}
        <div className="px-4 mb-4">
          <div
            className="p-4 rounded-2xl border"
            style={{ background: "white", borderColor: "#EDE8DF" }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-sm" style={{ color: "#1A1208" }}>Trinkfenster</span>
              <DrinkStatusBadge status={status} />
            </div>
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: "#9B8E7E" }}>
              <span>{displayWine.drinkFrom}</span>
              <span>Peak {displayWine.drinkPeak}</span>
              <span>{displayWine.drinkUntil}</span>
            </div>
            <div className="w-full rounded-full h-2" style={{ background: "#EDE8DF" }}>
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${peakProgress}%`,
                  background: status === "peak" ? "#1A6B2A" : status === "ready" ? "#B5862B" : status === "overdue" ? "#802020" : "#6B5E4E",
                }}
              />
            </div>
            {displayWine.description && (
              <p className="text-xs mt-3 leading-relaxed" style={{ color: "#6B5E4E" }}>
                {displayWine.description}
              </p>
            )}
          </div>
        </div>

        {/* Details grid */}
        <div className="px-4 mb-4 grid grid-cols-2 gap-3">
          <InfoCard label="Trauben" value={displayWine.grapes.join(", ") || "—"} />
          <InfoCard label="Alkohol" value={`${displayWine.alcohol}%`} />
          <InfoCard label="Region" value={displayWine.region} />
          <InfoCard label="Kaufpreis" value={displayItem.purchasePrice ? `CHF ${displayItem.purchasePrice}` : `ca. CHF ${displayWine.referencePrice}`} />
        </div>

        {/* Food Pairing */}
        {displayWine.pairing.length > 0 && (
          <div className="px-4 mb-4">
            <div
              className="p-4 rounded-2xl border"
              style={{ background: "white", borderColor: "#EDE8DF" }}
            >
              <p className="font-semibold text-sm mb-3" style={{ color: "#1A1208" }}>
                Passt hervorragend zu
              </p>
              <div className="flex flex-wrap gap-2">
                {displayWine.pairing.map((p) => (
                  <span
                    key={p}
                    className="px-3 py-1.5 rounded-full text-xs font-medium"
                    style={{ background: "#B5862B18", color: "#8B6520" }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-4 pb-32 space-y-3">
          <button
            onClick={() => setShowDrink(true)}
            className="w-full py-4 rounded-2xl font-semibold text-base transition-transform active:scale-98"
            style={{ background: "#6B1A2A", color: "white" }}
          >
            🍷 Flasche trinken
          </button>
          <button
            onClick={() => setShowTasting(true)}
            className="w-full py-3.5 rounded-2xl font-medium text-sm border"
            style={{ background: "transparent", color: "#6B1A2A", borderColor: "#D4C9B8" }}
          >
            Tasting Note hinzufügen
          </button>
          <button
            onClick={() => setShowRemove(true)}
            className="w-full py-3.5 rounded-2xl font-medium text-sm border"
            style={{ background: "transparent", color: "#9B8E7E", borderColor: "#EDE8DF" }}
          >
            Aus Keller entfernen
          </button>
        </div>
      </div>

      {/* Drink Modal */}
      {showDrink && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setShowDrink(false)} />
          <div
            className="relative w-full max-w-lg animate-slide-up rounded-t-2xl p-5"
            style={{ background: "#F5F0E8" }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: "#1A1208" }}>
              Wie viele Flaschen?
            </h3>
            <div className="flex items-center gap-4 mb-5">
              <button
                onClick={() => setDrinkQty(Math.max(1, drinkQty - 1))}
                className="w-11 h-11 rounded-full text-xl font-bold"
                style={{ background: "#EDE8DF", color: "#6B1A2A" }}
              >−</button>
              <span className="text-3xl font-bold w-12 text-center" style={{ fontFamily: "Georgia, serif" }}>
                {drinkQty}
              </span>
              <button
                onClick={() => setDrinkQty(Math.min(displayItem.quantity, drinkQty + 1))}
                className="w-11 h-11 rounded-full text-xl font-bold"
                style={{ background: "#EDE8DF", color: "#6B1A2A" }}
              >+</button>
              <span className="text-sm" style={{ color: "#9B8E7E" }}>von {displayItem.quantity}</span>
            </div>
            <textarea
              value={drinkNote}
              onChange={(e) => setDrinkNote(e.target.value)}
              placeholder="Kurze Notiz (optional)…"
              rows={2}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-4 resize-none"
              style={{ background: "#EDE8DF", borderColor: "#D4C9B8", color: "#1A1208" }}
            />
            <button
              onClick={handleDrink}
              className="w-full py-4 rounded-2xl font-semibold text-base"
              style={{ background: "#6B1A2A", color: "white" }}
            >
              {drinkQty} Flasche{drinkQty > 1 ? "n" : ""} getrunken
            </button>
          </div>
        </div>
      )}

      {/* Tasting Modal */}
      {showTasting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setShowTasting(false)} />
          <div
            className="relative w-full max-w-lg animate-slide-up rounded-t-2xl p-5"
            style={{ background: "#F5F0E8" }}
          >
            <h3 className="text-lg font-bold mb-4" style={{ color: "#1A1208" }}>Tasting Note</h3>
            <div className="flex gap-2 mb-4">
              {[1,2,3,4,5].map((r) => (
                <button
                  key={r}
                  onClick={() => setRating(r)}
                  className="text-2xl transition-transform active:scale-90"
                >
                  {r <= rating ? "⭐" : "☆"}
                </button>
              ))}
            </div>
            <textarea
              value={tastingText}
              onChange={(e) => setTastingText(e.target.value)}
              placeholder="Nase, Geschmack, Abgang…"
              rows={4}
              className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-4 resize-none"
              style={{ background: "#EDE8DF", borderColor: "#D4C9B8", color: "#1A1208" }}
            />
            <button
              onClick={handleTasting}
              className="w-full py-4 rounded-2xl font-semibold"
              style={{ background: "#6B1A2A", color: "white" }}
            >
              Speichern
            </button>
          </div>
        </div>
      )}

      {/* Remove Confirmation Modal */}
      {showRemove && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setShowRemove(false)} />
          <div
            className="relative w-full max-w-lg animate-slide-up rounded-t-2xl p-5"
            style={{ background: "#F5F0E8" }}
          >
            <h3 className="text-lg font-bold mb-2" style={{ color: "#1A1208" }}>Wein entfernen?</h3>
            <p className="text-sm mb-6" style={{ color: "#6B5E4E" }}>
              {displayItem.quantity} Flasche{displayItem.quantity > 1 ? "n" : ""} <strong style={{ color: "#1A1208" }}>{displayWine.name} {displayWine.vintage}</strong> werden aus dem Keller entfernt.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRemove(false)}
                className="flex-1 py-3.5 rounded-2xl font-medium text-sm border"
                style={{ background: "transparent", color: "#6B5E4E", borderColor: "#D4C9B8" }}
              >
                Abbrechen
              </button>
              <button
                onClick={handleRemove}
                className="flex-1 py-3.5 rounded-2xl font-semibold text-sm"
                style={{ background: "#802020", color: "white" }}
              >
                Entfernen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3.5 rounded-2xl border" style={{ background: "white", borderColor: "#EDE8DF" }}>
      <p className="text-xs mb-1" style={{ color: "#9B8E7E" }}>{label}</p>
      <p className="text-sm font-semibold" style={{ color: "#1A1208" }}>{value}</p>
    </div>
  );
}
