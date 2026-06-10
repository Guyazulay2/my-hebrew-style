import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ExternalLink,
  Loader2,
  ScanLine,
  Shirt,
  Sparkles,
  Upload,
  X,
  Scan,
  User,
  ShoppingBag,
  Zap,
} from "lucide-react";
import { WaveBackground } from "@/components/WaveBackground";
import { SiteHeader } from "@/components/SiteHeader";
import {
  generateLook,
  searchByImage,
  type StylingItem,
  type StylingResult,
  type VisualSearchResult,
} from "@/lib/api/styling";
import { getToken } from "@/lib/api/client";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "My Stylist · סורק AI" },
      { name: "description", content: "סריקת AI מתקדמת לסטייל אישי." },
    ],
  }),
  component: AppWorkspace,
});

type Mode = "choose" | "clothing" | "body";

function AppWorkspace() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("choose");

  useEffect(() => {
    if (!getToken()) navigate({ to: "/" });
  }, [navigate]);

  return (
    <div className="relative min-h-screen text-foreground">
      <WaveBackground />
      <SiteHeader />

      <main className="relative px-4 pt-28 pb-16">
        <div className="mx-auto max-w-5xl">
          {/* Header */}
          <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                סורק AI מתקדם
              </div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                המרחב שלך
              </h1>
            </div>
            <Link
              to="/"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted-foreground transition hover:bg-white/10"
            >
              חזרה לדף הבית
            </Link>
          </div>

          {mode === "choose" && <ModeSelector onSelect={setMode} />}
          {mode === "clothing" && (
            <ClothingScanner onBack={() => setMode("choose")} />
          )}
          {mode === "body" && (
            <BodyScanner onBack={() => setMode("choose")} />
          )}
        </div>
      </main>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MODE SELECTOR
───────────────────────────────────────────── */
function ModeSelector({ onSelect }: { onSelect: (m: "clothing" | "body") => void }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <ModeCard
        onClick={() => onSelect("clothing")}
        icon={<Shirt className="h-8 w-8" />}
        title="סריקת פריט לבוש"
        subtitle="העלו תמונה של פריט וה-AI ימצא לכם מוצרים דומים מחנויות בישראל"
        tags={["זיהוי צבע", "זיהוי סגנון", "קישורי קנייה"]}
        gradient="from-[#f0d8a8]/20 via-transparent to-transparent"
        accentColor="text-[#f0d8a8]"
        borderGlow="hover:border-[#f0d8a8]/40"
      />
      <ModeCard
        onClick={() => onSelect("body")}
        icon={<User className="h-8 w-8" />}
        title="סריקת מבנה גוף"
        subtitle="העלו תמונה שלכם וה-AI יזהה את מבנה גופכם וימליץ על לוק שלם"
        tags={["ניתוח גוף", "המלצות לבוש", "מותאם אישית"]}
        gradient="from-purple-500/20 via-transparent to-transparent"
        accentColor="text-purple-300"
        borderGlow="hover:border-purple-400/40"
      />
    </div>
  );
}

function ModeCard({
  onClick,
  icon,
  title,
  subtitle,
  tags,
  gradient,
  accentColor,
  borderGlow,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  tags: string[];
  gradient: string;
  accentColor: string;
  borderGlow: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-right transition-all duration-300 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] ${borderGlow} animate-fade-up`}
    >
      {/* Background gradient */}
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} transition-opacity duration-500 opacity-60 group-hover:opacity-100`}
      />

      {/* Decorative orb */}
      <div className="pointer-events-none absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/[0.02] blur-2xl animate-orb-float" />

      <div className="relative">
        <div
          className={`mb-5 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] ${accentColor} transition-transform duration-300 group-hover:scale-110`}
        >
          {icon}
        </div>

        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {subtitle}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-muted-foreground"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-white/80 transition-all duration-300 group-hover:gap-3 group-hover:text-white">
          התחל סריקה
          <ArrowRight className="h-4 w-4 rotate-180" />
        </div>
      </div>
    </button>
  );
}

/* ─────────────────────────────────────────────
   SHARED SCAN UPLOAD ZONE
───────────────────────────────────────────── */
type ScanState = "idle" | "scanning" | "done" | "error";

