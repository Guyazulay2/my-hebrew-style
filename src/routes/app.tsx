import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  BookMarked,
  Camera,
  Check,
  ExternalLink,
  Globe,
  Loader2,
  MapPin,
  Scan,
  Shirt,
  ShoppingBag,
  Sparkles,
  User,
  X,
  Zap,
} from "lucide-react";
import { WaveBackground } from "@/components/WaveBackground";
import { SiteHeader } from "@/components/SiteHeader";
import {
  generateLook,
  searchByImage,
  toggleSave,
  uploadBodyPhoto,
  tryOn,
  type StylingItem,
  type StylingResult,
  type VisualSearchResult,
  type BodyScanResult,
  type TryOnResult,
} from "@/lib/api/styling";
import { apiFetch, isAuthenticated } from "@/lib/api/client";

export const Route = createFileRoute("/app")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw new Error("unauthenticated");
  },
  head: () => ({
    meta: [
      { title: "My Stylist · סורק AI" },
      { name: "description", content: "סריקת AI מתקדמת לסטייל אישי." },
    ],
  }),
  component: AppWorkspace,
});

/* ─── Types & Constants ─── */
type Mode = "choose" | "clothing" | "body";
type ScanState = "idle" | "scanning" | "done" | "error";
type StoreFilter = "all" | "israel" | "international";

const STYLE_TAGS = [
  { id: "אורבני", emoji: "🏙️" },
  { id: "קלאסי", emoji: "👔" },
  { id: "ספורטיבי", emoji: "⚽" },
  { id: "אלגנטי", emoji: "✨" },
  { id: "בוהמייני", emoji: "🌸" },
  { id: "מינימליסטי", emoji: "🤍" },
  { id: "רחוב", emoji: "🎸" },
  { id: "רומנטי", emoji: "💕" },
];

const EVENT_TYPES = [
  { id: "יומיומי", sublabel: "קז'ואל ונוח", emoji: "☀️" },
  { id: "אלגנטי", sublabel: "מטופח ומסוגנן", emoji: "✨" },
  { id: "אירוע", sublabel: "חתונה, בר מצווה", emoji: "🎉" },
  { id: "עסקי", sublabel: "פגישה, משרד", emoji: "💼" },
  { id: "ספורטיבי", sublabel: "אימון, פעילות", emoji: "🏃" },
  { id: "דייט", sublabel: "ערב רומנטי", emoji: "💕" },
  { id: "נסיעה", sublabel: "טיול, חופשה", emoji: "✈️" },
  { id: "חוף ים", sublabel: "קיץ, שמש", emoji: "🌊" },
];

const IL_KEYWORDS = ["fox", "castro", "renuar", "terminalx", "honigman", ".co.il", "zara.com/il", "hm.com/he_il"];

function filterByStore(results: VisualSearchResult["results"], f: StoreFilter) {
  if (f === "all") return results;
  return results.filter((r) => {
    const src = ((r.link ?? "") + (r.source ?? "")).toLowerCase();
    const isIL = IL_KEYWORDS.some((k) => src.includes(k));
    return f === "israel" ? isIL : !isIL;
  });
}

/* ═══════════════════════════════════════════
   APP WORKSPACE
═══════════════════════════════════════════ */
function AppWorkspace() {
  const [mode, setMode] = useState<Mode>("choose");
  return (
    <div className="relative min-h-screen text-foreground">
      <WaveBackground />
      <SiteHeader />
      <main className="relative px-4 pt-28 pb-20">
        <div className="mx-auto max-w-2xl">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                סורק AI מתקדם
              </div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">המרחב שלך</h1>
            </div>
            <Link
              to="/"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted-foreground transition hover:bg-white/10"
            >
              חזרה לדף הבית
            </Link>
          </div>

          {mode === "choose" && <ModeSelector onSelect={setMode} />}
          {mode === "body" && <BodyWizard onBack={() => setMode("choose")} />}
          {mode === "clothing" && <ClothingWizard onBack={() => setMode("choose")} />}
        </div>
      </main>
    </div>
  );
}

/* ═══════════════════════════════════════════
   MODE SELECTOR
═══════════════════════════════════════════ */
function ModeSelector({ onSelect }: { onSelect: (m: "clothing" | "body") => void }) {
  return (
    <div className="grid gap-5 sm:grid-cols-2 animate-fade-up">
      <ModeCard
        onClick={() => onSelect("body")}
        icon={<User className="h-9 w-9" />}
        title="סריקת מבנה גוף"
        subtitle="לוק מותאם אישית על בסיס מבנה גופך"
        steps={["פרטים", "סריקה", "סגנון", "הלוק"]}
        gradient="from-purple-500/20"
        accent="text-purple-300"
        glow="hover:border-purple-400/40"
      />
      <ModeCard
        onClick={() => onSelect("clothing")}
        icon={<Shirt className="h-9 w-9" />}
        title="סריקת פריט לבוש"
        subtitle="מצא פריטים דומים בחנויות ישראל והעולם"
        steps={["העלאה", "זיהוי", "חנויות"]}
        gradient="from-[#f0d8a8]/20"
        accent="text-[#f0d8a8]"
        glow="hover:border-[#f0d8a8]/40"
      />
    </div>
  );
}

