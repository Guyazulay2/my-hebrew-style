import { Link } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const NAV = [
  { label: "איך זה עובד", href: "#how" },
  { label: "יכולות", href: "#features" },
  { label: "מחירים", href: "#pricing" },
  { label: "שאלות נפוצות", href: "#faq" },
  { label: "התחברות", href: "/app" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed top-0 right-0 left-0 z-50">
      <div className="mx-auto mt-4 max-w-7xl px-4">
        <div className="glass-strong flex items-center justify-between gap-4 rounded-full px-4 py-2.5 sm:px-6">
          {/* RIGHT (logo + nav in RTL) */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#f0d8a8] to-[#b88a3f] text-[13px] font-black text-black shadow-[0_0_20px_rgba(240,200,140,0.4)]">
                M
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                My Stylist
              </span>
            </Link>
            <nav className="hidden items-center gap-7 lg:flex">
              {NAV.slice(0, -1).map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {n.label}
                </a>
              ))}
              <Link
                to="/app"
                className="text-sm text-muted-foreground transition hover:text-foreground"
              >
                התחברות
              </Link>
            </nav>
          </div>

          {/* LEFT */}
          <div className="flex items-center gap-2">
            <Link
              to="/app"
              className="hidden rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-medium text-foreground transition hover:border-white/30 hover:bg-white/10 hover:shadow-[0_0_24px_rgba(240,200,140,0.25)] sm:inline-flex"
            >
              להתחיל בחינם
            </Link>
            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 lg:hidden"
              aria-label="תפריט"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="glass-strong mt-2 flex flex-col gap-1 rounded-2xl p-3 lg:hidden">
            {NAV.map((n) =>
              n.href.startsWith("#") ? (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                >
                  {n.label}
                </a>
              ) : (
                <Link
                  key={n.href}
                  to="/app"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                >
                  {n.label}
                </Link>
              )
            )}
            <Link
              to="/app"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-xl bg-white/10 px-4 py-2.5 text-center text-sm font-medium"
            >
              להתחיל בחינם
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
