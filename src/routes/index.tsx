import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ChevronDown,
  Sparkles,
  ScanFace,
  Wand2,
  Search,
  Check,
} from "lucide-react";
import { useState } from "react";
import { WaveBackground } from "@/components/WaveBackground";
import { SiteHeader } from "@/components/SiteHeader";
import { AIProcessShowcase, HeroCTA } from "@/components/AIProcessShowcase";
import { AuthModal, openAuth } from "@/components/AuthModal";
import { StyleShowcase } from "@/components/StyleShowcase";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "My Stylist · סטייליסט אישי מבוסס AI" },
      {
        name: "description",
        content:
          "העלו תמונה, ספרו לאן אתם הולכים — וקבלו לוק שלם שמתאים בדיוק לכם, עם קישורי קנייה אמיתיים מחנויות בישראל.",
      },
      { property: "og:title", content: "My Stylist · סטייליסט אישי מבוסס AI" },
      {
        property: "og:description",
        content: "לוק שלם בלחיצה אחת. מבוסס AI. קישורי קנייה אמיתיים.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="relative min-h-screen text-foreground">
      <WaveBackground />
      <SiteHeader />

      <main className="relative">
        <Hero />
        <AIProcessShowcase />
        <Features />
        <Pricing />
        <FAQ />
        <Footer />
      </main>
    </div>
  );
}

function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-40 pb-24 text-center">
      <div className="animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-5 py-2 text-xs text-muted-foreground/90 backdrop-blur-md shadow-[0_0_30px_-10px_rgba(255,255,255,0.3)]">
          <Sparkles className="h-3.5 w-3.5 text-white/80" />
          סטייליסט אישי · מבוסס AI
        </span>
      </div>


      <h1
        className="mt-12 max-w-4xl text-balance text-5xl font-medium leading-[1.08] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[84px]"
        style={{ animation: "fade-up 0.9s 0.1s both", fontWeight: 500, letterSpacing: "-0.02em" }}
      >
        הסטייל שלך,
        <br />
        בלחיצה אחת.
      </h1>

      <p
        className="mt-10 max-w-2xl text-balance text-base leading-relaxed text-muted-foreground sm:text-lg"
        style={{ animation: "fade-up 0.9s 0.2s both" }}
      >
        העלו תמונה, ספרו לנו לאן אתם הולכים — וקבלו לוק שלם שמתאים בדיוק למבנה
        הגוף ולטעם שלכם, עם קישורי קנייה אמיתיים מחנויות בישראל.
      </p>

      <div
        className="mt-14 flex flex-wrap items-center justify-center gap-3"
        style={{ animation: "fade-up 0.9s 0.3s both" }}
      >
        <HeroCTA />
        <a
          href="#how"
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.03] px-7 py-3.5 text-sm font-medium text-foreground/90 backdrop-blur-md transition hover:border-white/25 hover:bg-white/[0.07]"
        >
          איך זה עובד
        </a>
      </div>


      <div
        className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground"
        style={{ animation: "fade-up 0.9s 0.4s both" }}
      >
        <span className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          דקה להרשמה
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          בלי כרטיס אשראי
        </span>
        <span className="flex items-center gap-1.5">
          <Check className="h-3.5 w-3.5 text-emerald-400" />
          תמונות פרטיות ומאובטחות
        </span>
      </div>

      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-xs text-muted-foreground"
        style={{ animation: "float-slow 3s ease-in-out infinite" }}
      >
        <div className="flex flex-col items-center gap-2">
          <span>גללו לגלות עוד</span>
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  {
    icon: ScanFace,
    title: "ניתוח מבנה גוף",
    body: "בינה מלאכותית מזהה את מבנה הגוף שלכם מתוך תמונה אחת — כדי שכל המלצה תשב מושלם על הגזרה שלכם.",
  },
  {
    icon: Wand2,
    title: "סטיילינג חכם",
    body: "תיאור אירוע, עיר ומזג אוויר — ומקבלים לוק שלם מותאם אישית עם טיפ סטיילינג חד וקישורי קנייה.",
  },
  {
    icon: Search,
    title: "חיפוש ויזואלי",
    body: "צילמתם פריט שאהבתם? העלו תמונה ונמצא לכם אותו (או דומה) בחנויות המובילות בישראל.",
  },
];

