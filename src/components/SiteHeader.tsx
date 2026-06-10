import { Link, useNavigate } from "@tanstack/react-router";
import { LogOut, Menu, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { openAuth } from "@/components/AuthModal";
import { isAuthenticated, onAuthChange } from "@/lib/api/client";
import { logout } from "@/lib/api/auth";

const NAV = [
  { label: "איך זה עובד", href: "#how" },
  { label: "יכולות", href: "#features" },
  { label: "מחירים", href: "#pricing" },
  { label: "שאלות נפוצות", href: "#faq" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthChange(() => setAuthed(isAuthenticated()));
  }, []);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate({ to: "/" });
  };

  return (
    <header className="fixed top-0 right-0 left-0 z-50">
      <div className="mx-auto mt-6 max-w-7xl px-4">
        <div className="glass-strong flex items-center justify-between gap-4 rounded-full px-5 py-3 sm:px-7 sm:py-3.5">
          {/* Logo + desktop nav */}
          <div className="flex items-center gap-9">
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#f0d8a8] to-[#b88a3f] text-[13px] font-black text-black shadow-[0_0_20px_rgba(240,200,140,0.45)]">
                M
              </span>
              <span className="text-[15px] font-semibold tracking-tight">
                My Stylist
              </span>
            </Link>

            <nav className="hidden items-center gap-7 lg:flex">
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="text-sm text-muted-foreground transition hover:text-foreground"
                >
                  {n.label}
                </a>
              ))}
              {!authed && (
                <button
                  onClick={openAuth}
                  className="text-sm text-muted-foreground transition hover:text-foreground"
                >
                  התחברות
                </button>
              )}
            </nav>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2">
            {authed ? (
              <>
                <Link
                  to="/app"
                  className="hidden items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-5 py-2 text-sm font-medium text-accent transition hover:bg-accent/20 sm:inline-flex"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  המרחב שלי
                </Link>
                <button
                  onClick={handleLogout}
                  title="התנתקות"
                  className="hidden h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-white sm:grid"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <button
                onClick={openAuth}
                className="hidden rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-sm font-medium text-foreground transition hover:border-white/30 hover:bg-white/10 sm:inline-flex"
              >
                להתחיל בחינם
              </button>
            )}

            <button
              onClick={() => setOpen((v) => !v)}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/5 lg:hidden"
              aria-label="תפריט"
            >
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Mobile drawer */}
        {open && (
          <div className="glass-strong mt-2 flex flex-col gap-1 rounded-2xl p-3 lg:hidden">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-2.5 text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
            {authed ? (
              <>
                <Link
                  to="/app"
                  onClick={() => setOpen(false)}
                  className="mt-1 flex items-center gap-2 rounded-xl bg-accent/10 px-4 py-2.5 text-sm font-medium text-accent"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  המרחב שלי
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-right text-sm text-muted-foreground transition hover:bg-white/5 hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  התנתקות
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setOpen(false); openAuth(); }}
                  className="rounded-xl px-4 py-2.5 text-right text-sm text-muted-foreground transition hover:bg-white/5 hover:text-foreground"
                >
                  התחברות
                </button>
                <button
                  onClick={() => { setOpen(false); openAuth(); }}
                  className="mt-1 rounded-xl bg-white/10 px-4 py-2.5 text-center text-sm font-medium"
                >
                  להתחיל בחינם
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