function ScanUploadZone({
  onFile,
  imageUrl,
  scanState,
  accentColor,
  onClear,
}: {
  onFile: (f: File) => void;
  imageUrl: string | null;
  scanState: ScanState;
  accentColor: "gold" | "purple";
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const accent =
    accentColor === "gold"
      ? { ring: "rgba(240,216,168,0.7)", line: "#f0d8a8", corner: "border-[#f0d8a8]" }
      : { ring: "rgba(168,85,247,0.7)", line: "#c084fc", corner: "border-purple-400" };

  return (
    <div className="relative">
      {imageUrl ? (
        /* ── IMAGE WITH SCAN OVERLAY ── */
        <div className="relative overflow-hidden rounded-3xl border border-white/10">
          <img
            src={imageUrl}
            alt="uploaded"
            className="h-72 w-full object-cover"
          />

          {/* Dark overlay during scan */}
          {scanState === "scanning" && (
            <div className="absolute inset-0 bg-black/40" />
          )}

          {/* Scan grid lines */}
          {scanState === "scanning" && (
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `linear-gradient(${accent.line}33 1px, transparent 1px), linear-gradient(90deg, ${accent.line}33 1px, transparent 1px)`,
                backgroundSize: "32px 32px",
                animation: "grid-fade 0.4s ease-out",
              }}
            />
          )}

          {/* Scan line */}
          {scanState === "scanning" && (
            <div
              className="animate-scan-line absolute left-0 right-0 h-[2px] animate-scan-pulse"
              style={{
                background: `linear-gradient(90deg, transparent, ${accent.line}, transparent)`,
                boxShadow: `0 0 12px 2px ${accent.ring}`,
              }}
            />
          )}

          {/* Corner brackets */}
          {(scanState === "scanning" || scanState === "done") && (
            <>
              <Corner pos="top-2 right-2" rotate="" accentBorder={accent.corner} />
              <Corner pos="top-2 left-2" rotate="rotate-90" accentBorder={accent.corner} />
              <Corner pos="bottom-2 right-2" rotate="-rotate-90" accentBorder={accent.corner} />
              <Corner pos="bottom-2 left-2" rotate="rotate-180" accentBorder={accent.corner} />
            </>
          )}

          {/* Done checkmark */}
          {scanState === "done" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 backdrop-blur-sm animate-result-in">
                <Check className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
          )}

          {/* Scanning label */}
          {scanState === "scanning" && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-white/20 bg-black/60 px-4 py-1.5 text-xs backdrop-blur-md">
              <span style={{ color: accent.line }}>●</span>{" "}
              <span className="text-white">מנתח…</span>
            </div>
          )}

          {/* Clear button */}
          {scanState === "idle" && (
            <button
              onClick={onClear}
              className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      ) : (
        /* ── DROP ZONE ── */
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) onFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`flex h-64 cursor-pointer flex-col items-center justify-center gap-4 rounded-3xl border-2 border-dashed transition-all duration-300 ${
            dragging
              ? "border-accent/60 bg-accent/5 scale-[1.01]"
              : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.03]"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05]">
            <Upload className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <div className="text-sm font-medium">גררו תמונה לכאן או לחצו לבחירה</div>
            <div className="mt-1 text-xs text-muted-foreground">JPG · PNG · WEBP · עד 10MB</div>
          </div>
        </div>
      )}
    </div>
  );
}

function Corner({
  pos,
  rotate,
  accentBorder,
}: {
  pos: string;
  rotate: string;
  accentBorder: string;
}) {
  return (
    <div className={`absolute ${pos} animate-corner-pulse`}>
      <div
        className={`h-5 w-5 border-t-2 border-r-2 ${accentBorder} ${rotate}`}
        style={{ borderRadius: "0 4px 0 0" }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
   CLOTHING SCANNER
───────────────────────────────────────────── */
function ClothingScanner({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<VisualSearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setScanState("idle");
    setResult(null);
    setError(null);
  };

  const scan = async () => {
    if (!file) return;
    setScanState("scanning");
    setError(null);
    try {
      const res = await searchByImage(file);
      setScanState("done");
      setResult(res);
    } catch (e: unknown) {
      setScanState("error");
      setError(e instanceof Error ? e.message : "שגיאה בסריקה");
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs text-muted-foreground transition hover:text-white"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        חזרה לבחירת מצב
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — upload */}
        <div className="glass-strong rounded-3xl p-6">
          <div className="mb-1 flex items-center gap-2 text-xs text-[#f0d8a8]">
            <Shirt className="h-3.5 w-3.5" />
            סריקת פריט לבוש
          </div>
          <h2 className="mb-5 text-lg font-semibold">העלו תמונה של פריט</h2>

          <ScanUploadZone
            onFile={handleFile}
            imageUrl={imageUrl}
            scanState={scanState}
            accentColor="gold"
            onClear={() => {
              setFile(null);
              setImageUrl(null);
              setScanState("idle");
              setResult(null);
            }}
          />

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={scan}
            disabled={!file || scanState === "scanning"}
            className="mt-5 group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-[#f0d8a8] via-[#e8c089] to-[#b88a3f] px-6 py-3.5 text-sm font-semibold text-black shadow-[0_8px_30px_-8px_rgba(240,200,140,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(240,200,140,0.8)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {scanState === "scanning" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                סורק…
              </>
            ) : (
              <>
                <Scan className="h-4 w-4" />
                סרוק פריט
              </>
            )}
          </button>

          {/* Analysis tags */}
          {result && (
            <div className="mt-5 flex flex-wrap gap-2 animate-result-in">
              {result.analysis.item_type && (
                <Tag label="סוג" value={result.analysis.item_type} />
              )}
              {result.analysis.color && (
                <Tag label="צבע" value={result.analysis.color} />
              )}
              {result.analysis.style && (
                <Tag label="סגנון" value={result.analysis.style} />
              )}
            </div>
          )}
        </div>

        {/* Right — results */}
        <div className="glass-strong rounded-3xl p-6">
          <div className="mb-1 flex items-center gap-2 text-xs text-[#f0d8a8]">
            <ShoppingBag className="h-3.5 w-3.5" />
            תוצאות חיפוש
          </div>
          <h2 className="mb-5 text-lg font-semibold">פריטים דומים לקנייה</h2>

          {!result && scanState !== "scanning" && (
            <EmptyState icon={<ShoppingBag className="h-6 w-6" />} text="העלו תמונה וסרקו כדי לראות תוצאות" />
          )}

          {scanState === "scanning" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-[#f0d8a8]/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-[#f0d8a8]/50" />
                <Scan className="h-6 w-6 text-[#f0d8a8]" />
              </div>
              <div className="text-sm text-muted-foreground">מחפש פריטים דומים…</div>
              <ScanSteps steps={["מזהה סוג פריט", "מנתח צבע וסגנון", "מחפש בחנויות"]} />
            </div>
          )}

          {result && (
            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {result.results.slice(0, 10).map((item, i) => (
                <SearchResultCard key={i} item={item} index={i} />
              ))}
              {result.results.length === 0 && (
                <EmptyState icon={<ShoppingBag className="h-6 w-6" />} text="לא נמצאו תוצאות — נסו תמונה אחרת" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   BODY SCANNER
───────────────────────────────────────────── */
function BodyScanner({ onBack }: { onBack: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [context, setContext] = useState("");
  const [city, setCity] = useState("Tel Aviv");
  const [result, setResult] = useState<StylingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setScanState("idle");
    setResult(null);
    setError(null);
  };

  const scan = async () => {
    if (!file && !context.trim()) return;
    setScanState("scanning");
    setError(null);
    try {
      const res = await generateLook(context || "casual", city, context);
      setScanState("done");
      setResult(res);
    } catch (e: unknown) {
      setScanState("error");
      setError(e instanceof Error ? e.message : "שגיאה בסריקה");
    }
  };

  const canScan = (!!file || context.trim().length > 0) && scanState !== "scanning";

  return (
    <div className="space-y-6 animate-fade-up">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs text-muted-foreground transition hover:text-white"
      >
        <ArrowRight className="h-3.5 w-3.5" />
        חזרה לבחירת מצב
      </button>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left — upload + context */}
        <div className="glass-strong rounded-3xl p-6">
          <div className="mb-1 flex items-center gap-2 text-xs text-purple-300">
            <User className="h-3.5 w-3.5" />
            סריקת מבנה גוף
          </div>
          <h2 className="mb-5 text-lg font-semibold">העלו תמונה שלכם</h2>

          <ScanUploadZone
            onFile={handleFile}
            imageUrl={imageUrl}
            scanState={scanState}
            accentColor="purple"
            onClear={() => {
              setFile(null);
              setImageUrl(null);
              setScanState("idle");
              setResult(null);
            }}
          />

          <div className="mt-4 space-y-3">
            <label className="block">
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">
                לאן אתם הולכים? (אופציונלי)
              </div>
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                rows={2}
                placeholder="פגישת עבודה, ערב חוץ, אירוע פורמלי…"
                className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition focus:border-purple-400/50"
              />
            </label>
            <label className="block">
              <div className="mb-1.5 text-xs font-medium text-muted-foreground">עיר</div>
              <input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition focus:border-purple-400/50"
              />
            </label>
          </div>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            onClick={scan}
            disabled={!canScan}
            className="mt-5 group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-purple-400 via-purple-500 to-purple-700 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(168,85,247,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(168,85,247,0.8)] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {scanState === "scanning" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                סורק…
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                צור לוק מותאם
              </>
            )}
          </button>
        </div>

        {/* Right — results */}
        <div className="glass-strong rounded-3xl p-6">
          <div className="mb-1 flex items-center gap-2 text-xs text-purple-300">
            <Sparkles className="h-3.5 w-3.5" />
            הלוק שלך
          </div>
          <h2 className="mb-5 text-lg font-semibold">המלצות לבוש</h2>

          {!result && scanState !== "scanning" && (
            <EmptyState icon={<ScanLine className="h-6 w-6" />} text="העלו תמונה או תארו אירוע כדי לקבל לוק" />
          )}

          {scanState === "scanning" && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="relative flex h-16 w-16 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-purple-400/50" />
                <User className="h-6 w-6 text-purple-300" />
              </div>
              <div className="text-sm text-muted-foreground">מנתח ומייצר לוק…</div>
              <ScanSteps
                steps={["מנתח מבנה וסגנון", "בונה המלצות Gemini AI", "מאתר פריטים בחנויות"]}
                color="purple"
              />
            </div>
          )}

          {result && (
            <div className="space-y-3 max-h-[520px] overflow-y-auto pr-1">
              {/* Description */}
              <div className="rounded-2xl border border-purple-400/20 bg-purple-500/5 p-4 animate-result-in">
                <div className="text-sm leading-relaxed">{result.outfit_description}</div>
                {result.style_tip && (
                  <div className="mt-2 border-t border-white/10 pt-2 text-xs text-muted-foreground">
                    💡 {result.style_tip}
                  </div>
                )}
              </div>
              {result.items.map((item, i) => (
                <OutfitItemCard key={i} item={item} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   SHARED SUB-COMPONENTS
───────────────────────────────────────────── */
function ScanSteps({ steps, color = "gold" }: { steps: string[]; color?: "gold" | "purple" }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % steps.length), 1200);
    return () => clearInterval(id);
  }, [steps.length]);
  return (
    <div className="w-full space-y-1.5">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition-all duration-300 ${
            i === current
              ? color === "gold"
                ? "bg-[#f0d8a8]/10 text-[#f0d8a8]"
                : "bg-purple-400/10 text-purple-300"
              : "text-muted-foreground/50"
          }`}
        >
          {i === current ? (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
          ) : i < current ? (
            <Check className="h-3 w-3 shrink-0 text-emerald-400" />
          ) : (
            <div className="h-3 w-3" />
          )}
          {s}
        </div>
      ))}
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[#f0d8a8]/25 bg-[#f0d8a8]/5 px-3 py-1 text-[11px]">
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-[#f0d8a8]">{value}</span>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 p-12 text-center text-muted-foreground">
      <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-sm">{text}</div>
    </div>
  );
}

