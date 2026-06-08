import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, Mail, Lock, User } from "lucide-react";

export function openAuth() {
  window.dispatchEvent(new CustomEvent("open-auth"));
}

export function AuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [closing, setClosing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      setClosing(false);
      setOpen(true);
    };
    window.addEventListener("open-auth", handler);
    return () => window.removeEventListener("open-auth", handler);
  }, []);

  const close = () => {
    setClosing(true);
    setTimeout(() => setOpen(false), 220);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      navigate({ to: "/app" });
    }, 240);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{
        animation: closing
          ? "fade-up 0.22s ease-in reverse"
          : "fade-up 0.3s ease-out",
      }}
    >
      <div
        onClick={close}
        className="absolute inset-0 bg-black/55 backdrop-blur-md"
      />
      <div
        className="relative w-full max-w-md rounded-3xl border border-white/15 p-7 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
        style={{
          background:
            "linear-gradient(180deg, rgba(20,20,25,0.85), rgba(10,10,12,0.92))",
          backdropFilter: "blur(28px) saturate(160%)",
        }}
      >
        <button
          onClick={close}
          aria-label="סגירה"
          className="absolute left-4 top-4 grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="text-center">
          <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#f0d8a8] to-[#b88a3f] text-sm font-black text-black shadow-[0_0_24px_rgba(240,200,140,0.45)]">
            M
          </div>
          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">
            {mode === "signin" ? "ברוכים השבים" : "צרו חשבון חדש"}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "signin"
              ? "התחברו כדי להמשיך לסטייליסט שלכם"
              : "דקה והסטייל האישי שלכם מוכן"}
          </p>
        </div>

        {/* Tab toggle */}
        <div className="mt-6 grid grid-cols-2 gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                mode === m
                  ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                  : "text-muted-foreground hover:text-white"
              }`}
            >
              {m === "signin" ? "התחברות" : "הרשמה"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-3">
          {mode === "signup" && (
            <InputField icon={<User className="h-4 w-4" />} placeholder="שם מלא" type="text" />
          )}
          <InputField icon={<Mail className="h-4 w-4" />} placeholder="אימייל" type="email" />
          <InputField
            icon={<Lock className="h-4 w-4" />}
            placeholder={mode === "signup" ? "סיסמה (לפחות 6 תווים)" : "סיסמה"}
            type="password"
          />

          {mode === "signin" && (
            <div className="text-left">
              <button
                type="button"
                className="text-xs text-muted-foreground transition hover:text-white"
              >
                שכחת סיסמה?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="mt-2 w-full rounded-full bg-gradient-to-l from-[#f0d8a8] to-[#b88a3f] px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_-10px_rgba(240,200,140,0.7)] transition hover:shadow-[0_14px_44px_-10px_rgba(240,200,140,1)]"
          >
            {mode === "signin" ? "התחברות" : "יצירת חשבון"}
          </button>
        </form>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
            או
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button
          onClick={submit as any}
          className="flex w-full items-center justify-center gap-2.5 rounded-full border border-white/15 bg-white/[0.04] px-5 py-3 text-sm font-medium text-white transition hover:border-white/30 hover:bg-white/[0.08]"
        >
          <GoogleIcon />
          המשך באמצעות Google
        </button>

        <p className="mt-5 text-center text-[11px] text-muted-foreground">
          בהמשך אתם מסכימים ל
          <a href="#" className="mx-1 underline hover:text-white">תנאי השימוש</a>
          ול
          <a href="#" className="mx-1 underline hover:text-white">מדיניות הפרטיות</a>
        </p>
      </div>
    </div>
  );
}

function InputField({
  icon,
  placeholder,
  type,
}: {
  icon: React.ReactNode;
  placeholder: string;
  type: string;
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        {icon}
      </span>
      <input
        type={type}
        required
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-10 text-sm text-white placeholder:text-muted-foreground outline-none transition focus:border-white/30 focus:bg-white/[0.05]"
      />
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.4-1.6 4-5.5 4-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.6 14.6 2.6 12 2.6 6.8 2.6 2.6 6.8 2.6 12S6.8 21.4 12 21.4c6.9 0 9.5-4.8 9.5-7.3 0-.5 0-.9-.1-1.3H12z"
      />
    </svg>
  );
}
