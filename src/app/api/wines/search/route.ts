import type { NextRequest } from "next/server";
import type { Wine, WineType } from "@/lib/types";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) return Response.json([]);

  try {
    const url = new URL("https://world.openfoodfacts.org/cgi/search.pl");
    url.searchParams.set("search_terms", q);
    url.searchParams.set("tagtype_0", "categories");
    url.searchParams.set("tag_0", "wines");
    url.searchParams.set("json", "1");
    url.searchParams.set("page_size", "20");
    url.searchParams.set(
      "fields",
      "id,product_name,brands,countries_tags,origins,categories_tags,nutriments,labels_tags"
    );

    const res = await fetch(url.toString(), {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return Response.json([]);

    const data = await res.json();
    const products: Record<string, unknown>[] = data.products ?? [];

    const wines: Wine[] = products
      .filter((p) => typeof p.product_name === "string" && p.product_name.trim().length > 0)
      .map((p, i) => mapProductToWine(p, i))
      .filter((w): w is Wine => w !== null)
      .slice(0, 12);

    return Response.json(wines);
  } catch {
    return Response.json([]);
  }
}

function mapProductToWine(p: Record<string, unknown>, index: number): Wine | null {
  const name = String(p.product_name ?? "").trim();
  if (!name) return null;

  // Extract vintage from product name
  const vintageMatch = name.match(/\b(19[5-9]\d|20[0-3]\d)\b/);
  const vintage = vintageMatch
    ? parseInt(vintageMatch[0])
    : new Date().getFullYear() - 3;

  // Wine type from categories
  const cats: string[] = Array.isArray(p.categories_tags)
    ? (p.categories_tags as string[])
    : [];
  const type = detectWineType(cats);

  // Country
  const countryTags: string[] = Array.isArray(p.countries_tags)
    ? (p.countries_tags as string[])
    : [];
  const country = countryTags[0]?.replace(/^[a-z]{2}:/, "") || "Unbekannt";

  // Region / origin
  const region = String(p.origins ?? "").trim() || country;

  // Alcohol
  const nutriments =
    typeof p.nutriments === "object" && p.nutriments !== null
      ? (p.nutriments as Record<string, unknown>)
      : {};
  const alcohol =
    parseFloat(String(nutriments["alcohol"] ?? "")) || 12.5;

  // Producer
  const producer =
    String(p.brands ?? "")
      .split(",")[0]
      .trim() || "Unbekannt";

  return {
    id: `off-${String(p.id ?? index)}`,
    name,
    producer,
    vintage,
    type,
    region,
    country,
    grapes: [],
    alcohol,
    ...drinkingWindow(type, vintage),
    pairing: [],
    referencePrice: 0,
  };
}

function detectWineType(cats: string[]): WineType {
  const s = cats.join(" ").toLowerCase();
  if (s.includes("red-wine") || s.includes("rotwein") || s.includes("vino-rosso")) return "Rot";
  if (s.includes("white-wine") || s.includes("weisswein") || s.includes("vino-bianco")) return "Weiss";
  if (s.includes("ros")) return "Rosé";
  if (
    s.includes("sparkling") ||
    s.includes("champagne") ||
    s.includes("prosecco") ||
    s.includes("cava") ||
    s.includes("sekt") ||
    s.includes("cremant")
  )
    return "Schaumwein";
  if (
    s.includes("dessert") ||
    s.includes("sweet-wine") ||
    s.includes("port") ||
    s.includes("sherry") ||
    s.includes("sauternes")
  )
    return "Dessertwein";
  return "Rot";
}

function drinkingWindow(type: WineType, vintage: number) {
  switch (type) {
    case "Weiss":
      return { drinkFrom: vintage + 1, drinkPeak: vintage + 3, drinkUntil: vintage + 7 };
    case "Rosé":
      return { drinkFrom: vintage + 1, drinkPeak: vintage + 2, drinkUntil: vintage + 4 };
    case "Schaumwein":
      return { drinkFrom: vintage + 1, drinkPeak: vintage + 3, drinkUntil: vintage + 6 };
    case "Dessertwein":
      return { drinkFrom: vintage + 3, drinkPeak: vintage + 10, drinkUntil: vintage + 20 };
    default: // Rot
      return { drinkFrom: vintage + 2, drinkPeak: vintage + 7, drinkUntil: vintage + 15 };
  }
}