function SearchResultCard({
  item,
  index,
}: {
  item: { title: string; price: string; link: string; thumbnail: string; source: string };
  index: number;
}) {
  return (
    <a
      href={item.link}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-[#f0d8a8]/40 hover:bg-white/[0.05] animate-result-in"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/5">
        {item.thumbnail ? (
          <img
            src={item.thumbnail}
            alt={item.title}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-sm font-medium">{item.title}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{item.source}</div>
        {item.price && (
          <div className="mt-0.5 text-sm font-bold text-[#f0d8a8]">{item.price}</div>
        )}
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/50 transition group-hover:text-[#f0d8a8]" />
    </a>
  );
}

function OutfitItemCard({ item, index }: { item: StylingItem; index: number }) {
  const best = item.search_results?.[0];
  const categoryLabel: Record<string, string> = {
    top: "חולצה",
    bottom: "מכנס/חצאית",
    shoes: "נעליים",
    accessory: "אקססורי",
    outerwear: "חיצוני",
  };

  return (
    <div
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-purple-400/40 hover:bg-white/[0.05] animate-result-in"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/5">
        {best?.thumbnail ? (
          <img
            src={best.thumbnail}
            alt={item.name}
            className="h-full w-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <Shirt className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{item.name}</span>
          <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
            {categoryLabel[item.category] ?? item.category}
          </span>
        </div>
        <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.description}</div>
        {best?.price && (
          <div className="mt-0.5 text-sm font-bold text-purple-300">{best.price}</div>
        )}
      </div>
      <a
        href={best?.link ?? `https://www.google.com/search?q=${encodeURIComponent(item.search_query)}&tbm=shop`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-purple-500 hover:text-white"
      >
        לקנייה
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
