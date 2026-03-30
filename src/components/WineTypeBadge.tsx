import { WineType } from "@/lib/types";

const config: Record<WineType, { bg: string; text: string; label: string }> = {
  Rot:         { bg: "#6B1A2A18", text: "#6B1A2A", label: "Rot" },
  Weiss:       { bg: "#B5862B18", text: "#8B6520", label: "Weiss" },
  "Rosé":      { bg: "#D4607818", text: "#A04060", label: "Rosé" },
  Schaumwein:  { bg: "#4A708018", text: "#2A5060", label: "Schaumwein" },
  Dessertwein: { bg: "#8B601A18", text: "#6B4A10", label: "Dessert" },
};

export default function WineTypeBadge({ type, small }: { type: WineType; small?: boolean }) {
  const c = config[type] ?? config.Rot;
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${small ? "text-[10px] px-2 py-0.5" : "text-xs px-2.5 py-0.5"}`}
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}
