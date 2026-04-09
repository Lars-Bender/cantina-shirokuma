"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import AppShell from "../layout-shell";
import { searchWines, findByBarcode, getWineById, getDrinkingStatus, WINE_CATALOG } from "@/lib/mock-wines";
import { Wine } from "@/lib/types";
import AddWineModal from "@/components/AddWineModal";
import WineTypeBadge from "@/components/WineTypeBadge";
import DrinkStatusBadge from "@/components/DrinkStatusBadge";

export default function ScanPage() {
  const [mode, setMode] = useState<"camera" | "manual">("manual");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Wine[]>([]);
  const [onlineResults, setOnlineResults] = useState<Wine[]>([]);
  const [loadingOnline, setLoadingOnline] = useState(false);
  const onlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [selected, setSelected] = useState<Wine | null>(null);
  const [scanMsg, setScanMsg] = useState("");
  const [scanning, setScanning] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);
  const activeRef = useRef(false);

  const stopAll = useCallback(() => {
    activeRef.current = false;
    controlsRef.current?.stop();
    controlsRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraReady(false);
    setScanning(false);
  }, []);

  const startScanner = useCallback(async () => {
    if (typeof window === "undefined") return;
    activeRef.current = true;
    setScanMsg("");

    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { NotFoundException } = await import("@zxing/library");
      const reader = new BrowserMultiFormatReader();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (!videoRef.current || !activeRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraReady(true);
      setScanning(true);

      const controls = await reader.decodeFromStream(stream, videoRef.current, (result, err) => {
        if (!activeRef.current) return;
        if (result) {
          const barcode = result.getText();
          // First try our catalog
          let wine = findByBarcode(barcode);
          // If not found, try Open Food Facts / Open Barcode DB via a free public API
          if (!wine) {
            setScanMsg(`Barcode: ${barcode} — suche in Datenbank…`);
            fetchWineByBarcode(barcode).then((found) => {
              if (!activeRef.current) return;
              if (found) {
                stopAll();
                setSelected(found);
              } else {
                setScanMsg(`Barcode ${barcode} nicht gefunden. Bitte manuell suchen.`);
                setMode("manual");
              }
            });
          } else {
            stopAll();
            setSelected(wine);
          }
          return;
        }
        if (err && !(err instanceof NotFoundException)) {
          console.warn("Scan error:", err);
        }
      });
      if (activeRef.current) controlsRef.current = controls;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("https") || msg.includes("secure") || msg.includes("NotAllowedError") || msg.includes("permission")) {
        setScanMsg("⚠️ HTTPS erforderlich — siehe Hinweis unten");
      } else {
        setScanMsg("Kamera nicht verfügbar. Bitte manuell suchen.");
      }
      setMode("manual");
    }
  }, [stopAll]);

  useEffect(() => {
    if (mode === "camera") {
      startScanner();
    } else {
      stopAll();
    }
    return stopAll;
  }, [mode, startScanner, stopAll]);

  function handleSearch(q: string) {
    setQuery(q);
    const trimmed = q.trim();
    setResults(trimmed.length >= 2 ? searchWines(q) : []);

    // Reset online results on every keystroke
    setOnlineResults([]);
    if (onlineTimerRef.current) clearTimeout(onlineTimerRef.current);

    if (trimmed.length >= 2) {
      setLoadingOnline(true);
      onlineTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch(`/api/wines/search?q=${encodeURIComponent(trimmed)}`);
          const data: Wine[] = await res.json();
          // Deduplicate against local results by name similarity
          const localNames = new Set(results.map((w) => w.name.toLowerCase()));
          const fresh = data.filter((w) => !localNames.has(w.name.toLowerCase()));
          setOnlineResults(fresh);
        } catch {
          // silently ignore – local results still show
        } finally {
          setLoadingOnline(false);
        }
      }, 500);
    } else {
      setLoadingOnline(false);
    }
  }

  return (
    <AppShell>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="px-4 pt-14 pb-4">
          <h1 className="text-2xl font-bold" style={{ color: "#1A1208" }}>Wein scannen</h1>
          <p className="text-sm mt-1" style={{ color: "#6B5E4E" }}>
            Barcode halten — wird automatisch erkannt
          </p>
        </div>

        {/* Toggle */}
        <div className="px-4 mb-4">
          <div className="flex p-1 rounded-xl" style={{ background: "#EDE8DF" }}>
            {(["camera", "manual"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all"
                style={{
                  background: mode === m ? "#6B1A2A" : "transparent",
                  color: mode === m ? "white" : "#6B5E4E",
                }}
              >
                {m === "camera" ? "📷 Kamera" : "🔍 Suchen"}
              </button>
            ))}
          </div>
        </div>

        {/* Camera */}
        {mode === "camera" && (
          <div className="px-4 space-y-3">
            <div
              className="relative w-full rounded-2xl overflow-hidden"
              style={{ aspectRatio: "4/3", background: "#1A1208" }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Scan frame overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="relative w-64 h-36">
                  {/* Corner brackets */}
                  {[["top-0 left-0","border-t-2 border-l-2 rounded-tl-lg"],
                    ["top-0 right-0","border-t-2 border-r-2 rounded-tr-lg"],
                    ["bottom-0 left-0","border-b-2 border-l-2 rounded-bl-lg"],
                    ["bottom-0 right-0","border-b-2 border-r-2 rounded-br-lg"]
                  ].map(([pos, cls], i) => (
                    <div key={i} className={`absolute ${pos} w-6 h-6 ${cls}`}
                      style={{ borderColor: scanning ? "#B5862B" : "rgba(255,255,255,0.8)" }} />
                  ))}
                  {/* Scan line */}
                  {scanning && (
                    <div className="absolute left-2 right-2 h-0.5 rounded-full animate-scan-line"
                      style={{ background: "#B5862B", top: "50%",
                        animation: "scanLine 1.5s ease-in-out infinite" }} />
                  )}
                </div>
              </div>

              {/* Status badge */}
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                <div className="px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: "rgba(0,0,0,0.6)", color: scanning ? "#D4A845" : "rgba(255,255,255,0.7)" }}>
                  {cameraReady ? (scanning ? "Suche Barcode…" : "Bereit") : "Kamera startet…"}
                </div>
              </div>
            </div>

            {scanMsg && (
              <div className="p-3 rounded-xl text-sm text-center font-medium"
                style={{ background: "#EDE8DF", color: "#6B1A2A" }}>
                {scanMsg}
              </div>
            )}

            {/* HTTPS hint */}
            <div className="p-4 rounded-2xl border" style={{ background: "white", borderColor: "#D4C9B8" }}>
              <p className="text-xs font-semibold mb-1" style={{ color: "#1A1208" }}>
                📱 Kamera funktioniert nicht auf dem iPhone?
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#6B5E4E" }}>
                Safari braucht HTTPS für Kamerazugriff. Zwei Optionen:
              </p>
              <ol className="text-xs mt-2 space-y-1 pl-4" style={{ color: "#6B5E4E", listStyle: "decimal" }}>
                <li><strong style={{color:"#1A1208"}}>Vercel deployen</strong> — dann funktioniert alles mit HTTPS</li>
                <li><strong style={{color:"#1A1208"}}>ngrok starten</strong> — im Terminal: <code className="text-xs px-1.5 py-0.5 rounded" style={{background:"#EDE8DF",color:"#6B1A2A"}}>ngrok http 3000</code></li>
              </ol>
            </div>

            <button
              onClick={() => setMode("manual")}
              className="w-full py-3 rounded-2xl font-medium text-sm border"
              style={{ background: "transparent", color: "#6B5E4E", borderColor: "#D4C9B8" }}
            >
              Manuell suchen statt scannen
            </button>
          </div>
        )}

        {/* Manual search */}
        {mode === "manual" && (
          <div className="px-4">
            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border mb-4"
              style={{ background: "white", borderColor: "#D4C9B8" }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9B8E7E" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Weinname, Produzent, Region…"
                className="flex-1 bg-transparent text-base outline-none"
                style={{ color: "#1A1208" }}
              />
              {query && (
                <button onClick={() => { setQuery(""); setResults([]); }} style={{ color: "#9B8E7E" }}>✕</button>
              )}
            </div>

            <div className="space-y-2">
              {query.trim().length >= 2 ? (
                <>
                  {/* Local catalog results */}
                  {results.length > 0 && (
                    <>
                      <p className="text-xs font-medium pb-1" style={{ color: "#9B8E7E" }}>
                        Lokaler Katalog · {results.length} Treffer
                      </p>
                      {results.map((wine) => (
                        <WineResultCard key={wine.id} wine={wine} onSelect={() => setSelected(wine)} />
                      ))}
                    </>
                  )}

                  {/* Online library results */}
                  {loadingOnline && (
                    <div className="flex items-center gap-2 py-3 px-1">
                      <div className="w-4 h-4 rounded-full border-2 animate-spin flex-shrink-0"
                        style={{ borderColor: "#D4C9B8", borderTopColor: "#B5862B" }} />
                      <p className="text-xs" style={{ color: "#9B8E7E" }}>Online-Weinbibliothek wird durchsucht…</p>
                    </div>
                  )}

                  {!loadingOnline && onlineResults.length > 0 && (
                    <>
                      <p className="text-xs font-medium pt-2 pb-1" style={{ color: "#9B8E7E" }}>
                        Online-Bibliothek · {onlineResults.length} Treffer
                      </p>
                      {onlineResults.map((wine) => (
                        <WineResultCard key={wine.id} wine={wine} onSelect={() => setSelected(wine)} />
                      ))}
                    </>
                  )}

                  {!loadingOnline && results.length === 0 && onlineResults.length === 0 && (
                    <div className="text-center py-12">
                      <p className="text-4xl mb-3">🔍</p>
                      <p className="font-medium" style={{ color: "#1A1208" }}>Kein Wein gefunden</p>
                      <p className="text-sm mt-1" style={{ color: "#6B5E4E" }}>Anderen Namen oder Produzenten versuchen</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <p className="text-xs mb-2 font-medium" style={{ color: "#9B8E7E" }}>Alle Weine im Katalog</p>
                  {WINE_CATALOG.map((wine) => (
                    <WineResultCard key={wine.id} wine={wine} onSelect={() => setSelected(wine)} />
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {selected && (
        <AddWineModal wine={selected} onClose={() => setSelected(null)} />
      )}

      <style>{`
        @keyframes scanLine {
          0%, 100% { transform: translateY(-16px); opacity: 0.6; }
          50% { transform: translateY(16px); opacity: 1; }
        }
      `}</style>
    </AppShell>
  );
}

async function fetchWineByBarcode(barcode: string): Promise<Wine | null> {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    const data = await res.json();
    if (data.status !== 1 || !data.product) return null;
    const p = data.product;
    const name = p.product_name || p.product_name_de || "";
    if (!name) return null;
    return {
      id: `barcode-${barcode}`,
      name,
      producer: p.brands || "Unbekannt",
      vintage: new Date().getFullYear() - 2,
      type: "Rot",
      region: p.origins || "Unbekannt",
      country: p.countries_tags?.[0]?.replace("en:", "") || "Unbekannt",
      grapes: [],
      alcohol: parseFloat(p.nutriments?.alcohol || "0") || 12.5,
      drinkFrom: new Date().getFullYear() - 1,
      drinkPeak: new Date().getFullYear() + 2,
      drinkUntil: new Date().getFullYear() + 5,
      pairing: [],
      referencePrice: 0,
      barcode,
    };
  } catch {
    return null;
  }
}

function WineResultCard({ wine, onSelect }: { wine: Wine; onSelect: () => void }) {
  const status = getDrinkingStatus(wine);
  return (
    <button
      onClick={onSelect}
      className="w-full text-left p-4 rounded-2xl border flex items-start gap-3 transition-all active:opacity-80"
      style={{ background: "white", borderColor: "#EDE8DF" }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 mt-0.5"
        style={{ background: "#6B1A2A12" }}>
        🍷
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <WineTypeBadge type={wine.type} small />
          <span className="text-xs" style={{ color: "#6B5E4E" }}>{wine.vintage}</span>
        </div>
        <p className="font-semibold text-sm" style={{ color: "#1A1208" }}>{wine.name}</p>
        <p className="text-xs mt-0.5" style={{ color: "#6B5E4E" }}>{wine.producer} · {wine.region}</p>
        <div className="flex items-center gap-2 mt-2">
          <DrinkStatusBadge status={status} />
          {wine.referencePrice > 0 && (
            <span className="text-xs" style={{ color: "#9B8E7E" }}>CHF {wine.referencePrice}</span>
          )}
        </div>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1"
        style={{ background: "#6B1A2A12" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6B1A2A" strokeWidth="2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </div>
    </button>
  );
}
