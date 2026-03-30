"use client";

import { useState } from "react";
import { Wine } from "@/lib/types";
import { useCellarStore } from "@/lib/store";
import WineTypeBadge from "./WineTypeBadge";

interface Props {
  wine: Wine;
  onClose: () => void;
  onAdded?: () => void;
}

export default function AddWineModal({ wine, onClose, onAdded }: Props) {
  const { locations, addWine } = useCellarStore();
  const [quantity, setQuantity] = useState(1);
  const [locationId, setLocationId] = useState(locations[0]?.id ?? "");
  const [price, setPrice] = useState(String(wine.referencePrice));
  const [success, setSuccess] = useState(false);

  function handleAdd() {
    addWine(wine.id, quantity, locationId, price ? parseFloat(price) : undefined);
    setSuccess(true);
    setTimeout(() => { onAdded?.(); onClose(); }, 1200);
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={onClose} />
        <div className="relative w-full max-w-lg animate-slide-up rounded-t-2xl p-8 flex flex-col items-center gap-3"
          style={{ background: "#F5F0E8" }}>
          <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
            style={{ background: "#6B1A2A18" }}>
            🍷
          </div>
          <h3 className="text-xl font-bold" style={{ color: "#6B1A2A" }}>Zum Keller hinzugefügt</h3>
          <p className="text-sm text-center" style={{ color: "#6B5E4E" }}>
            {quantity} Flasche{quantity > 1 ? "n" : ""} {wine.name} {wine.vintage}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onClose} />
      <div
        className="relative w-full max-w-lg animate-slide-up rounded-t-2xl overflow-hidden"
        style={{ background: "#F5F0E8" }}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b" style={{ borderColor: "#D4C9B8" }}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <WineTypeBadge type={wine.type} small />
                <span className="text-xs" style={{ color: "#6B5E4E" }}>{wine.vintage}</span>
              </div>
              <h2 className="text-lg font-bold leading-tight" style={{ color: "#1A1208" }}>
                {wine.name}
              </h2>
              <p className="text-sm" style={{ color: "#6B5E4E" }}>{wine.producer}</p>
            </div>
            <button onClick={onClose} className="p-1 rounded-full mt-1" style={{ color: "#6B5E4E" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-5 py-5 space-y-4">
          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#1A1208" }}>
              Anzahl Flaschen
            </label>
            <div className="flex items-center gap-4">
              <button
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold transition-colors"
                style={{ background: "#EDE8DF", color: "#6B1A2A" }}
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                −
              </button>
              <span className="text-3xl font-bold w-12 text-center" style={{ color: "#1A1208", fontFamily: "Georgia, serif" }}>
                {quantity}
              </span>
              <button
                className="w-11 h-11 rounded-full flex items-center justify-center text-xl font-bold transition-colors"
                style={{ background: "#EDE8DF", color: "#6B1A2A" }}
                onClick={() => setQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#1A1208" }}>
              Lagerort
            </label>
            <div className="flex flex-wrap gap-2">
              {locations.map((loc) => (
                <button
                  key={loc.id}
                  onClick={() => setLocationId(loc.id)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium border transition-all"
                  style={{
                    background: locationId === loc.id ? "#6B1A2A" : "#EDE8DF",
                    color: locationId === loc.id ? "white" : "#6B5E4E",
                    borderColor: locationId === loc.id ? "#6B1A2A" : "#D4C9B8",
                  }}
                >
                  {loc.name}
                </button>
              ))}
            </div>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#1A1208" }}>
              Kaufpreis (CHF) <span className="font-normal" style={{ color: "#9B8E7E" }}>— optional</span>
            </label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={String(wine.referencePrice)}
              className="w-full px-4 py-3 rounded-xl border text-base outline-none focus:ring-2"
              style={{
                background: "#EDE8DF",
                borderColor: "#D4C9B8",
                color: "#1A1208",
              }}
            />
          </div>
        </div>

        {/* CTA */}
        <div className="px-5 pb-6">
          <button
            onClick={handleAdd}
            className="w-full py-4 rounded-2xl text-base font-semibold transition-transform active:scale-98"
            style={{ background: "#6B1A2A", color: "white" }}
          >
            Zum Keller hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}
