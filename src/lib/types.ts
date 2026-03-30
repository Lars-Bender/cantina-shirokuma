export type WineType = "Rot" | "Weiss" | "Rosé" | "Schaumwein" | "Dessertwein";

export interface Wine {
  id: string;
  name: string;
  producer: string;
  vintage: number;
  type: WineType;
  region: string;
  country: string;
  grapes: string[];
  alcohol: number;
  drinkFrom: number;
  drinkPeak: number;
  drinkUntil: number;
  pairing: string[];
  referencePrice: number;
  imageUrl?: string;
  description?: string;
  barcode?: string;
}

export interface StorageLocation {
  id: string;
  name: string;
  description?: string;
}

export interface InventoryItem {
  id: string;
  wineId: string;
  quantity: number;
  storageLocationId: string;
  purchasePrice?: number;
  purchaseDate: string;
  note?: string;
}

export interface CellarTransaction {
  id: string;
  wineId: string;
  type: "add" | "drink" | "remove";
  quantity: number;
  date: string;
  note?: string;
}

export interface TastingNote {
  id: string;
  wineId: string;
  date: string;
  rating: number;
  note: string;
}
