"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { InventoryItem, CellarTransaction, StorageLocation, TastingNote } from "./types";

function genId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

interface CellarStore {
  inventory: InventoryItem[];
  transactions: CellarTransaction[];
  locations: StorageLocation[];
  tastingNotes: TastingNote[];

  // Inventory actions
  addWine: (wineId: string, quantity: number, locationId: string, purchasePrice?: number) => void;
  drinkWine: (itemId: string, quantity: number, note?: string) => void;
  removeWine: (itemId: string, quantity: number) => void;
  updateQuantity: (itemId: string, quantity: number) => void;

  // Location actions
  addLocation: (name: string, description?: string) => StorageLocation;
  removeLocation: (id: string) => void;

  // Tasting note actions
  addTastingNote: (wineId: string, rating: number, note: string) => void;
}

const DEFAULT_LOCATIONS: StorageLocation[] = [
  { id: "loc1", name: "Hauptkeller", description: "Kellerschrank unten" },
  { id: "loc2", name: "Weinkühlschrank", description: "Oben, 12°C" },
  { id: "loc3", name: "Speisekammer", description: "Dunkel und kühl" },
];

export const useCellarStore = create<CellarStore>()(
  persist(
    (set, get) => ({
      inventory: [],
      transactions: [],
      locations: DEFAULT_LOCATIONS,
      tastingNotes: [],

      addWine: (wineId, quantity, locationId, purchasePrice) => {
        const item: InventoryItem = {
          id: genId(),
          wineId,
          quantity,
          storageLocationId: locationId,
          purchasePrice,
          purchaseDate: new Date().toISOString(),
        };
        const tx: CellarTransaction = {
          id: genId(),
          wineId,
          type: "add",
          quantity,
          date: new Date().toISOString(),
        };
        set((s) => ({
          inventory: [...s.inventory, item],
          transactions: [tx, ...s.transactions],
        }));
      },

      drinkWine: (itemId, quantity, note) => {
        const item = get().inventory.find((i) => i.id === itemId);
        if (!item) return;
        const newQty = item.quantity - quantity;
        const tx: CellarTransaction = {
          id: genId(),
          wineId: item.wineId,
          type: "drink",
          quantity,
          date: new Date().toISOString(),
          note,
        };
        set((s) => ({
          inventory:
            newQty <= 0
              ? s.inventory.filter((i) => i.id !== itemId)
              : s.inventory.map((i) =>
                  i.id === itemId ? { ...i, quantity: newQty } : i
                ),
          transactions: [tx, ...s.transactions],
        }));
      },

      removeWine: (itemId, quantity) => {
        const item = get().inventory.find((i) => i.id === itemId);
        if (!item) return;
        const newQty = item.quantity - quantity;
        const tx: CellarTransaction = {
          id: genId(),
          wineId: item.wineId,
          type: "remove",
          quantity,
          date: new Date().toISOString(),
        };
        set((s) => ({
          inventory:
            newQty <= 0
              ? s.inventory.filter((i) => i.id !== itemId)
              : s.inventory.map((i) =>
                  i.id === itemId ? { ...i, quantity: newQty } : i
                ),
          transactions: [tx, ...s.transactions],
        }));
      },

      updateQuantity: (itemId, quantity) => {
        set((s) => ({
          inventory: s.inventory.map((i) =>
            i.id === itemId ? { ...i, quantity } : i
          ),
        }));
      },

      addLocation: (name, description) => {
        const loc: StorageLocation = { id: genId(), name, description };
        set((s) => ({ locations: [...s.locations, loc] }));
        return loc;
      },

      removeLocation: (id) => {
        set((s) => ({ locations: s.locations.filter((l) => l.id !== id) }));
      },

      addTastingNote: (wineId, rating, note) => {
        const tn: TastingNote = {
          id: genId(),
          wineId,
          date: new Date().toISOString(),
          rating,
          note,
        };
        set((s) => ({ tastingNotes: [tn, ...s.tastingNotes] }));
      },
    }),
    {
      name: "cantina-cellar",
    }
  )
);

// Derived helpers
export function getTotalBottles(inventory: InventoryItem[]): number {
  return inventory.reduce((sum, i) => sum + i.quantity, 0);
}

export function getCellarValue(
  inventory: InventoryItem[],
  wineMap: Record<string, { referencePrice: number }>
): number {
  return inventory.reduce((sum, i) => {
    const price = i.purchasePrice ?? wineMap[i.wineId]?.referencePrice ?? 0;
    return sum + price * i.quantity;
  }, 0);
}
