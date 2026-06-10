import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ExternalLink,
  ImageIcon,
  Loader2,
  ScanLine,
  Shirt,
  Sparkles,
  Store,
  Upload,
  X,
} from "lucide-react";
import { WaveBackground } from "@/components/WaveBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { generateLook, type StylingItem, type StylingResult } from "@/lib/api/styling";
import { getToken } from "@/lib/api/client";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "My Stylist · המרחב שלך" },
      { name: "description", content: "המרחב האישי שלך ב-My Stylist." },
    ],
  }),
  component: AppWorkspace,
});

function AppWorkspace() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) navigate({ to: "/" });
  }, [navigate]);

  const [context, setContext] = useState("");
  const [city, setCity] = useState("Tel Aviv");
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [running, setRunning] = useState(false);
  const [scan, setScan] = useState(0);
  const [stage, setStage] = useState(0);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<StylingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<File | null>(null);

  const start = async () => {
    if (running) return;
    setRunning(true);
    setDone(false);
    setError(null);
    setScan(0);
    setStage(1);
    setResult(null);

    let n = 0;
    let stageLocal = 1;
    const id = setInterval(() => {
      n += 2;
      setScan(Math.min(88, n));
      if (n >= 25 && stageLocal < 2) { stageLocal = 2; setStage(2); }
      if (n >= 55 && stageLocal < 3) { stageLocal = 3; setStage(3); }
    }, 120);

    try {
      const res = await generateLook(
        context || "casual outing",
        city,
        context
      );
      clearInterval(id);
      setScan(100);
      setStage(3);
      setResult(res);
      setTimeout(() => {
        setDone(true);
        setRunning(false);
      }, 400);
    } catch (err: unknown) {
      clearInterval(id);
      setRunning(false);
      setStage(0);
      setScan(0);
      setError(err instanceof Error ? err.message : "שגיאה בייצור הלוק");
    }
  };

  const handleFiles = (f: File | undefined) => {
    if (f) {
      setFileName(f.name);
      fileRef.current = f;
    }
  };

  const canStart = context.trim().length > 0 || fileName !== null;

  return (
    <div className="relative min-h-screen text-foreground">
      <WaveBackground />
      <SiteHeader />

      <main className="relative px-4 pt-28 pb-12">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-accent">
                <Sparkles className="h-3.5 w-3.5" />
                המרחב שלך
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                בואו ניצור לוק
              </h1>
            </div>
            <Link
              to="/"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-muted-foreground transition hover:bg-white/10"
            >
              חזרה לדף הבית
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {/* COL 1 — INPUT */}
            <section className="glass-strong rounded-3xl p-6">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
                שלב 1 · הפרטים שלך
              </h2>
              <div className="mt-5 space-y-5">
                <Field label="תמונת ייחוס (אופציונלי)">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragging(true);
                    }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragging(false);
                      handleFiles(e.dataTransfer.files?.[0]);
                    }}
                    onClick={() => inputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed p-7 text-center transition ${
                      dragging
                        ? "border-accent/70 bg-accent/5"
                        : "border-white/15 bg-white/[0.02] hover:border-white/30"
                    }`}
                  >
                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFiles(e.target.files?.[0] || undefined)
                      }
                    />
                    {fileName ? (
                      <>
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15">
                          <Check className="h-5 w-5 text-emerald-400" />
                        </div>
                        <div className="text-sm font-medium">{fileName}</div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setFileName(null);
                            fileRef.current = null;
                          }}
                          className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                          הסירו תמונה
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="grid h-10 w-10 place-items-center rounded-xl bg-white/5">
                          <Upload className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="text-sm font-medium">
                          גררו תמונה לכאן או לחצו לבחירה
                        </div>
                        <div className="text-xs text-muted-foreground">
                          JPG · PNG · עד 10MB · פרטי לחלוטין
                        </div>
                      </>
                    )}
                  </div>
                </Field>

                <Field label="לאן אתם הולכים?">
                  <textarea
                    value={context}
                    onChange={(e) => setContext(e.target.value)}
                    rows={4}
                    placeholder="למשל: פגישת עבודה בתל אביב, גוונים כהים, אוהב גזרה מחויטת…"
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition focus:border-accent/50 focus:bg-white/[0.05]"
                  />
                </Field>

                <Field label="עיר (לתחזית מזג אוויר)">
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Tel Aviv"
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm outline-none transition focus:border-accent/50 focus:bg-white/[0.05]"
                  />
                </Field>

                {error && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={start}
                  disabled={!canStart || running}
                  className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-[#f0d8a8] via-[#e8c089] to-[#b88a3f] px-6 py-3.5 text-sm font-semibold text-black shadow-[0_8px_30px_-8px_rgba(240,200,140,0.6)] transition hover:shadow-[0_12px_40px_-8px_rgba(240,200,140,0.9)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  {running ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      מנתח…
                    </>
                  ) : (
                    <>
                      צרו לי לוק
                      <ArrowRight className="h-4 w-4 rotate-180 transition group-hover:-translate-x-1" />
                    </>
                  )}
                </button>
              </div>
            </section>

            {/* COL 2 — PROCESSING */}
            <section className="glass-strong rounded-3xl p-6">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
                שלב 2 · ניתוח AI
              </h2>

              <div className="mt-5">
                <ProcessRow
                  active={stage >= 1}
                  done={stage > 1 || (stage === 1 && scan >= 30)}
                  icon={<ScanLine className="h-4 w-4" />}
                  label="מנתח סגנון ואירוע"
                  meta={stage >= 1 ? `${scan}%` : "—"}
                  loading={stage === 1 && running}
                />
                <ProcessRow
                  active={stage >= 2}
                  done={stage > 2 || (stage >= 2 && scan >= 88)}
                  icon={<Sparkles className="h-4 w-4" />}
                  label="מייצר המלצות לבוש"
                  meta={stage >= 2 ? "Gemini AI" : "—"}
                  loading={stage === 2 && running}
                />
                <ProcessRow
                  active={stage >= 3}
                  done={done}
                  icon={<Store className="h-4 w-4" />}
                  label="מאתר פריטים בחנויות"
                  meta={
                    done
                      ? `${result?.items.length ?? 0} פריטים`
                      : stage >= 3
                        ? "סורק…"
                        : "—"
                  }
                  loading={stage === 3 && running}
                />
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-[11px] leading-relaxed">
                <div className="text-muted-foreground"># live_analysis.log</div>
                <div className="mt-1 text-emerald-300/90">
                  {stage >= 1 && "› init: gemini-2.0-flash ready"}
                </div>
                <div className="text-emerald-300/90">
                  {stage >= 2 &&
                    `› event: ${context.slice(0, 32) || "casual outing"}`}
                </div>
                <div className="text-emerald-300/90">
                  {stage >= 2 && `› city: ${city}`}
                </div>
                <div className="text-emerald-300/90">
                  {stage >= 3 && "› stores: ZARA, COS, H&M, FOX…"}
                </div>
                {result?.style_tip && (
                  <div className="text-accent/90 mt-1">
                    › tip: {result.style_tip.slice(0, 55)}
                  </div>
                )}
                <div className="text-accent">
                  {done && "› look_ready ✓"}
                </div>
              </div>

              {!running && !done && (
                <div className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 p-6 text-xs text-muted-foreground">
                  <ImageIcon className="h-4 w-4" />
                  תארו את האירוע כדי להתחיל
                </div>
              )}
            </section>

            {/* COL 3 — RESULT */}
            <section className="glass-strong rounded-3xl p-6">
              <h2 className="text-sm font-semibold tracking-wide text-muted-foreground">
                שלב 3 · הלוק שלך
              </h2>

              {!done ? (
                <div className="mt-5 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 p-10 text-center">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5">
                    <Shirt className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="text-sm font-medium">הלוק שלכם יופיע כאן</div>
                  <div className="text-xs text-muted-foreground">
                    עם קישורי קנייה אמיתיים מחנויות בישראל
                  </div>
                </div>
              ) : result ? (
                <div className="mt-5 space-y-3">
                  <div className="rounded-2xl border border-accent/30 bg-gradient-to-bl from-accent/10 to-transparent p-4">
                    <div className="flex items-center gap-2 text-xs text-accent">
                      <Sparkles className="h-3.5 w-3.5" />
                      לוק מוכן
                    </div>
                    <div className="mt-1 text-sm font-semibold leading-snug">
                      {result.outfit_description}
                    </div>
                    {result.style_tip && (
                      <div className="mt-2 border-t border-white/10 pt-2 text-xs text-muted-foreground">
                        💡 {result.style_tip}
                      </div>
                    )}
                  </div>

                  {result.items.map((item, i) => (
                    <OutfitItem key={i} item={item} index={i} />
                  ))}

                  <div className="mt-2 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                    <span className="text-xs text-muted-foreground">
                      {result.items.length} פריטים בלוק
                    </span>
                    <span className="text-xs text-accent">
                      Powered by Gemini AI ✨
                    </span>
                  </div>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

function OutfitItem({ item, index }: { item: StylingItem; index: number }) {
  const best = item.search_results?.[0];
  const categoryLabel: Record<string, string> = {
    top: "חולצה",
    bottom: "מכנס/חצאית",
    shoes: "נעליים",
    accessory: "אקססורי",
    outerwear: "חיצוני",
  };

  return (
    <article
      className="group flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-accent/40 hover:bg-white/[0.05]"
      style={{ animation: `fade-up 0.5s ${index * 0.08}s both` }}
    >
      <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/[0.02]">
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
          <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-muted-foreground">
            {categoryLabel[item.category] ?? item.category}
          </span>
          {best?.source && (
            <span className="rounded-full bg-accent/10 px-2 py-0.5 text-[10px] text-accent/80">
              {best.source}
            </span>
          )}
        </div>
        <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
          {item.description}
        </div>
        {best?.price && (
          <div className="mt-0.5 text-sm font-bold tabular-nums text-accent">
            {best.price}
          </div>
        )}
      </div>
      <a
        href={
          best?.link ??
          `https://www.google.com/search?q=${encodeURIComponent(item.search_query)}&tbm=shop`
        }
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold transition hover:bg-accent hover:text-black"
      >
        לקנייה
        <ExternalLink className="h-3 w-3" />
      </a>
    </article>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 text-xs font-medium text-muted-foreground">
        {label}
      </div>
      {children}
    </label>
  );
}

function ProcessRow({
  active,
  done,
  loading,
  icon,
  label,
  meta,
}: {
  active: boolean;
  done?: boolean;
  loading?: boolean;
  icon: React.ReactNode;
  label: string;
  meta: string;
}) {
  return (
    <div
      className={`flex items-center gap-3 border-b border-white/5 py-3 last:border-0 ${
        !active ? "opacity-40" : ""
      }`}
    >
      <div
        className={`grid h-9 w-9 place-items-center rounded-xl transition ${
          done
            ? "bg-emerald-500/15 text-emerald-400"
            : active
              ? "bg-accent/15 text-accent"
              : "bg-white/5 text-muted-foreground"
        }`}
      >
        {done ? (
          <Check className="h-4 w-4" />
        ) : loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          icon
        )}
      </div>
      <div className="flex-1 text-sm font-medium">{label}</div>
      <div
        className={`text-xs tabular-nums ${
          done ? "text-emerald-400" : "text-muted-foreground"
        }`}
      >
        {done ? "הושלם · " + meta : meta}
      </div>
    </div>
  );
}
