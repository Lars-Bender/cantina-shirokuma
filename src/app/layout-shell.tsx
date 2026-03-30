"use client";

import BottomNav from "@/components/BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen" style={{ background: "#F5F0E8" }}>
      <main className="pb-safe">{children}</main>
      <BottomNav />
    </div>
  );
}
