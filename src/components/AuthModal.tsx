import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { X, Mail, Lock, User, AlertCircle, Loader2 } from "lucide-react";
import { register, login } from "@/lib/api/auth";
import { isAuthenticated } from "@/lib/api/client";

export function openAuth() {
  // If already logged in, just navigate to the app
  if (isAuthenticated()) {
    window.dispatchEvent(new CustomEvent("open-auth-redirect"));
    return;
  }
  window.dispatchEvent(new CustomEvent("open-auth"));
}

export function AuthModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [closing, setClosing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = () => {
      setClosing(false);
      setError(null);
      setOpen(true);
    };
    const redirectHandler = () => navigate({ to: "/app" });
    window.addEventListener("open-auth", handler);
    window.addEventListener("open-auth-redirect", redirectHandler);
    return () => {
      window.removeEventListener("open-auth", handler);
      window.removeEventListener("open-auth-redirect", redirectHandler);
    };
  }, [navigate]);

  const close = () => {
    if (loading) return;
    setClosing(true);
    setTimeout(() => setOpen(false), 220);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const email = emailRef.current?.value ?? "";
    const password = passwordRef.current?.value ?? "";
    const full_name = nameRef.current?.value ?? "";
    try {
      if (mode === "signup") {
        await register(email, password, full_name);
      } else {
        await login(email, password);
      }
      setClosing(true);
      setTimeout(() => {
        setOpen(false);
        navigate({ to: "/app" });
      }, 240);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "שגיאה בהתחברות");
    } finally {
      setLoading(false);
    }
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
              onClick={() => { setMode(m); setError(null); }}
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
            <InputField
              ref={nameRef}
              icon={<User className="h-4 w-4" />}
              placeholder="שם מלא"
              type="text"
            />
          )}
          <InputField
            ref={emailRef}
            icon={<Mail className="h-4 w-4" />}
            placeholder="אימייל"
            type="email"
          />
          <InputField
            ref={passwordRef}
            icon={<Lock className="h-4 w-4" />}
            placeholder={mode === "signup" ? "סיסמה (לפחות 6 תווים)" : "סיסמה"}
            type="password"
          />

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

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
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-[#f0d8a8] to-[#b88a3f] px-5 py-3 text-sm font-semibold text-black shadow-[0_10px_30px_-10px_rgba(240,200,140,0.7)] transition hover:shadow-[0_14px_44px_-10px_rgba(240,200,140,1)] disabled:opacity-60"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "signin" ? "התחברות" : "יצירת חשבון"}
          </button>
        </form>

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

const InputField = ({
  icon,
  placeholder,
  type,
  ref: forwardedRef,
}: {
  icon: React.ReactNode;
  placeholder: string;
  type: string;
  ref?: React.Ref<HTMLInputElement>;
}) => (
  <div className="relative">
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      {icon}
    </span>
    <input
      ref={forwardedRef}
      type={type}
      required
      placeholder={placeholder}
      className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 pr-10 text-sm text-white placeholder:text-muted-foreground outline-none transition focus:border-white/30 focus:bg-white/[0.05]"
    />
  </div>
);