function ModeCard({
  onClick, icon, title, subtitle, steps, gradient, accent, glow,
}: {
  onClick: () => void; icon: React.ReactNode; title: string; subtitle: string;
  steps: string[]; gradient: string; accent: string; glow: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-7 text-right transition-all duration-300 hover:bg-white/[0.06] hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)] ${glow}`}
    >
      <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${gradient} via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="relative">
        <div className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] ${accent} transition-transform duration-300 group-hover:scale-110`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

        {/* Step flow */}
        <div className="mt-4 flex items-center gap-1.5 flex-wrap">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-muted-foreground">
                {i + 1}. {s}
              </span>
              {i < steps.length - 1 && <span className="text-white/20 text-xs">›</span>}
            </div>
          ))}
        </div>

        <div className="mt-5 flex items-center gap-2 text-sm font-semibold text-white/80 transition-all group-hover:gap-3 group-hover:text-white">
          התחל עכשיו
          <ArrowRight className="h-4 w-4 rotate-180" />
        </div>
      </div>
    </button>
  );
}

/* ═══════════════════════════════════════════
   STEP INDICATOR
═══════════════════════════════════════════ */
function StepIndicator({
  steps, current, color = "purple",
}: {
  steps: string[]; current: number; color?: "purple" | "gold";
}) {
  const activeRing =
    color === "purple"
      ? "bg-purple-500 text-white shadow-[0_0_14px_rgba(168,85,247,0.5)]"
      : "bg-[#f0d8a8] text-black shadow-[0_0_14px_rgba(240,216,168,0.5)]";
  const activeLine = color === "purple" ? "bg-purple-500/50" : "bg-[#f0d8a8]/50";

  return (
    <div className="flex items-start mb-8" dir="rtl">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center" style={{ flex: i < steps.length - 1 ? "1 1 0" : "0 0 auto" }}>
          <div className="flex flex-col items-center gap-1.5 shrink-0">
            <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
              i < current
                ? "bg-emerald-500 text-white"
                : i === current
                ? activeRing
                : "border border-white/20 bg-white/[0.03] text-muted-foreground/60"
            }`}>
              {i < current ? <Check className="h-3.5 w-3.5" /> : <span>{i + 1}</span>}
            </div>
            <span className={`text-[9px] font-medium text-center leading-tight max-w-[52px] transition-colors ${
              i === current ? "text-white" : i < current ? "text-emerald-400/80" : "text-muted-foreground/40"
            }`}>
              {step}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div className={`h-px flex-1 mx-1.5 mb-4 transition-all duration-500 ${i < current ? activeLine : "bg-white/10"}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════
   BODY WIZARD  (4 steps)
═══════════════════════════════════════════ */
const BODY_STEPS = ["הפרטים שלי", "סריקת גוף", "בחירת סגנון", "הלוק שלי"];

function BodyWizard({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);

  /* Step 0 — personal */
  const [age, setAge] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [styleTags, setStyleTags] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);

  /* Step 1 — body scan */
  const [bodyFile, setBodyFile] = useState<File | null>(null);
  const [bodyImageUrl, setBodyImageUrl] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [bodyScan, setBodyScan] = useState<BodyScanResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  /* Step 2 — style */
  const [eventType, setEventType] = useState("");
  const [city, setCity] = useState("Tel Aviv");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);

  /* Step 3 — results */
  const [result, setResult] = useState<StylingResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tryOnResult, setTryOnResult] = useState<TryOnResult | null>(null);
  const [tryOnLoading, setTryOnLoading] = useState(false);
  const [tryOnError, setTryOnError] = useState<string | null>(null);

  const goNext = () => setStep((s) => Math.min(s + 1, BODY_STEPS.length - 1));
  const goBack = () => (step === 0 ? onBack() : setStep((s) => s - 1));

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await apiFetch("/api/user/onboarding", {
        method: "PUT",
        body: JSON.stringify({
          age: age || undefined,
          height_cm: heightCm || undefined,
          weight_kg: weightKg || undefined,
          style_tags: styleTags.length > 0 ? styleTags : undefined,
        }),
      });
    } catch { /* non-critical */ }
    finally {
      setSavingProfile(false);
      goNext();
    }
  };

  const handleScan = async () => {
    if (!bodyFile) return;
    setScanState("scanning");
    setScanError(null);
    setBodyScan(null);
    try {
      const scan = await uploadBodyPhoto(bodyFile);
      setBodyScan(scan);
      setScanState("done");
    } catch (e: unknown) {
      setScanState("error");
      setScanError(e instanceof Error ? e.message : "שגיאה בסריקה");
    }
  };

  const handleGenerateLook = async () => {
    if (!eventType) return;
    setGenerating(true);
    setGenError(null);
    try {
      const res = await generateLook(eventType, city, notes);
      setResult(res);
      setIsSaved(false);
      setTryOnResult(null);
      goNext();
    } catch (e: unknown) {
      setGenError(e instanceof Error ? e.message : "שגיאה ביצירת לוק");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="animate-fade-up">
      <button onClick={goBack} className="mb-4 flex items-center gap-2 text-xs text-muted-foreground transition hover:text-white">
        <ArrowRight className="h-3.5 w-3.5" />
        {step === 0 ? "חזרה לבחירת מצב" : "חזרה לשלב הקודם"}
      </button>

      <StepIndicator steps={BODY_STEPS} current={step} color="purple" />

      <div key={step} className="animate-fade-up">
        {step === 0 && (
          <PersonalDetailsStep
            age={age} setAge={setAge}
            heightCm={heightCm} setHeightCm={setHeightCm}
            weightKg={weightKg} setWeightKg={setWeightKg}
            styleTags={styleTags} setStyleTags={setStyleTags}
            onNext={handleSaveProfile}
            loading={savingProfile}
          />
        )}
        {step === 1 && (
          <BodyScanStep
            file={bodyFile}
            imageUrl={bodyImageUrl}
            scanState={scanState}
            bodyScan={bodyScan}
            error={scanError}
            onFile={(f) => {
              setBodyFile(f);
              setBodyImageUrl(URL.createObjectURL(f));
              setScanState("idle");
              setBodyScan(null);
              setScanError(null);
            }}
            onClearFile={() => {
              setBodyFile(null);
              setBodyImageUrl(null);
              setScanState("idle");
              setBodyScan(null);
              setScanError(null);
            }}
            onScan={handleScan}
            onNext={goNext}
          />
        )}
        {step === 2 && (
          <StyleSelectionStep
            eventType={eventType} setEventType={setEventType}
            city={city} setCity={setCity}
            notes={notes} setNotes={setNotes}
            onGenerate={handleGenerateLook}
            generating={generating}
            error={genError}
          />
        )}
        {step === 3 && result && (
          <OutfitResultsStep
            result={result}
            bodyScan={bodyScan}
            isSaved={isSaved}
            saving={saving}
            tryOnResult={tryOnResult}
            tryOnLoading={tryOnLoading}
            tryOnError={tryOnError}
            onSave={async () => {
              setSaving(true);
              try { const r = await toggleSave(result.session_id, notes || undefined); setIsSaved(r.is_saved); }
              finally { setSaving(false); }
            }}
            onTryOn={async () => {
              setTryOnLoading(true);
              setTryOnError(null);
              setTryOnResult(null);
              try { const r = await tryOn(result.session_id); setTryOnResult(r); }
              catch (e: unknown) { setTryOnError(e instanceof Error ? e.message : "שגיאה ביצירת Try-On"); }
              finally { setTryOnLoading(false); }
            }}
            onNewLook={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}

/* ── Body Step 0: Personal Details ── */
function PersonalDetailsStep({
  age, setAge, heightCm, setHeightCm, weightKg, setWeightKg,
  styleTags, setStyleTags, onNext, loading,
}: {
  age: number | ""; setAge: (v: number | "") => void;
  heightCm: number | ""; setHeightCm: (v: number | "") => void;
  weightKg: number | ""; setWeightKg: (v: number | "") => void;
  styleTags: string[]; setStyleTags: (t: string[]) => void;
  onNext: () => void; loading: boolean;
}) {
  const toggleTag = (id: string) => {
    if (styleTags.includes(id)) setStyleTags(styleTags.filter((t) => t !== id));
    else if (styleTags.length < 3) setStyleTags([...styleTags, id]);
  };

  return (
    <div className="glass-strong rounded-3xl p-7 space-y-7 max-w-lg mx-auto">
      <div>
        <div className="flex items-center gap-2 text-xs text-purple-300 mb-1">
          <User className="h-3.5 w-3.5" />
          שלב 1 מתוך 4
        </div>
        <h2 className="text-2xl font-bold">הפרטים שלך</h2>
        <p className="mt-1 text-sm text-muted-foreground">נעזרים בפרטים אלה כדי להתאים לך לוק מושלם</p>
      </div>

      {/* Measurements */}
      <div className="grid grid-cols-3 gap-3">
        <MeasureInput label="גיל" value={age} unit="שנים" onChange={setAge} min={16} max={99} />
        <MeasureInput label="גובה" value={heightCm} unit={'ס"מ'} onChange={setHeightCm} min={140} max={220} />
        <MeasureInput label="משקל" value={weightKg} unit={'ק"ג'} onChange={setWeightKg} min={40} max={200} />
      </div>

      {/* Style Tags */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">סגנון מועדף</span>
          <span className="text-xs text-muted-foreground">
            {styleTags.length > 0 ? `${styleTags.length}/3 נבחרו` : "בחר עד 3"}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {STYLE_TAGS.map((t) => (
            <button
              key={t.id}
              onClick={() => toggleTag(t.id)}
              className={`px-3.5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                styleTags.includes(t.id)
                  ? "bg-purple-500/25 border border-purple-400/60 text-purple-200 shadow-[0_0_12px_rgba(168,85,247,0.2)]"
                  : "border border-white/10 text-muted-foreground hover:border-purple-400/30 hover:text-white disabled:opacity-40"
              }`}
              disabled={!styleTags.includes(t.id) && styleTags.length >= 3}
            >
              {t.emoji} {t.id}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-purple-400 via-purple-500 to-purple-700 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(168,85,247,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(168,85,247,0.8)] disabled:opacity-50"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? "שומר…" : "המשך לסריקת גוף ›"}
      </button>
    </div>
  );
}

function MeasureInput({
  label, value, unit, onChange, min, max,
}: {
  label: string; value: number | ""; unit: string;
  onChange: (v: number | "") => void; min: number; max: number;
}) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        placeholder="—"
        onChange={(e) => onChange(e.target.value === "" ? "" : Number(e.target.value))}
        className="w-full bg-transparent text-center text-2xl font-bold text-white outline-none placeholder:text-white/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <div className="text-[10px] text-muted-foreground/60">{unit}</div>
    </div>
  );
}

/* ── Body Step 1: Body Scan ── */
function BodyScanStep({
  file, imageUrl, scanState, bodyScan, error,
  onFile, onClearFile, onScan, onNext,
}: {
  file: File | null; imageUrl: string | null; scanState: ScanState;
  bodyScan: BodyScanResult | null; error: string | null;
  onFile: (f: File) => void; onClearFile: () => void;
  onScan: () => void; onNext: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="glass-strong rounded-3xl p-6 space-y-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-purple-300 mb-1">
            <Scan className="h-3.5 w-3.5" />
            שלב 2 מתוך 4
          </div>
          <h2 className="text-xl font-bold">סריקת גוף</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            העלה תמונה עומד ישר, גוף מלא, על רקע בהיר
          </p>
        </div>

        {/* Upload zone or preview */}
        {!imageUrl ? (
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
            className={`cursor-pointer rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-5 py-14 transition-all duration-300 ${
              dragging
                ? "border-purple-400/60 bg-purple-500/5 scale-[1.01]"
                : "border-white/15 bg-white/[0.02] hover:border-purple-400/40 hover:bg-purple-500/5"
            }`}
          >
            <input ref={inputRef} type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
            <div className="h-20 w-20 rounded-3xl border border-purple-400/20 bg-purple-500/10 flex items-center justify-center">
              <Camera className="h-10 w-10 text-purple-300" />
            </div>
            <div className="text-center">
              <div className="text-base font-medium">גרור תמונה לכאן</div>
              <div className="text-sm text-purple-300 font-medium mt-0.5">או לחץ לבחירה</div>
              <div className="mt-2 text-xs text-muted-foreground">JPG · PNG · WEBP · עד 10MB</div>
            </div>
          </div>
        ) : (
          <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black">
            <img src={imageUrl} alt="body" className="w-full max-h-[420px] object-contain" />

            {scanState === "scanning" && (
              <>
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 opacity-15" style={{
                  backgroundImage: "linear-gradient(rgba(168,85,247,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(168,85,247,0.5) 1px, transparent 1px)",
                  backgroundSize: "28px 28px",
                }} />
                <div className="animate-scan-line absolute left-0 right-0 h-[2px]" style={{
                  background: "linear-gradient(90deg, transparent, rgba(168,85,247,0.9), transparent)",
                  boxShadow: "0 0 14px 3px rgba(168,85,247,0.6)",
                }} />
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-purple-400/30 bg-black/60 px-4 py-1.5 text-xs text-purple-300 backdrop-blur-md">
                  ● מנתח גוף…
                </div>
              </>
            )}

            {(scanState === "scanning" || scanState === "done") && (
              <>
                <Corner pos="top-2 right-2" rotate="" accentBorder="border-purple-400" />
                <Corner pos="top-2 left-2" rotate="rotate-90" accentBorder="border-purple-400" />
                <Corner pos="bottom-2 right-2" rotate="-rotate-90" accentBorder="border-purple-400" />
                <Corner pos="bottom-2 left-2" rotate="rotate-180" accentBorder="border-purple-400" />
              </>
            )}

            {scanState === "done" && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 backdrop-blur-sm flex items-center justify-center animate-result-in">
                  <Check className="h-8 w-8 text-emerald-400" />
                </div>
              </div>
            )}

            {scanState === "idle" && (
              <button onClick={onClearFile}
                className="absolute top-3 left-3 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <div className="flex flex-col gap-3">
          {scanState !== "done" && (
            <button
              onClick={onScan}
              disabled={!file || scanState === "scanning"}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-purple-400 via-purple-500 to-purple-700 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(168,85,247,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(168,85,247,0.8)] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {scanState === "scanning"
                ? <><Loader2 className="h-4 w-4 animate-spin" /> סורק…</>
                : <><Scan className="h-4 w-4" /> סרוק גוף</>}
            </button>
          )}
          {scanState === "done" && (
            <button
              onClick={onNext}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-6 py-3.5 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/30"
            >
              <Check className="h-4 w-4" />
              סריקה הושלמה — המשך לבחירת סגנון ›
            </button>
          )}
          {!file && scanState === "idle" && (
            <button onClick={onNext} className="text-center text-xs text-muted-foreground hover:text-white transition underline underline-offset-2">
              דלג על סריקת גוף
            </button>
          )}
        </div>

        {scanState === "scanning" && (
          <ScanSteps steps={["מזהה גוף", "מחשב פרופורציות", "מסיר רקע"]} color="purple" />
        )}
      </div>

      {/* Scan results */}
      {bodyScan && (
        <div className="glass-strong rounded-3xl overflow-hidden space-y-0 animate-result-in">
          {/* Cutout — full width, large, no labels */}
          {bodyScan.cutout_image && (
            <div
              className="w-full flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #0d0d0d 25%, #161616 25%, #161616 50%, #0d0d0d 50%, #0d0d0d 75%, #161616 75%)",
                backgroundSize: "22px 22px",
                minHeight: "340px",
              }}
            >
              <img
                src={`data:image/png;base64,${bodyScan.cutout_image}`}
                alt="body scan"
                className="object-contain"
                style={{
                  maxHeight: "440px",
                  width: "auto",
                  maxWidth: "100%",
                  filter: "drop-shadow(0 0 32px rgba(168,85,247,0.35)) drop-shadow(0 16px 40px rgba(0,0,0,0.8))",
                }}
              />
            </div>
          )}

          {/* Stats + note below the image */}
          <div className="p-5 space-y-3 border-t border-white/[0.06]">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {bodyScan.body_type_label && <StatCard label="סוג גוף" value={bodyScan.body_type_label} color="purple" />}
              {bodyScan.shoulder_hip_ratio != null && <StatCard label="יחס כתפיים/ירכיים" value={String(bodyScan.shoulder_hip_ratio)} color="purple" />}
              {bodyScan.confidence != null && <StatCard label="דיוק זיהוי" value={`${Math.round(bodyScan.confidence * 100)}%`} color="purple" />}
              {bodyScan.landmarks_count != null && <StatCard label="נקודות מפתח" value={String(bodyScan.landmarks_count)} color="purple" />}
            </div>
            {bodyScan.style_note && (
              <div className="rounded-xl border border-purple-400/20 bg-purple-500/5 px-3 py-2.5 text-xs text-purple-200 leading-relaxed">
                💜 {bodyScan.style_note}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: "purple" | "gold" }) {
  return (
    <div className={`rounded-xl border bg-white/5 px-3 py-2.5 ${color === "purple" ? "border-purple-400/20" : "border-[#f0d8a8]/20"}`}>
      <div className="text-[10px] text-muted-foreground">{label}</div>
      <div className="font-semibold text-white mt-0.5 text-sm">{value}</div>
    </div>
  );
}

/* ── Body Step 2: Style Selection ── */
function StyleSelectionStep({
  eventType, setEventType, city, setCity, notes, setNotes,
  onGenerate, generating, error,
}: {
  eventType: string; setEventType: (v: string) => void;
  city: string; setCity: (v: string) => void;
  notes: string; setNotes: (v: string) => void;
  onGenerate: () => void; generating: boolean; error: string | null;
}) {
  return (
    <div className="glass-strong rounded-3xl p-6 max-w-lg mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-2 text-xs text-purple-300 mb-1">
          <Sparkles className="h-3.5 w-3.5" />
          שלב 3 מתוך 4
        </div>
        <h2 className="text-xl font-bold">בחירת סגנון</h2>
        <p className="mt-1 text-sm text-muted-foreground">לאיזה אירוע ולמה אתה צריך ללבוש?</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EVENT_TYPES.map((ev) => (
          <button
            key={ev.id}
            onClick={() => setEventType(ev.id)}
            className={`rounded-2xl border p-3.5 text-right transition-all duration-200 ${
              eventType === ev.id
                ? "border-purple-400/60 bg-purple-500/20 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                : "border-white/10 bg-white/[0.02] hover:border-purple-400/30 hover:bg-purple-500/5"
            }`}
          >
            <div className="text-2xl mb-1.5">{ev.emoji}</div>
            <div className="text-xs font-bold text-white">{ev.id}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{ev.sublabel}</div>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <label className="block">
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">עיר (לתחזית מזג אוויר)</div>
          <input
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Tel Aviv"
            className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition focus:border-purple-400/50 placeholder:text-white/20"
          />
        </label>
        <label className="block">
          <div className="mb-1.5 text-xs font-medium text-muted-foreground">הערות נוספות (אופציונלי)</div>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="משהו קומפורטבלי אבל מטופח..."
            className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition focus:border-purple-400/50 placeholder:text-white/20"
          />
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={onGenerate}
        disabled={!eventType || generating}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-purple-400 via-purple-500 to-purple-700 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_8px_30px_-8px_rgba(168,85,247,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(168,85,247,0.8)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {generating
          ? <><Loader2 className="h-4 w-4 animate-spin" /> יוצר לוק…</>
          : <><Zap className="h-4 w-4" /> צור לוק מותאם</>}
      </button>

      {generating && (
        <ScanSteps steps={["מנתח סגנון ומזג אוויר", "יוצר המלצות Gemini AI", "מאתר פריטים בחנויות"]} color="purple" />
      )}
    </div>
  );
}

/* ── Body Step 3: Outfit Results ── */
function OutfitResultsStep({
  result, bodyScan, isSaved, saving, tryOnResult, tryOnLoading, tryOnError,
  onSave, onTryOn, onNewLook,
}: {
  result: StylingResult; bodyScan: BodyScanResult | null;
  isSaved: boolean; saving: boolean;
  tryOnResult: TryOnResult | null; tryOnLoading: boolean; tryOnError: string | null;
  onSave: () => void; onTryOn: () => void; onNewLook: () => void;
}) {
  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <div className="glass-strong rounded-3xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-xs text-purple-300 mb-1">
              <Sparkles className="h-3.5 w-3.5" />
              שלב 4 מתוך 4 — הלוק מוכן!
            </div>
            <h2 className="text-xl font-bold">הלוק שלי</h2>
          </div>
          <button onClick={onNewLook} className="text-xs text-muted-foreground hover:text-white transition underline underline-offset-2">
            לוק אחר
          </button>
        </div>

        {/* Description */}
        <div className="rounded-2xl border border-purple-400/20 bg-purple-500/5 p-4">
          <div className="text-sm leading-relaxed">{result.outfit_description}</div>
          {result.style_tip && (
            <div className="mt-2 pt-2 border-t border-white/10 text-xs text-muted-foreground">
              💡 {result.style_tip}
            </div>
          )}
          <button
            onClick={onSave}
            disabled={saving}
            className={`mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition ${
              isSaved
                ? "bg-accent/20 text-accent border border-accent/40"
                : "bg-white/5 text-muted-foreground border border-white/10 hover:bg-white/10"
            }`}
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookMarked className="h-3.5 w-3.5" />}
            {isSaved ? "נשמר בארון ✓" : "שמור לארון הבגדים"}
          </button>
        </div>

        {/* Items */}
        <div className="space-y-2.5">
          {result.items.map((item, i) => (
            <OutfitItemCard key={i} item={item} index={i} />
          ))}
        </div>
      </div>

      {/* Virtual Try-On */}
      {bodyScan?.cutout_image && (
        <div className="glass-strong rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-purple-200">👗 לנסות את הלוק עלי</div>
              <div className="text-xs text-muted-foreground mt-0.5">Gemini AI ילביש אותך בלוק שנוצר</div>
            </div>
            {!tryOnResult && !tryOnLoading && (
              <button
                onClick={onTryOn}
                className="inline-flex items-center gap-1.5 rounded-full bg-purple-600/30 border border-purple-400/40 px-4 py-2 text-xs font-semibold text-purple-200 transition hover:bg-purple-600/50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                לבש את הלוק
              </button>
            )}
          </div>

          {tryOnLoading && (
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="relative h-14 w-14 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-purple-400/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-purple-400/50" />
                <Sparkles className="h-6 w-6 text-purple-300" />
              </div>
              <div className="text-xs text-muted-foreground text-center">
                Gemini AI יוצר את הלוק…<br />
                <span className="text-muted-foreground/60">(עשוי לקחת 30-60 שניות)</span>
              </div>
            </div>
          )}

          {tryOnError && (
            <div className="flex items-start gap-2 text-xs text-red-400 rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              {tryOnError}
            </div>
          )}

          {tryOnResult && (
            <div className="rounded-2xl overflow-hidden border border-purple-400/30">
              <img
                src={`data:${tryOnResult.mime_type};base64,${tryOnResult.try_on_image}`}
                alt="virtual try-on"
                className="w-full object-contain max-h-[480px]"
              />
              <div className="py-2 text-[10px] text-center text-muted-foreground border-t border-white/10">
                ✦ תמונה שנוצרה על ידי AI — לצורך המחשה בלבד
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════
   CLOTHING WIZARD  (3 steps)
═══════════════════════════════════════════ */
const CLOTHING_STEPS = ["העלאת פריט", "זיהוי הפריט", "חיפוש בחנויות"];

function ClothingWizard({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>("idle");
  const [result, setResult] = useState<VisualSearchResult | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [storeFilter, setStoreFilter] = useState<StoreFilter>("all");

  const goBack = () => (step === 0 ? onBack() : setStep((s) => s - 1));

  const handleFile = (f: File) => {
    setFile(f);
    setImageUrl(URL.createObjectURL(f));
    setScanState("idle");
    setResult(null);
    setScanError(null);
  };

  const handleScan = async () => {
    if (!file) return;
    setScanState("scanning");
    setScanError(null);
    try {
      const res = await searchByImage(file);
      setResult(res);
      setScanState("done");
      setStep(1);
    } catch (e: unknown) {
      setScanState("error");
      setScanError(e instanceof Error ? e.message : "שגיאה בסריקה");
    }
  };

  return (
    <div className="animate-fade-up">
      <button onClick={goBack} className="mb-4 flex items-center gap-2 text-xs text-muted-foreground transition hover:text-white">
        <ArrowRight className="h-3.5 w-3.5" />
        {step === 0 ? "חזרה לבחירת מצב" : "חזרה לשלב הקודם"}
      </button>

      <StepIndicator steps={CLOTHING_STEPS} current={step} color="gold" />

      <div key={step} className="animate-fade-up">
        {step === 0 && (
          <ClothingUploadStep
            file={file}
            imageUrl={imageUrl}
            scanState={scanState}
            error={scanError}
            onFile={handleFile}
            onClear={() => { setFile(null); setImageUrl(null); setScanState("idle"); setResult(null); setScanError(null); }}
            onScan={handleScan}
          />
        )}
        {step === 1 && result && (
          <ClothingDisplayStep result={result} onNext={() => setStep(2)} />
        )}
        {step === 2 && result && (
          <StoreSearchStep
            result={result}
            storeFilter={storeFilter}
            setStoreFilter={setStoreFilter}
          />
        )}
      </div>
    </div>
  );
}

/* ── Clothing Step 0: Upload & Scan ── */
function ClothingUploadStep({
  file, imageUrl, scanState, error, onFile, onClear, onScan,
}: {
  file: File | null; imageUrl: string | null; scanState: ScanState; error: string | null;
  onFile: (f: File) => void; onClear: () => void; onScan: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="glass-strong rounded-3xl p-6 max-w-lg mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-[#f0d8a8] mb-1">
          <Shirt className="h-3.5 w-3.5" />
          שלב 1 מתוך 3
        </div>
        <h2 className="text-xl font-bold">העלאת פריט לבוש</h2>
        <p className="mt-1 text-sm text-muted-foreground">העלה תמונה של פריט לזיהוי ואיתור בחנויות</p>
      </div>

      {!imageUrl ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-3xl border-2 border-dashed flex flex-col items-center justify-center gap-5 py-16 transition-all duration-300 ${
            dragging
              ? "border-[#f0d8a8]/60 bg-[#f0d8a8]/5 scale-[1.01]"
              : "border-white/15 bg-white/[0.02] hover:border-[#f0d8a8]/40 hover:bg-[#f0d8a8]/5"
          }`}
        >
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
          <div className="h-20 w-20 rounded-3xl border border-[#f0d8a8]/20 bg-[#f0d8a8]/10 flex items-center justify-center">
            <Shirt className="h-10 w-10 text-[#f0d8a8]" />
          </div>
          <div className="text-center">
            <div className="text-base font-medium">גרור תמונת פריט לכאן</div>
            <div className="text-sm text-[#f0d8a8] font-medium mt-0.5">או לחץ לבחירה</div>
            <div className="mt-2 text-xs text-muted-foreground">JPG · PNG · WEBP · עד 10MB</div>
          </div>
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden border border-white/10">
          <img src={imageUrl} alt="clothing" className="w-full max-h-72 object-contain bg-[#111]" />

          {scanState === "scanning" && (
            <>
              <div className="absolute inset-0 bg-black/30" />
              <div className="absolute inset-0 opacity-15" style={{
                backgroundImage: "linear-gradient(rgba(240,216,168,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(240,216,168,0.5) 1px, transparent 1px)",
                backgroundSize: "28px 28px",
              }} />
              <div className="animate-scan-line absolute left-0 right-0 h-[2px]" style={{
                background: "linear-gradient(90deg, transparent, rgba(240,216,168,0.9), transparent)",
                boxShadow: "0 0 14px 3px rgba(240,216,168,0.6)",
              }} />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-[#f0d8a8]/30 bg-black/60 px-4 py-1.5 text-xs text-[#f0d8a8] backdrop-blur-md">
                ● מנתח פריט…
              </div>
            </>
          )}

          {(scanState === "scanning" || scanState === "done") && (
            <>
              <Corner pos="top-2 right-2" rotate="" accentBorder="border-[#f0d8a8]" />
              <Corner pos="top-2 left-2" rotate="rotate-90" accentBorder="border-[#f0d8a8]" />
              <Corner pos="bottom-2 right-2" rotate="-rotate-90" accentBorder="border-[#f0d8a8]" />
              <Corner pos="bottom-2 left-2" rotate="rotate-180" accentBorder="border-[#f0d8a8]" />
            </>
          )}

          {scanState === "idle" && (
            <button onClick={onClear}
              className="absolute top-3 left-3 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80 transition">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <button
        onClick={onScan}
        disabled={!file || scanState === "scanning"}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-[#f0d8a8] via-[#e8c089] to-[#b88a3f] px-6 py-3.5 text-sm font-semibold text-black shadow-[0_8px_30px_-8px_rgba(240,200,140,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(240,200,140,0.8)] disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {scanState === "scanning"
          ? <><Loader2 className="h-4 w-4 animate-spin" /> סורק פריט…</>
          : <><Scan className="h-4 w-4" /> סרוק פריט לבוש</>}
      </button>

      {scanState === "scanning" && (
        <ScanSteps steps={["מזהה סוג פריט", "מנתח צבע וסגנון", "מסיר רקע", "מחפש בחנויות"]} color="gold" />
      )}
    </div>
  );
}

/* ── Clothing Step 1: Item Display ── */
function ClothingDisplayStep({ result, onNext }: { result: VisualSearchResult; onNext: () => void }) {
  const a = result.analysis;
  return (
    <div className="glass-strong rounded-3xl p-6 max-w-lg mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-[#f0d8a8] mb-1">
          <Sparkles className="h-3.5 w-3.5" />
          שלב 2 מתוך 3
        </div>
        <h2 className="text-xl font-bold">זיהוי הפריט</h2>
        <p className="mt-1 text-sm text-muted-foreground">הפריט זוהה ועובד — הנה הפרטים</p>
      </div>

      {/* Cutout or original */}
      {result.cutout_image ? (
        <div className="rounded-2xl overflow-hidden border border-[#f0d8a8]/20">
          <div className="py-1.5 text-[10px] font-medium text-[#f0d8a8] text-center border-b border-white/10 bg-[#f0d8a8]/5">
            ✦ הפריט ללא רקע
          </div>
          <div
            className="flex items-center justify-center p-4 min-h-52"
            style={{
              background: "linear-gradient(135deg, #111 25%, #191919 25%, #191919 50%, #111 50%, #111 75%, #191919 75%)",
              backgroundSize: "18px 18px",
            }}
          >
            <img
              src={`data:image/png;base64,${result.cutout_image}`}
              alt="item without background"
              className="max-h-64 object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.9)]"
            />
          </div>
        </div>
      ) : (
        <div className="rounded-2xl overflow-hidden border border-white/10">
          <img src={result.image_url} alt="item" className="w-full max-h-64 object-contain bg-[#111]" />
        </div>
      )}

      {/* Analysis tags */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {a.item_type && <Tag label="סוג" value={a.item_type} />}
          {a.color && <Tag label="צבע" value={a.color} />}
          {a.style && <Tag label="סגנון" value={a.style} />}
          {a.gender && <Tag label="מיועד ל" value={a.gender} />}
        </div>
        {a.description && (
          <div className="rounded-xl border border-[#f0d8a8]/15 bg-[#f0d8a8]/5 px-3 py-2.5 text-xs text-[#f0d8a8]/90 leading-relaxed">
            {a.description}
          </div>
        )}
      </div>

      <button
        onClick={onNext}
        className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-[#f0d8a8] via-[#e8c089] to-[#b88a3f] px-6 py-3.5 text-sm font-semibold text-black shadow-[0_8px_30px_-8px_rgba(240,200,140,0.5)] transition hover:shadow-[0_12px_40px_-8px_rgba(240,200,140,0.8)]"
      >
        <ShoppingBag className="h-4 w-4" />
        חפש בחנויות ›
      </button>
    </div>
  );
}

/* ── Clothing Step 2: Store Search ── */
function StoreSearchStep({
  result, storeFilter, setStoreFilter,
}: {
  result: VisualSearchResult;
  storeFilter: StoreFilter;
  setStoreFilter: (f: StoreFilter) => void;
}) {
  const filtered = filterByStore(result.results, storeFilter);

  return (
    <div className="glass-strong rounded-3xl p-6 max-w-lg mx-auto space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs text-[#f0d8a8] mb-1">
          <ShoppingBag className="h-3.5 w-3.5" />
          שלב 3 מתוך 3
        </div>
        <h2 className="text-xl font-bold">חיפוש בחנויות</h2>
        <p className="mt-1 text-sm text-muted-foreground">נמצאו {result.results.length} תוצאות לפריט שלך</p>
      </div>

      {/* Store filter tabs */}
      <div className="flex gap-1.5 p-1 rounded-2xl border border-white/10 bg-white/[0.02]">
        {(
          [
            { id: "all" as StoreFilter, label: "הכל", icon: <ShoppingBag className="h-3 w-3" /> },
            { id: "israel" as StoreFilter, label: "ישראל", icon: <MapPin className="h-3 w-3" /> },
            { id: "international" as StoreFilter, label: "בינלאומי", icon: <Globe className="h-3 w-3" /> },
          ] as const
        ).map((f) => (
          <button
            key={f.id}
            onClick={() => setStoreFilter(f.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-medium transition-all ${
              storeFilter === f.id
                ? "bg-[#f0d8a8]/15 text-[#f0d8a8] border border-[#f0d8a8]/30"
                : "text-muted-foreground hover:text-white"
            }`}
          >
            {f.icon}
            {f.label}
          </button>
        ))}
      </div>

      {/* Results */}
      <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <EmptyState icon={<ShoppingBag className="h-6 w-6" />} text="לא נמצאו תוצאות לסינון זה" />
        ) : (
          filtered.map((item, i) => (
            <SearchResultCard key={i} item={item} index={i} />
          ))
        )}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   SHARED SUB-COMPONENTS
═══════════════════════════════════════════ */
function ScanSteps({ steps, color = "gold" }: { steps: string[]; color?: "gold" | "purple" }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setCurrent((c) => (c + 1) % steps.length), 1200);
    return () => clearInterval(id);
  }, [steps.length]);

  return (
    <div className="w-full space-y-1.5 mt-3">
      {steps.map((s, i) => (
        <div
          key={s}
          className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition-all duration-300 ${
            i === current
              ? color === "gold" ? "bg-[#f0d8a8]/10 text-[#f0d8a8]" : "bg-purple-400/10 text-purple-300"
              : "text-muted-foreground/40"
          }`}
        >
          {i === current ? (
            <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
          ) : i < current ? (
            <Check className="h-3 w-3 shrink-0 text-emerald-400" />
          ) : (
            <div className="h-3 w-3 shrink-0" />
          )}
          {s}
        </div>
      ))}
    </div>
  );
}

function Corner({ pos, rotate, accentBorder }: { pos: string; rotate: string; accentBorder: string }) {
  return (
    <div className={`absolute ${pos} animate-corner-pulse`}>
      <div className={`h-5 w-5 border-t-2 border-r-2 ${accentBorder} ${rotate}`} style={{ borderRadius: "0 4px 0 0" }} />
    </div>
  );
}

function Tag({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-[#f0d8a8]/25 bg-[#f0d8a8]/5 px-3 py-1 text-[11px]">
      <span className="text-muted-foreground">{label}: </span>
      <span className="text-[#f0d8a8]">{value}</span>
    </span>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 p-12 text-center text-muted-foreground">
      <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center">{icon}</div>
      <div className="text-sm">{text}</div>
    </div>
  );
}

function SearchResultCard({
  item, index,
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
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/5">
        {item.thumbnail ? (
          <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <ShoppingBag className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="line-clamp-1 text-sm font-medium">{item.title}</div>
        <div className="mt-0.5 text-[11px] text-muted-foreground">{item.source}</div>
        {item.price && <div className="mt-0.5 text-sm font-bold text-[#f0d8a8]">{item.price}</div>}
      </div>
      <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/40 transition group-hover:text-[#f0d8a8]" />
    </a>
  );
}

function OutfitItemCard({ item, index }: { item: StylingItem; index: number }) {
  const best = item.search_results?.[0];
  const catLabel: Record<string, string> = {
    top: "חולצה", bottom: "מכנס/חצאית", shoes: "נעליים",
    accessory: "אקססורי", outerwear: "חיצוני",
  };
  return (
    <div
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-purple-400/40 hover:bg-white/[0.05] animate-result-in"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-white/5">
        {best?.thumbnail ? (
          <img src={best.thumbnail} alt={item.name} className="h-full w-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        ) : (
          <Shirt className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold">{item.name}</span>
          <span className="rounded-full bg-purple-500/10 px-2 py-0.5 text-[10px] text-purple-300">
            {catLabel[item.category] ?? item.category}
          </span>
        </div>
        <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.description}</div>
        {best?.price && <div className="mt-0.5 text-sm font-bold text-purple-300">{best.price}</div>}
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
