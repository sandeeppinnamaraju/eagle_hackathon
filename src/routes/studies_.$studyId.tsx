import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { studies } from "@/lib/data";
import { StudyOverviewContent } from "@/components/study-overview/study-overview-content";
import type { CumulativePoint, RatePoint, SiteRow, StudyDetail, StudyRange, BreakdownView } from "@/components/study-overview/types";

export const Route = createFileRoute("/studies_/$studyId")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.studyId} — Study Overview — Flight Deck` },
      { name: "description", content: "Detailed study overview including enrollment, performance, and country breakdown." },
    ],
  }),
  component: StudyOverviewPage,
});

const SHARED_BREAKDOWN: Pick<StudyDetail,
  "asset" | "assetLead" | "fsoModel" | "sponsor" | "designation" | "targetEnrollment" |
  "plannedFPI" | "actualFPI" | "plannedLPI" | "forecastLPI" | "enrollmentVsPlan" |
  "enrollmentActual" | "enrollmentPlan" | "rateActual" | "ratePlan" | "screenFailureRate" |
  "dropoutRate" | "sitesActivated" | "sitesPlanned" | "countriesActivated" | "countriesPlanned" |
  "countries" | "sites" | "underperformingTop" | "overperformingTop"
> = {
  asset: "OMP-770",
  assetLead: "Dr. Lisa Miller",
  fsoModel: "Full Service Outsourcing (FSO) · Hybrid",
  sponsor: "ApexBio Research",
  designation: "Fast Track",
  targetEnrollment: 148,
  plannedFPI: "28 Mar 2024",
  actualFPI: "27 Mar 2024",
  plannedLPI: "30 Sept 2029",
  forecastLPI: "—",
  enrollmentVsPlan: 106.5,
  enrollmentActual: 49,
  enrollmentPlan: 46,
  rateActual: 0.5,
  ratePlan: 0.4,
  screenFailureRate: 17.3,
  dropoutRate: 3.6,
  sitesActivated: 24,
  sitesPlanned: 24,
  countriesActivated: 6,
  countriesPlanned: 6,
  countries: [
    { name: "Canada", target: 31, actual: 27, pct: 87.1, sitesActive: 2, avgRate: 3.4, status: "At Risk" },
    { name: "France", target: 18, actual: 0, pct: 0.0, sitesActive: 2, avgRate: 0.0, status: "Off Track" },
    { name: "Mexico", target: 31, actual: 16, pct: 51.6, sitesActive: 5, avgRate: 0.9, status: "Off Track" },
    { name: "New Zealand", target: 22, actual: 0, pct: 0.0, sitesActive: 3, avgRate: 0.0, status: "Off Track" },
    { name: "South Korea", target: 17, actual: 0, pct: 0.0, sitesActive: 6, avgRate: 0.0, status: "Off Track" },
    { name: "Sweden", target: 29, actual: 0, pct: 0.0, sitesActive: 6, avgRate: 0.0, status: "Off Track" },
  ],
  sites: [
    { id: "S0001", name: "CANA-Cancer Center", country: "Canada", target: 20, actual: 16, pct: 80.0, status: "ON HOLD" },
    { id: "S0002", name: "CANA-Research Institute", country: "Canada", target: 11, actual: 11, pct: 100.0, status: "SCREENING" },
    { id: "S0008", name: "FRAN-General Hospital", country: "France", target: 10, actual: 0, pct: 0.0, status: "ON HOLD" },
    { id: "S0009", name: "FRAN-Medical Center", country: "France", target: 8, actual: 0, pct: 0.0, status: "SCREENING" },
    { id: "S0005", name: "MEXI-Cancer Center", country: "Mexico", target: 6, actual: 3, pct: 50.0, status: "ON HOLD" },
    { id: "S0003", name: "MEXI-Clinical Center", country: "Mexico", target: 8, actual: 8, pct: 100.0, status: "ON HOLD" },
    { id: "S0006", name: "MEXI-Medical Center", country: "Mexico", target: 7, actual: 0, pct: 0.0, status: "SCREENING" },
    { id: "S0004", name: "MEXI-Research Institute", country: "Mexico", target: 6, actual: 5, pct: 83.3, status: "ON HOLD" },
    { id: "S0007", name: "MEXI-University Hospital", country: "Mexico", target: 4, actual: 0, pct: 0.0, status: "CLOSED" },
    { id: "S0017", name: "NEW-Clinical Center", country: "New Zealand", target: 6, actual: 0, pct: 0.0, status: "SCREENING" },
    { id: "S0016", name: "NEW-Health System", country: "New Zealand", target: 9, actual: 0, pct: 0.0, status: "CLOSED" },
    { id: "S0018", name: "NEW-Medical Center", country: "New Zealand", target: 7, actual: 0, pct: 0.0, status: "SCREENING" },
    { id: "S0024", name: "SOUT-Clinical Center", country: "South Korea", target: 3, actual: 0, pct: 0.0, status: "ON HOLD" },
    { id: "S0023", name: "SOUT-General Hospital", country: "South Korea", target: 3, actual: 0, pct: 0.0, status: "ON HOLD" },
    { id: "S0019", name: "SOUT-Health System", country: "South Korea", target: 2, actual: 0, pct: 0.0, status: "CLOSED" },
    { id: "S0020", name: "SOUT-Research Institute", country: "South Korea", target: 3, actual: 0, pct: 0.0, status: "CLOSED" },
    { id: "S0021", name: "SOUT-Research Institute", country: "South Korea", target: 3, actual: 0, pct: 0.0, status: "ON HOLD" },
    { id: "S0022", name: "SOUT-University Hospital", country: "South Korea", target: 3, actual: 0, pct: 0.0, status: "SCREENING" },
    { id: "S0014", name: "SWED-Cancer Center", country: "Sweden", target: 6, actual: 0, pct: 0.0, status: "ON HOLD" },
    { id: "S0013", name: "SWED-Cancer Center", country: "Sweden", target: 3, actual: 0, pct: 0.0, status: "ON HOLD" },
    { id: "S0011", name: "SWED-Cancer Center", country: "Sweden", target: 5, actual: 0, pct: 0.0, status: "ON HOLD" },
    { id: "S0010", name: "SWED-Clinical Center", country: "Sweden", target: 4, actual: 0, pct: 0.0, status: "ON HOLD" },
    { id: "S0012", name: "SWED-General Hospital", country: "Sweden", target: 5, actual: 0, pct: 0.0, status: "ON HOLD" },
    { id: "S0015", name: "SWED-Research Institute", country: "Sweden", target: 6, actual: 0, pct: 0.0, status: "ON HOLD" },
  ],
  underperformingTop: {
    shortfall: [
      { rank: 1, name: "NETH-University Hospital", value: "-23 pts" },
      { rank: 2, name: "POLA-Medical Center", value: "-18 pts" },
      { rank: 3, name: "POLA-Research Institute", value: "-15 pts" },
    ],
    pctBelow: [
      { rank: 1, name: "NETH-University Hospital", value: "-100%" },
      { rank: 2, name: "POLA-Medical Center", value: "-100%" },
      { rank: 3, name: "POLA-Research Institute", value: "-100%" },
    ],
  },
  overperformingTop: {
    shortfall: [
      { rank: 1, name: "CANA-Research Institute", value: "+11 pts" },
      { rank: 2, name: "MEXI-Clinical Center", value: "+8 pts" },
      { rank: 3, name: "CANA-Cancer Center", value: "+3 pts" },
    ],
    pctBelow: [
      { rank: 1, name: "CANA-Research Institute", value: "+100%" },
      { rank: 2, name: "MEXI-Clinical Center", value: "+100%" },
      { rank: 3, name: "MEXI-Research Institute", value: "+83%" },
    ],
  },
};

const detailMap: Record<string, StudyDetail> = {
  "ST-2024-002": SHARED_BREAKDOWN,
  "ST-2024-003": SHARED_BREAKDOWN,
};

function cumulativeData(target: number, actual: number): CumulativePoint[] {
  const months = ["Mar 24", "Oct 24", "May 25", "Dec 25", "Jul 26", "Feb 27", "Sept 27", "Apr 28", "Nov 28", "Jun 29"];
  return months.map((m, i) => {
    const t = i / (months.length - 1);
    const s = 1 / (1 + Math.exp(-6 * (t - 0.45)));
    const planned = Math.round(target * s);
    const forecast = Math.round(target * s * 0.98);
    const a = i <= 4 ? Math.round(actual * (i / 4)) : null;
    return { month: m, planned, forecast, actual: a };
  });
}

function rateData(): RatePoint[] {
  const months = ["Mar 24","May 24","Jul 24","Sept 24","Nov 24","Jan 25","Mar 25","May 25","Jul 25","Sept 25","Nov 25","Jan 26","Mar 26","May 26"];
  return months.map((m, i) => ({
    month: m,
    actual: [2,0,1,1,1,1,2,1,2,3,3,2,1,3][i] ?? 0,
    planned: [1,1,1,1,1,1,2,2,2,3,3,2,3,5][i] ?? 0,
  }));
}

const COUNTRY_POOL = ["United States", "Canada", "United Kingdom", "Germany", "France", "Spain", "Italy", "Australia", "Japan", "South Korea", "Brazil", "Mexico", "Sweden", "New Zealand", "Netherlands", "Poland"];
const SPONSOR_POOL = ["ApexBio Research", "Genovex Therapeutics", "Helix Pharma", "Northstar Bio", "Vanta Sciences", "Meridian Labs"];
const LEAD_POOL = ["Dr. Lisa Miller", "Dr. James Chen", "Dr. Priya Patel", "Dr. Anders Holm", "Dr. Maria Rossi", "Dr. Samuel Okafor"];
const FSO_POOL = ["Full Service Outsourcing (FSO) · Hybrid", "Functional Service Provider (FSP)", "Full Service Outsourcing (FSO)", "Hybrid FSP/FSO"];
const DESIGN_POOL = ["Fast Track", "Standard", "Breakthrough", "Priority Review"];
const SITE_TYPES = ["Cancer Center", "Research Institute", "Medical Center", "Clinical Center", "General Hospital", "University Hospital", "Health System"];
const SITE_STATUSES: SiteRow["status"][] = ["SCREENING", "ON HOLD", "CLOSED", "ENROLLING"];

function hash(s: string) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }
function pick<T>(arr: T[], seed: number) { return arr[seed % arr.length]; }

function buildFallback(studyId: string, study: (typeof studies)[number]): StudyDetail {
  const seed = hash(studyId);
  const target = study.target || 100;
  const actual = study.actual || 0;
  const countryCount = Math.max(1, study.countries || 3);
  const siteCount = Math.max(countryCount, study.sites || countryCount * 2);
  const names: string[] = [];
  for (let i = 0; i < countryCount; i++) {
    let n = COUNTRY_POOL[(seed + i * 7) % COUNTRY_POOL.length];
    let k = 1;
    while (names.includes(n)) n = COUNTRY_POOL[(seed + i * 7 + k++) % COUNTRY_POOL.length];
    names.push(n);
  }

  let remT = target, remA = actual;
  const countries = names.map((name, i) => {
    const isLast = i === names.length - 1;
    const t = isLast ? remT : Math.max(1, Math.min(remT - (countryCount - i - 1), Math.round(target / countryCount)));
    remT -= t;
    const aRaw = isLast ? remA : Math.round(actual * (t / target) * (0.4 + ((seed >> (i + 2)) % 12) / 10));
    const a = Math.max(0, Math.min(t, aRaw, remA));
    remA -= a;
    const pct = t ? (a / t) * 100 : 0;
    const status: "On Track" | "At Risk" | "Off Track" = pct >= 90 ? "On Track" : pct >= 50 ? "At Risk" : "Off Track";
    const sitesActive = Math.max(1, Math.round(siteCount / countryCount));
    const avgRate = Math.round((a / Math.max(1, sitesActive)) * 0.3 * 10) / 10;
    return { name, target: t, actual: a, pct: Math.round(pct * 10) / 10, sitesActive, avgRate, status };
  });

  const sites: SiteRow[] = [];
  let sid = 1;
  for (const c of countries) {
    let cT = c.target, cA = c.actual;
    const cSites = Math.max(1, c.sitesActive);
    for (let j = 0; j < cSites; j++) {
      const isLast = j === cSites - 1;
      const t = isLast ? cT : Math.max(1, Math.round(c.target / cSites));
      const tc = Math.min(t, cT); cT -= tc;
      const aR = isLast ? cA : Math.min(tc, Math.round(c.actual / cSites));
      const ac = Math.max(0, Math.min(tc, aR, cA)); cA -= ac;
      const pct = tc ? (ac / tc) * 100 : 0;
      sites.push({
        id: `S${String(sid++).padStart(4, "0")}`,
        name: `${c.name.slice(0, 4).toUpperCase()}-${pick(SITE_TYPES, seed + sid)}`,
        country: c.name,
        target: tc, actual: ac, pct: Math.round(pct * 10) / 10,
        status: pick(SITE_STATUSES, seed + sid * 3),
      });
    }
  }

  const ratePlan = Math.round((target / 60) * 10) / 10;
  const rateActual = Math.round((actual / 60) * 10) / 10;
  const evp = study.percentVsPlan ?? (target ? Math.round((actual / target) * 1000) / 10 : 0);
  const enrollmentPlan = Math.max(1, Math.round(actual / ((evp || 100) / 100)));

  return {
    asset: study.program,
    assetLead: pick(LEAD_POOL, seed),
    fsoModel: pick(FSO_POOL, seed >> 2),
    sponsor: pick(SPONSOR_POOL, seed >> 3),
    designation: pick(DESIGN_POOL, seed >> 4),
    targetEnrollment: target,
    plannedFPI: "15 Jan 2024",
    actualFPI: "12 Feb 2024",
    plannedLPI: "30 Sept 2029",
    forecastLPI: "—",
    enrollmentVsPlan: evp,
    enrollmentActual: actual,
    enrollmentPlan,
    rateActual, ratePlan,
    screenFailureRate: Math.round((10 + (seed % 200) / 10) * 10) / 10,
    dropoutRate: Math.round((2 + (seed % 60) / 10) * 10) / 10,
    sitesActivated: study.sites, sitesPlanned: study.sites,
    countriesActivated: study.countries, countriesPlanned: study.countries,
    countries,
    sites,
    underperformingTop: {
      shortfall: sites.slice().sort((a, b) => (a.actual - a.target) - (b.actual - b.target)).slice(0, 3).map((s, i) => ({ rank: i + 1, name: s.name, value: `${s.actual - s.target} pts` })),
      pctBelow: sites.slice().filter(s => s.pct < 100).sort((a, b) => a.pct - b.pct).slice(0, 3).map((s, i) => ({ rank: i + 1, name: s.name, value: `-${Math.round(100 - s.pct)}%` })),
    },
    overperformingTop: {
      shortfall: sites.slice().sort((a, b) => (b.actual - b.target) - (a.actual - a.target)).slice(0, 3).map((s, i) => ({ rank: i + 1, name: s.name, value: `+${Math.max(0, s.actual - s.target)} pts` })),
      pctBelow: sites.slice().sort((a, b) => b.pct - a.pct).slice(0, 3).map((s, i) => ({ rank: i + 1, name: s.name, value: `+${Math.round(s.pct)}%` })),
    },
  };
}

function StudyOverviewPage() {
  const { studyId } = Route.useParams();
  const study = studies.find((s) => s.id === studyId);
  const [range, setRange] = useState<StudyRange>("full");
  const [view, setView] = useState<BreakdownView>("country");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const toggle = (k: string) => setExpanded((p) => ({ ...p, [k]: !p[k] }));

  if (!study) {
    return (
      <main className="mx-auto max-w-[1600px] px-6 py-12 text-center">
        <p className="text-muted-foreground">Study not found.</p>
        <Link to="/portfolio" className="mt-4 inline-block text-primary hover:underline">← Back to Study Portfolio</Link>
      </main>
    );
  }

  const detail: StudyDetail = detailMap[studyId] ?? buildFallback(studyId, study);
  const cumulative = cumulativeData(detail.targetEnrollment, detail.enrollmentActual);
  const rates = rateData();

  return (
    <StudyOverviewContent
      study={study}
      detail={detail}
      range={range}
      onRangeChange={setRange}
      view={view}
      onViewChange={setView}
      expanded={expanded}
      onToggle={toggle}
      onSelectSiteFromCountry={(id) => {
        setView("site");
        setExpanded((p) => ({ ...p, [`s-${id}`]: true }));
        setTimeout(() => {
          document.getElementById(`site-row-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 50);
      }}
      cumulative={cumulative}
      rates={rates}
    />
  );
}
