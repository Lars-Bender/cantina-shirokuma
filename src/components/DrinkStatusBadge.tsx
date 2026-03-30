const config = {
  peak:    { bg: "#1A6B2A18", text: "#1A6B2A", label: "Jetzt im Peak" },
  ready:   { bg: "#B5862B18", text: "#8B6520", label: "Trinkreif" },
  soon:    { bg: "#6B1A2A18", text: "#6B1A2A", label: "Bald trinken" },
  wait:    { bg: "#6B5E4E18", text: "#6B5E4E", label: "Noch warten" },
  overdue: { bg: "#80202018", text: "#802020", label: "Über dem Peak" },
};

export default function DrinkStatusBadge({ status }: { status: keyof typeof config }) {
  const c = config[status];
  return (
    <span
      className="inline-flex items-center rounded-full text-xs px-2.5 py-0.5 font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}
