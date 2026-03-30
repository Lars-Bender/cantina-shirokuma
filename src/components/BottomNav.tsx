"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/keller", label: "Keller", icon: WineIcon },
  { href: "/scan", label: "Scannen", icon: ScanIcon, isCta: true },
  { href: "/empfehlungen", label: "Für dich", icon: SparkleIcon },
  { href: "/profil", label: "Profil", icon: ProfileIcon },
];

export default function BottomNav() {
  const path = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "rgba(245,240,232,0.95)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderTop: "1px solid #D4C9B8",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="flex items-end justify-around px-2 pt-2 pb-2 max-w-lg mx-auto">
        {navItems.map(({ href, label, icon: Icon, isCta }) => {
          const active = href === "/" ? path === "/" : path.startsWith(href);
          if (isCta) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center -mt-5">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95"
                  style={{ background: "#6B1A2A" }}
                >
                  <Icon size={26} color="white" />
                </div>
                <span className="text-[10px] mt-1" style={{ color: "#6B5E4E" }}>
                  {label}
                </span>
              </Link>
            );
          }
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-1 min-w-[52px] py-1 transition-opacity active:opacity-60">
              <Icon size={22} color={active ? "#6B1A2A" : "#9B8E7E"} />
              <span
                className="text-[10px] font-medium"
                style={{ color: active ? "#6B1A2A" : "#9B8E7E" }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function HomeIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}

function WineIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 22h8M12 11v11M6 3h12l-2 7a4 4 0 01-8 0L6 3z" />
    </svg>
  );
}

function ScanIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 7V4a1 1 0 011-1h3M17 3h3a1 1 0 011 1v3M21 17v3a1 1 0 01-1 1h-3M7 21H4a1 1 0 01-1-1v-3" />
      <line x1="7" y1="12" x2="17" y2="12" strokeWidth="2.5" />
    </svg>
  );
}

function SparkleIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function ProfileIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
