import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  BookMarked,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
  Shirt,
  Sparkles,
  Trash2,
  Wind,
} from "lucide-react";
import { WaveBackground } from "@/components/WaveBackground";
import { SiteHeader } from "@/components/SiteHeader";
import {
  getWardrobe,
  toggleSave,
  deleteSession,
  type WardrobeSession,
  type StylingItem,
} from "@/lib/api/styling";
import { isAuthenticated } from "@/lib/api/client";

export const Route = createFileRoute("/wardrobe")({
  beforeLoad: () => {
    if (!isAuthenticated()) throw new Error("unauthenticated");
  },
  head: () => ({
    meta: [{ title: "My Stylist · ארון הבגדים שלי" }],
  }),
  component: WardrobePage,
});

function WardrobePage() {
  const [sessions, setSessions] = useState<WardrobeSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getWardrobe()
      .then(setSessions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleUnsave = async (id: string) => {
    await toggleSave(id);
    setSessions((s) => s.filter((x) => x.id !== id));
  };

  const handleDelete = async (id: string) => {
    await deleteSession(id);
    setSessions((s) => s.filter((x) => x.id !== id));
  };

  return (
    <div className="relative min-h-screen text-foreground">
      <WaveBackground />
      <SiteHeader />

      <main className="relative px-4 pt-28 pb-20">
        <div className="mx-auto max-w-4xl">
          {/* Header */}
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4 animate-fade-up">
            <div>
              <div className="flex items-center gap-2 text-xs text-accent">
                <BookMarked className="h-3.5 w-3.5" />
                הלוקים השמורים שלך
              </div>
              <h1 className="mt-1 text-3xl font-bold tracking-tight">
                ארון הבגדים
              </h1>
              {!loading && sessions.length > 0 && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {sessions.length} לוק{sessions.length !== 1 ? "ים" : ""} שמורים
                </p>
              )}
            </div>
            <Link
              to="/app"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-[#f0d8a8] via-[#e8c089] to-[#b88a3f] px-5 py-2.5 text-sm font-semibold text-black shadow-[0_6px_24px_-6px_rgba(240,200,140,0.6)] transition hover:shadow-[0_10px_32px_-6px_rgba(240,200,140,0.9)]"
            >
              <Sparkles className="h-3.5 w-3.5" />
              צור לוק חדש
            </Link>
          </div>

          {/* States */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-4 py-24">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 rounded-full border-2 border-accent/30 animate-ping" />
                <div className="absolute inset-2 rounded-full border border-accent/50" />
                <div className="flex h-full w-full items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-accent" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">טוען את הארון…</p>
            </div>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          {!loading && !error && sessions.length === 0 && (
            <EmptyWardrobe />
          )}

          {!loading && !error && sessions.length > 0 && (
            <div className="space-y-4">
              {sessions.map((s, i) => (
                <LookCard
                  key={s.id}
                  session={s}
                  index={i}
                  onUnsave={handleUnsave}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── Empty State ─── */
function EmptyWardrobe() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-24 text-center animate-fade-up">
      {/* Decorative icon */}
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-accent/10 blur-2xl animate-orb-float" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.04]">
          <BookMarked className="h-9 w-9 text-accent/70" />
        </div>
      </div>
      <div>
        <h2 className="text-xl font-semibold">הארון ריק עדיין</h2>
        <p className="mt-2 max-w-xs text-sm text-muted-foreground">
          צרו לוק בסורק ה-AI ולחצו על "שמור לארון הבגדים" כדי לשמור אותו כאן
        </p>
      </div>
      <Link
        to="/app"
        className="inline-flex items-center gap-2 rounded-full bg-gradient-to-l from-[#f0d8a8] via-[#e8c089] to-[#b88a3f] px-6 py-3 text-sm font-semibold text-black shadow-[0_8px_28px_-8px_rgba(240,200,140,0.6)] transition hover:shadow-[0_12px_36px_-8px_rgba(240,200,140,0.9)]"
      >
        <Sparkles className="h-4 w-4" />
        צור לוק ראשון
      </Link>
    </div>
  );
}

/* ─── Look Card ─── */
function LookCard({
  session,
  index,
  onUnsave,
  onDelete,
}: {
  session: WardrobeSession;
  index: number;
  onUnsave: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [actioning, setActioning] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const date = new Date(session.created_at).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const weather = session.weather_data;

  const handleUnsave = async () => {
    setActioning(true);
    try { await onUnsave(session.id); } finally { setActioning(false); }
  };

  const handleDelete = async () => {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    setActioning(true);
    try { await onDelete(session.id); } finally { setActioning(false); }
  };

  // Pick 2-3 item thumbnails for the preview strip
  const thumbs = session.items
    .map((it) => it.search_results?.[0]?.thumbnail)
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div
      className="glass-strong overflow-hidden rounded-3xl border border-white/10 transition-all duration-300 animate-result-in"
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      {/* ── Card header ── */}
      <div className="flex items-start gap-4 p-5">
        {/* Thumbnail strip */}
        <div className="flex shrink-0 gap-1">
          {thumbs.length > 0 ? (
            thumbs.map((src, i) => (
              <div
                key={i}
                className="h-14 w-14 overflow-hidden rounded-xl bg-white/5 first:rounded-r-xl"
              >
                <img
                  src={src!}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
                />
              </div>
            ))
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/5">
              <Shirt className="h-6 w-6 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="font-semibold leading-snug">
                {session.look_title ?? session.event_type ?? "לוק שמור"}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                <span>{date}</span>
                {weather?.city && (
                  <>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Wind className="h-3 w-3" />
                      {weather.city}
                      {weather.temp != null && ` · ${weather.temp}°C`}
                    </span>
                  </>
                )}
                <span>·</span>
                <span>{session.items_count} פריטים</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {!confirmDelete ? (
                <>
                  <button
                    onClick={handleUnsave}
                    disabled={actioning}
                    title="הסר מהארון"
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:border-accent/40 hover:text-accent"
                  >
                    {actioning ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BookMarked className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={handleDelete}
                    title="מחק לוק"
                    className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:border-red-400/40 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDelete}
                    disabled={actioning}
                    className="rounded-full bg-red-500/20 px-3 py-1 text-xs font-semibold text-red-400 transition hover:bg-red-500/30"
                  >
                    {actioning ? <Loader2 className="h-3 w-3 animate-spin" /> : "מחק"}
                  </button>
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs text-muted-foreground hover:text-white"
                  >
                    ביטול
                  </button>
                </div>
              )}
              <button
                onClick={() => setExpanded((v) => !v)}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-white/5 text-muted-foreground transition hover:bg-white/10"
              >
                {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          {/* Description preview */}
          {session.outfit_description && (
            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
              {session.outfit_description}
            </p>
          )}
        </div>
      </div>

      {/* ── Expanded items ── */}
      {expanded && (
        <div className="border-t border-white/5 px-5 pb-5 pt-4">
          {session.style_tip && (
            <div className="mb-3 rounded-xl border border-accent/20 bg-accent/5 px-4 py-2.5 text-xs text-muted-foreground">
              💡 {session.style_tip}
            </div>
          )}
          <div className="grid gap-2 sm:grid-cols-2">
            {session.items.map((item, i) => (
              <MiniItemCard key={i} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniItemCard({ item }: { item: StylingItem }) {
  const best = item.search_results?.[0];
  const categoryLabel: Record<string, string> = {
    top: "חולצה", bottom: "מכנס/חצאית", shoes: "נעליים",
    accessory: "אקססורי", outerwear: "חיצוני",
  };

  return (
    <div className="flex items-center gap-2.5 rounded-2xl border border-white/5 bg-white/[0.02] p-2.5">
      <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl bg-white/5 flex items-center justify-center">
        {best?.thumbnail ? (
          <img src={best.thumbnail} alt={item.name} className="h-full w-full object-cover"
            onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
        ) : (
          <Shirt className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-xs font-semibold">{item.name}</span>
          <span className="shrink-0 rounded-full bg-white/5 px-1.5 py-0.5 text-[9px] text-muted-foreground">
            {categoryLabel[item.category] ?? item.category}
          </span>
        </div>
        {best?.price && <div className="mt-0.5 text-xs font-bold text-accent">{best.price}</div>}
      </div>
      {best?.link && (
        <a href={best.link} target="_blank" rel="noopener noreferrer"
          className="shrink-0 grid h-7 w-7 place-items-center rounded-full bg-white/5 text-muted-foreground transition hover:bg-accent hover:text-black">
          <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </div>
  );
}