function Features() {
  return (
    <section id="features" className="relative mx-auto max-w-7xl px-4 py-24">
      <div className="text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          היכולות
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          שלוש מערכות AI עובדות ביחד כדי לתת לך לוק שמרגיש תפור-עליך.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div
            key={f.title}
            className="glass group relative overflow-hidden rounded-3xl p-7 transition hover:border-accent/30"
          >
            <div className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-accent/10 opacity-0 blur-3xl transition group-hover:opacity-100" />
            <div className="relative">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-white/10 to-white/[0.02] border border-white/10">
                <f.icon className="h-5 w-5 text-accent" />
              </div>
              <h3 className="mt-5 text-xl font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
              <button className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent transition hover:gap-2.5">
                גלו עוד
                <ArrowLeft className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

const PLANS = [
  {
    name: "חינם",
    price: "₪0",
    cta: "להתחיל עכשיו",
    highlight: false,
    features: [
      "ניתוח מבנה גוף בסיסי",
      "3 המלצות סטיילינג בחודש",
      "חיפוש ויזואלי מוגבל",
    ],
  },
  {
    name: "פרו",
    price: "₪39",
    cta: "להתחיל ניסיון",
    highlight: true,
    badge: "הכי פופולרי",
    features: [
      "ניתוח גוף מתקדם + סקיצה",
      "המלצות ללא הגבלה",
      "התאמה למזג אוויר ואירוע",
      "היסטוריה מלאה",
    ],
  },
  {
    name: "פרימיום",
    price: "₪89",
    cta: "דברו איתנו",
    highlight: false,
    features: [
      "כל מה שיש בפרו",
      "עד 4 פרופילים",
      "המלצות מעצב אנושי בליווי AI",
      "תמיכה מועדפת",
    ],
  },
];

function Pricing() {
  return (
    <section id="pricing" className="relative mx-auto max-w-7xl px-4 py-24">
      <div className="text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">מחירים</h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          תכניות פשוטות. בלי כוכביות. שדרגו או בטלו בכל רגע.
        </p>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {PLANS.map((p) => (
          <div
            key={p.name}
            className={`relative rounded-3xl p-7 transition ${
              p.highlight
                ? "glass-strong glow-ring"
                : "glass hover:border-white/20"
            }`}
          >
            {p.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-l from-[#f0d8a8] to-[#b88a3f] px-3 py-1 text-[11px] font-semibold text-black">
                {p.badge}
              </span>
            )}
            <div className="text-sm text-muted-foreground">{p.name}</div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="text-5xl font-bold tracking-tight">{p.price}</span>
              <span className="text-sm text-muted-foreground">/חודש</span>
            </div>
            <ul className="mt-7 space-y-3">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-accent" />
                  <span className="text-muted-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/app"
              className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition ${
                p.highlight
                  ? "bg-gradient-to-l from-[#f0d8a8] to-[#b88a3f] text-black shadow-[0_8px_30px_-8px_rgba(240,200,140,0.6)] hover:shadow-[0_12px_40px_-8px_rgba(240,200,140,0.9)]"
                  : "border border-white/15 bg-white/5 hover:bg-white/10"
              }`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "האם התמונות שלי נשמרות באופן פרטי?",
    a: "בהחלט. התמונות משמשות אך ורק לניתוח עבורכם, נשמרות מאובטחות, ואתם יכולים למחוק אותן בכל רגע מההגדרות. אנחנו לא משתפים תמונות עם צד שלישי.",
  },
  {
    q: "איך עובד ניתוח מבנה הגוף?",
    a: "המערכת מזהה 33 נקודות ייחוס על הגוף מתוך תמונה אחת, מחשבת יחסים אנטומיים (כתפיים-מותניים-ירכיים) ומשייכת את הגזרה האידיאלית לכל פריט.",
  },
  {
    q: "מאיפה מגיעים הפריטים והמחירים?",
    a: "אנחנו מתחברים בזמן אמת לחנויות המובילות בישראל (ZARA, COS, Castro, Renuar ועוד) ומציגים מחירים, מידות וזמינות עדכניים.",
  },
  {
    q: "האם אפשר להשתמש בנייד וגם במחשב?",
    a: "כן. הממשק מותאם במלואו לנייד ולדסקטופ, וכל פרופיל מסונכרן בענן.",
  },
  {
    q: "מה ההבדל בין המסלול החינמי לפרו?",
    a: "החינמי מאפשר 3 המלצות בחודש וחיפוש ויזואלי מוגבל. פרו פותח המלצות ללא הגבלה, ניתוח גוף מתקדם, היסטוריה מלאה והתאמה למזג אוויר.",
  },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="relative mx-auto max-w-3xl px-4 py-24">
      <div className="text-center">
        <h2 className="text-4xl font-bold tracking-tight sm:text-5xl">
          שאלות ותשובות
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
          לא מצאתם תשובה? כתבו לנו ב-hello@mystylist.ai
        </p>
      </div>
      <div className="mt-12 space-y-3">
        {FAQS.map((f, i) => {
          const isOpen = open === i;
          return (
            <div
              key={f.q}
              className="glass overflow-hidden rounded-2xl transition"
            >
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-right"
              >
                <span className="text-sm font-medium sm:text-base">{f.q}</span>
                <ChevronDown
                  className={`h-4 w-4 flex-shrink-0 text-muted-foreground transition ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-5 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {f.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="relative border-t border-white/5 px-4 py-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-[#f0d8a8] to-[#b88a3f] text-xs font-black text-black">
            M
          </span>
          <span>My Stylist © 2026</span>
        </div>
        <div className="flex gap-5 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground">תנאי שימוש</a>
          <a href="#" className="hover:text-foreground">פרטיות</a>
          <a href="#" className="hover:text-foreground">צרו קשר</a>
        </div>
      </div>
    </footer>
  );
}
