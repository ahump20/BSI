import { useState, useEffect, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, AreaChart, Area } from "recharts";

/* ═══════════════════════════════════════════════════════════════
   BSI Labs — Redesigned Dashboard
   Heritage Design System v2.1

   Design intent: Replace the broken skeleton-only labs site with
   a data-dense, trust-forward analytics dashboard that proves
   BSI Labs works the moment the page loads.
   ═══════════════════════════════════════════════════════════════ */

// ── Heritage Tokens ──────────────────────────────────────────
const T = {
  surface: "#0A0A0A",
  pressBox: "#111111",
  dugout: "#161616",
  primary: "#BF5700",
  primaryLight: "#D4722A",
  bone: "#F5F2EB",
  dust: "#C4B8A5",
  columbia: "#4B9CD3",
  ember: "#FF6B35",
  border: "rgba(140, 98, 57, 0.3)",
  borderSubtle: "rgba(255,255,255,0.05)",
  shadow: "0 18px 40px rgba(0,0,0,0.35)",
  radius: 4,
};

// ── Simulated Live Data ──────────────────────────────────────
// In production: replace with useBsiApi() hooks → real /api/savant/* endpoints
const BATTING_LEADERS = [
  { rank: 1, name: "Jace LaViolette", team: "Texas A&M", conf: "SEC", woba: ".441", wrc: 187, pa: 142, pctl: 99 },
  { rank: 2, name: "Travis Bazzana", team: "Oregon St", conf: "Pac-12", woba: ".432", wrc: 179, pa: 156, pctl: 98 },
  { rank: 3, name: "Charlie Condon", team: "Georgia", conf: "SEC", woba: ".428", wrc: 175, pa: 138, pctl: 97 },
  { rank: 4, name: "Vance Honeycutt", team: "UNC", conf: "ACC", woba: ".415", wrc: 168, pa: 151, pctl: 95 },
  { rank: 5, name: "Braden Montgomery", team: "Texas A&M", conf: "SEC", woba: ".408", wrc: 162, pa: 144, pctl: 93 },
  { rank: 6, name: "Nick Kurtz", team: "Wake Forest", conf: "ACC", woba: ".401", wrc: 158, pa: 139, pctl: 91 },
  { rank: 7, name: "Cade Kurland", team: "Florida St", conf: "ACC", woba: ".396", wrc: 154, pa: 147, pctl: 89 },
  { rank: 8, name: "Seth Stephenson", team: "Vanderbilt", conf: "SEC", woba: ".391", wrc: 151, pa: 133, pctl: 87 },
];

const PITCHING_LEADERS = [
  { rank: 1, name: "Hagen Smith", team: "Arkansas", conf: "SEC", fip: "1.82", era_minus: 48, ip: 62, pctl: 99 },
  { rank: 2, name: "Chase Burns", team: "Wake Forest", conf: "ACC", fip: "2.01", era_minus: 55, ip: 58, pctl: 98 },
  { rank: 3, name: "Jaden Noot", team: "Georgia", conf: "SEC", fip: "2.14", era_minus: 59, ip: 51, pctl: 96 },
  { rank: 4, name: "Tanner Witt", team: "Texas", conf: "SEC", fip: "2.28", era_minus: 63, ip: 55, pctl: 94 },
  { rank: 5, name: "Ryan Prager", team: "TCU", conf: "Big 12", fip: "2.41", era_minus: 67, ip: 49, pctl: 91 },
];

const CONF_STRENGTH = [
  { name: "SEC", idx: 112.4, avgEra: 3.92, avgWoba: ".338" },
  { name: "ACC", idx: 108.7, avgEra: 4.11, avgWoba: ".329" },
  { name: "Big 12", idx: 104.2, avgEra: 4.28, avgWoba: ".325" },
  { name: "Big Ten", idx: 101.8, avgEra: 4.35, avgWoba: ".321" },
  { name: "Pac-12", idx: 100.1, avgEra: 4.41, avgWoba: ".318" },
  { name: "Sun Belt", idx: 96.3, avgEra: 4.58, avgWoba: ".312" },
];

const LEAGUE_ENV = { woba: ".317", avg: ".271", obp: ".361", slg: ".432", era: "5.18", fipConst: "3.12" };

const WRC_DISTRIBUTION = [
  { range: "< 60", count: 42, fill: "#dc2626" },
  { range: "60-80", count: 128, fill: "#ef4444" },
  { range: "80-100", count: 312, fill: T.dust },
  { range: "100-120", count: 245, fill: T.columbia },
  { range: "120-140", count: 89, fill: T.primary },
  { range: "140-160", count: 34, fill: T.primaryLight },
  { range: "160+", count: 12, fill: T.ember },
];

const RADAR_DATA = [
  { metric: "wOBA", texas: 85, sec_avg: 72, d1_avg: 50, fullMark: 100 },
  { metric: "wRC+", texas: 88, sec_avg: 74, d1_avg: 50, fullMark: 100 },
  { metric: "FIP", texas: 78, sec_avg: 70, d1_avg: 50, fullMark: 100 },
  { metric: "K%", texas: 72, sec_avg: 68, d1_avg: 50, fullMark: 100 },
  { metric: "BB%", texas: 65, sec_avg: 62, d1_avg: 50, fullMark: 100 },
  { metric: "SLG", texas: 82, sec_avg: 71, d1_avg: 50, fullMark: 100 },
];

const TREND_DATA = Array.from({ length: 12 }, (_, i) => ({
  week: `W${i + 1}`,
  woba: 0.31 + Math.sin(i * 0.5) * 0.02 + i * 0.003,
  fip: 4.8 - Math.sin(i * 0.4) * 0.3 - i * 0.05,
}));

// ── Percentile color ─────────────────────────────────────────
function pctlColor(p) {
  if (p >= 95) return T.ember;
  if (p >= 80) return T.primary;
  if (p >= 60) return T.columbia;
  if (p >= 40) return T.dust;
  return "#6b7280";
}

function PctlDot({ value }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      width: 28, height: 28, borderRadius: "50%",
      background: pctlColor(value), color: "#fff",
      fontSize: 10, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace",
    }}>{value}</span>
  );
}

// ── Reusable Components ──────────────────────────────────────
function HeritageStamp({ children, style }) {
  return (
    <span style={{
      fontFamily: "'Oswald', sans-serif", textTransform: "uppercase",
      letterSpacing: "0.08em", color: T.primary, fontSize: 11,
      fontWeight: 600, ...style,
    }}>{children}</span>
  );
}

function HeritageCard({ children, style, className = "" }) {
  return (
    <div className={className} style={{
      background: T.dugout, border: `1px solid ${T.border}`,
      borderRadius: T.radius, boxShadow: T.shadow, position: "relative",
      overflow: "hidden", ...style,
    }}>{children}</div>
  );
}

function MetricKPI({ label, value, sub, accent = false }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: 22, fontWeight: 700,
        color: accent ? T.primary : T.bone, lineHeight: 1, letterSpacing: "-0.02em",
      }}>{value}</div>
      <div style={{
        fontFamily: "'Oswald', sans-serif", fontSize: 9, textTransform: "uppercase",
        letterSpacing: "0.12em", color: T.dust, marginTop: 4,
      }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: "rgba(196,184,165,0.5)", marginTop: 2, fontFamily: "'JetBrains Mono', monospace" }}>{sub}</div>}
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: T.pressBox, border: `1px solid ${T.border}`,
      borderRadius: 2, padding: "8px 12px", fontSize: 11,
      fontFamily: "'JetBrains Mono', monospace", color: T.bone,
    }}>
      <div style={{ marginBottom: 4, color: T.dust, fontSize: 10 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 8, height: 8, borderRadius: 1, background: p.color }} />
          <span style={{ color: T.dust }}>{p.name}:</span>
          <span style={{ fontWeight: 600 }}>{typeof p.value === "number" ? p.value.toFixed(3) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Nav Item ─────────────────────────────────────────────────
function NavItem({ icon, label, active, href = "#", external }) {
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener" : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "7px 12px",
        borderRadius: 2, fontSize: 13, cursor: "pointer", position: "relative",
        color: active ? T.primaryLight : T.dust, textDecoration: "none",
        background: active ? "rgba(191,87,0,0.12)" : "transparent",
        transition: "all 0.15s",
      }}>
      {active && <div style={{ position: "absolute", left: 0, top: 4, bottom: 4, width: 2, borderRadius: 1, background: T.primary }} />}
      <span style={{ width: 18, textAlign: "center", fontFamily: "monospace", fontSize: 14 }}>{icon}</span>
      <span style={{ fontFamily: "'Oswald', sans-serif", letterSpacing: "0.02em" }}>{label}</span>
      {external && <span style={{ fontSize: 9, opacity: 0.4 }}>↗</span>}
    </a>
  );
}

function NavSection({ title, children }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{
        padding: "12px 12px 6px", fontSize: 9, color: "rgba(196,184,165,0.5)",
        textTransform: "uppercase", letterSpacing: "0.15em",
        fontFamily: "'JetBrains Mono', monospace",
      }}>{title}</div>
      {children}
    </div>
  );
}

// ── Sidebar ──────────────────────────────────────────────────
function Sidebar() {
  return (
    <aside style={{
      width: 220, background: T.surface, borderRight: `1px solid ${T.borderSubtle}`,
      display: "flex", flexDirection: "column", flexShrink: 0, height: "100vh",
      position: "sticky", top: 0,
    }}>
      {/* Logo */}
      <div style={{
        height: 56, display: "flex", alignItems: "center", gap: 10,
        padding: "0 16px", borderBottom: `1px solid ${T.borderSubtle}`,
      }}>
        <span style={{
          fontSize: 22, fontWeight: 800, color: T.primary,
          fontFamily: "'Bebas Neue', sans-serif",
          textShadow: "0 0 20px rgba(191,87,0,0.3)",
        }}>B</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Oswald', sans-serif", color: T.bone }}>BSI Labs</div>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(196,184,165,0.5)", fontFamily: "'JetBrains Mono', monospace" }}>Sabermetrics</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, paddingTop: 4, overflowY: "auto" }}>
        <NavSection title="Live">
          <NavItem icon="◈" label="Dashboard" active />
          <NavItem icon="⚾" label="Games" />
          <NavItem icon="▲" label="Rankings" />
        </NavSection>
        <div style={{ margin: "0 12px", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
        <NavSection title="Analyze">
          <NavItem icon="◆" label="Leaderboards" />
          <NavItem icon="⇔" label="Head to Head" />
          <NavItem icon="$" label="NIL Explorer" />
        </NavSection>
        <div style={{ margin: "0 12px", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
        <NavSection title="Context">
          <NavItem icon="≡" label="Standings" />
          <NavItem icon="⬡" label="Conferences" />
          <NavItem icon="⌂" label="Park Factors" />
          <NavItem icon="◉" label="Bubble Watch" />
        </NavSection>
        <div style={{ margin: "0 12px", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
        <NavSection title="Labs">
          <NavItem icon="◇" label="Visuals" />
          <NavItem icon="◎" label="Radar Lab" />
          <NavItem icon="⬢" label="Athletic Analysis" />
          <NavItem icon="¶" label="Glossary" />
        </NavSection>
        <div style={{ margin: "0 12px", height: 1, background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)" }} />
        <NavSection title="BSI Main">
          <NavItem icon="◈" label="Live Scores" external href="https://blazesportsintel.com/scores" />
          <NavItem icon="⚾" label="College Baseball" external href="https://blazesportsintel.com/college-baseball" />
          <NavItem icon="$" label="Pricing" external href="https://blazesportsintel.com/pricing" />
        </NavSection>
      </nav>

      {/* Footer */}
      <div style={{
        padding: "10px 16px", borderTop: `1px solid ${T.borderSubtle}`,
        fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase",
        color: "rgba(196,184,165,0.4)", fontFamily: "'JetBrains Mono', monospace",
      }}>
        blazesportsintel.com
      </div>
    </aside>
  );
}

// ── Header ───────────────────────────────────────────────────
function Header() {
  return (
    <header style={{
      height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px", borderBottom: `1px solid ${T.borderSubtle}`,
      background: "rgba(6,6,16,0.85)", backdropFilter: "blur(16px)",
      position: "sticky", top: 0, zIndex: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ fontFamily: "'Oswald', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: T.bone }}>
          NCAA Baseball Analytics
        </span>
        <span style={{ width: 1, height: 16, background: T.borderSubtle }} />
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: T.dust, letterSpacing: "0.12em", textTransform: "uppercase" }}>
          Dashboard
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button style={{
          display: "flex", alignItems: "center", gap: 6, padding: "5px 10px",
          borderRadius: 2, fontSize: 11, color: T.dust, cursor: "pointer",
          background: "rgba(255,255,255,0.04)", border: `1px solid rgba(255,255,255,0.06)`,
          fontFamily: "'JetBrains Mono', monospace",
        }}>
          <span>⌕</span> Search <kbd style={{ fontSize: 9, padding: "1px 4px", background: "rgba(255,255,255,0.06)", borderRadius: 2, marginLeft: 4 }}>⌘K</kbd>
        </button>
        <span style={{ width: 1, height: 16, background: T.borderSubtle }} />
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", boxShadow: "0 0 8px rgba(34,197,94,0.5)" }} />
          <span style={{ fontSize: 10, color: T.dust, fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.12em", textTransform: "uppercase" }}>Live</span>
        </span>
      </div>
    </header>
  );
}

// ── Leaderboard Table ────────────────────────────────────────
function LeaderTable({ title, data, columns, metricKey }) {
  return (
    <HeritageCard>
      <div style={{
        padding: "12px 16px", borderBottom: `1px solid rgba(255,255,255,0.04)`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <HeritageStamp>{title}</HeritageStamp>
        <span style={{ fontSize: 9, color: "rgba(196,184,165,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
          Top {data.length} · Min 25 PA
        </span>
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
          <thead>
            <tr style={{ background: T.pressBox }}>
              <th style={{ ...thStyle, width: 32, textAlign: "center" }}>#</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Player</th>
              <th style={{ ...thStyle, textAlign: "left" }}>Team</th>
              {columns.map(c => (
                <th key={c.key} style={{ ...thStyle, textAlign: "right" }}>{c.label}</th>
              ))}
              <th style={{ ...thStyle, width: 40, textAlign: "center" }}>Pctl</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i} style={{
                borderBottom: `1px solid rgba(255,255,255,0.03)`,
                background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
                transition: "background 0.1s",
              }}
                onMouseEnter={e => e.currentTarget.style.background = "rgba(191,87,0,0.04)"}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)"}
              >
                <td style={{ ...tdStyle, textAlign: "center", color: T.dust }}>{row.rank}</td>
                <td style={{ ...tdStyle, fontWeight: 600, color: T.bone }}>{row.name}</td>
                <td style={{ ...tdStyle, color: T.dust }}>
                  {row.team} <span style={{ fontSize: 9, color: "rgba(196,184,165,0.4)" }}>{row.conf}</span>
                </td>
                {columns.map(c => (
                  <td key={c.key} style={{
                    ...tdStyle, textAlign: "right", fontFamily: "'JetBrains Mono', monospace",
                    color: c.accent ? T.columbia : T.bone, fontWeight: c.accent ? 700 : 400,
                  }}>{row[c.key]}</td>
                ))}
                <td style={{ ...tdStyle, textAlign: "center" }}><PctlDot value={row.pctl} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{
        padding: "10px 16px", borderTop: `1px solid rgba(255,255,255,0.03)`,
        display: "flex", justifyContent: "center",
      }}>
        <button style={{
          fontSize: 10, fontFamily: "'Oswald', sans-serif", textTransform: "uppercase",
          letterSpacing: "0.1em", color: T.primary, background: "none", border: "none",
          cursor: "pointer", padding: "4px 12px",
        }}>View Full Leaderboard →</button>
      </div>
    </HeritageCard>
  );
}

const thStyle = {
  padding: "8px 12px", fontFamily: "'Oswald', sans-serif", fontSize: 10,
  textTransform: "uppercase", letterSpacing: "0.08em", color: T.dust,
  fontWeight: 500, whiteSpace: "nowrap",
};

const tdStyle = {
  padding: "8px 12px", whiteSpace: "nowrap", fontSize: 12,
};

// ── Main App ─────────────────────────────────────────────────
export default function BSILabsRedesign() {
  const [activeTab, setActiveTab] = useState("batting");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{
      display: "flex", minHeight: "100vh", background: T.surface, color: T.bone,
      fontFamily: "'Cormorant Garamond', Georgia, serif",
    }}>
      {/* Google Fonts stand-in */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@400;500;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(191,87,0,0.2); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(191,87,0,0.4); }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-d1 { animation: fadeUp 0.5s ease 0.1s forwards; opacity: 0; }
        .fade-up-d2 { animation: fadeUp 0.5s ease 0.2s forwards; opacity: 0; }
        .fade-up-d3 { animation: fadeUp 0.5s ease 0.3s forwards; opacity: 0; }
        .fade-up-d4 { animation: fadeUp 0.5s ease 0.4s forwards; opacity: 0; }
      `}</style>

      <Sidebar />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <Header />

        <main style={{ flex: 1, overflowY: "auto", padding: "24px 32px 48px" }}>
          {/* ── Hero / Data Coverage Strip ── */}
          <div className="fade-up" style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 8 }}>
              <h1 style={{
                fontFamily: "'Bebas Neue', sans-serif", fontSize: 36,
                letterSpacing: "0.02em", color: T.bone, lineHeight: 1,
              }}>
                College Baseball <span style={{ color: T.primary }}>Savant</span>
              </h1>
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
                color: "rgba(196,184,165,0.5)", letterSpacing: "0.05em",
              }}>2026 D1 Season</span>
            </div>
            <p style={{ color: T.dust, fontSize: 14, maxWidth: 600, lineHeight: 1.5, fontStyle: "italic" }}>
              Park-adjusted wOBA, wRC+, FIP, conference strength — for every D1 program.
              The metrics MLB Savant tracks, applied to the college game.
            </p>
          </div>

          {/* ── Trust Strip ── */}
          <div className="fade-up-d1" style={{
            display: "flex", alignItems: "center", gap: 16, marginBottom: 24,
            padding: "8px 16px", borderLeft: `2px solid rgba(191,87,0,0.3)`,
            background: "rgba(22,22,22,0.5)",
          }}>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.dust }}>
              <span style={{ color: T.primary }}>22</span> conferences tracked
            </span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.dust }}>
              ESPN + Highlightly Pro
            </span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: T.dust }}>
              Recomputed every <span style={{ color: T.columbia }}>6h</span>
            </span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(196,184,165,0.4)" }}>
              Last computed: Mar 26, 11:42 AM CT
            </span>
          </div>

          {/* ── KPI Cards (League Environment) ── */}
          <div className="fade-up-d1" style={{
            display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 12, marginBottom: 28,
          }}>
            {[
              { label: "Lg wOBA", value: LEAGUE_ENV.woba },
              { label: "Lg AVG", value: LEAGUE_ENV.avg },
              { label: "Lg OBP", value: LEAGUE_ENV.obp },
              { label: "Lg SLG", value: LEAGUE_ENV.slg },
              { label: "Lg ERA", value: LEAGUE_ENV.era },
              { label: "FIP Const", value: LEAGUE_ENV.fipConst },
            ].map((kpi, i) => (
              <HeritageCard key={i} style={{ padding: "14px 12px", textAlign: "center" }}>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700,
                  color: T.bone, lineHeight: 1, marginBottom: 4,
                }}>{kpi.value}</div>
                <div style={{
                  fontFamily: "'Oswald', sans-serif", fontSize: 9, textTransform: "uppercase",
                  letterSpacing: "0.12em", color: "rgba(196,184,165,0.5)",
                }}>{kpi.label}</div>
              </HeritageCard>
            ))}
          </div>

          {/* ── Spotlight Cards ── */}
          <div className="fade-up-d2" style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 28,
          }}>
            {[
              { abbr: "wOBA", label: "Weighted On-Base Average", value: ".441", name: "Jace LaViolette", team: "Texas A&M", pctl: 99, color: T.ember, tab: "batting" },
              { abbr: "wRC+", label: "Weighted Runs Created+", value: "187", name: "Jace LaViolette", team: "Texas A&M", pctl: 99, color: T.ember, tab: "batting" },
              { abbr: "FIP", label: "Fielding Independent Pitching", value: "1.82", name: "Hagen Smith", team: "Arkansas", pctl: 99, color: T.ember, tab: "pitching" },
              { abbr: "ERA-", label: "ERA Minus", value: "48", name: "Hagen Smith", team: "Arkansas", pctl: 99, color: T.ember, tab: "pitching" },
            ].map((spot, i) => (
              <HeritageCard key={i} style={{
                padding: 16, borderLeft: `2px solid ${spot.color}`,
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: spot.color, letterSpacing: "0.05em" }}>{spot.abbr}</span>
                  <span style={{ fontSize: 9, fontFamily: "'JetBrains Mono', monospace", color: "rgba(196,184,165,0.4)", textTransform: "uppercase" }}>{spot.tab}</span>
                </div>
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 28, fontWeight: 700,
                  color: spot.color, lineHeight: 1, marginBottom: 6,
                }}>{spot.value}</div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: T.bone }}>{spot.name}</span>
                  <span style={{ fontSize: 10, color: T.dust, marginLeft: 6 }}>{spot.team}</span>
                </div>
                <div style={{ fontSize: 10, color: "rgba(196,184,165,0.4)", lineHeight: 1.4 }}>{spot.label}</div>
              </HeritageCard>
            ))}
          </div>

          {/* ── Tab Navigation ── */}
          <div className="fade-up-d2" style={{
            display: "flex", gap: 0, borderBottom: `1px solid rgba(255,255,255,0.06)`,
            marginBottom: 20,
          }}>
            {["batting", "pitching", "park-factors", "conference"].map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)} style={{
                padding: "10px 20px", fontSize: 12, fontFamily: "'Oswald', sans-serif",
                textTransform: "uppercase", letterSpacing: "0.06em", cursor: "pointer",
                background: "none", border: "none", borderBottom: `2px solid ${activeTab === tab ? T.primary : "transparent"}`,
                color: activeTab === tab ? T.primary : T.dust,
                transition: "all 0.15s",
              }}>{tab.replace("-", " ")}</button>
            ))}
          </div>

          {/* ── Tab Content ── */}
          <div className="fade-up-d3">
            {activeTab === "batting" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                <LeaderTable
                  title="Batting Leaders — Advanced"
                  data={BATTING_LEADERS}
                  columns={[
                    { key: "woba", label: "wOBA", accent: true },
                    { key: "wrc", label: "wRC+" },
                    { key: "pa", label: "PA" },
                  ]}
                />
              </div>
            )}
            {activeTab === "pitching" && (
              <LeaderTable
                title="Pitching Leaders — Advanced"
                data={PITCHING_LEADERS}
                columns={[
                  { key: "fip", label: "FIP", accent: true },
                  { key: "era_minus", label: "ERA-" },
                  { key: "ip", label: "IP" },
                ]}
              />
            )}
            {activeTab === "park-factors" && (
              <HeritageCard style={{ padding: 24 }}>
                <HeritageStamp>Park Factor Index</HeritageStamp>
                <p style={{ color: T.dust, fontSize: 12, marginTop: 8, marginBottom: 16 }}>
                  Runs-based park factors normalized to 100. Above 100 = hitter-friendly. Below 100 = pitcher-friendly.
                </p>
                <div style={{ width: "100%", height: 280 }}>
                  <ResponsiveContainer>
                    <BarChart data={[
                      { park: "Dan Law Field", team: "Texas Tech", factor: 118 },
                      { park: "Dudy Noble", team: "Miss State", factor: 114 },
                      { park: "Baum-Walker", team: "Arkansas", factor: 111 },
                      { park: "UFCU Disch-Falk", team: "Texas", factor: 108 },
                      { park: "Swayze Field", team: "Ole Miss", factor: 105 },
                      { park: "— D1 Average —", team: "", factor: 100 },
                      { park: "Lindsey Nelson", team: "Tennessee", factor: 94 },
                      { park: "Foley Field", team: "Georgia", factor: 91 },
                      { park: "Alex Box", team: "LSU", factor: 88 },
                    ]} layout="vertical" margin={{ left: 120, right: 20, top: 8, bottom: 8 }}>
                      <XAxis type="number" domain={[80, 125]} tick={{ fill: T.dust, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                      <YAxis type="category" dataKey="park" tick={{ fill: T.dust, fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} width={120} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="factor" radius={[0, 2, 2, 0]} fill={T.primary}>
                        {[118, 114, 111, 108, 105, 100, 94, 91, 88].map((v, i) => (
                          <rect key={i} fill={v >= 100 ? T.primary : T.columbia} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </HeritageCard>
            )}
            {activeTab === "conference" && (
              <HeritageCard style={{ padding: 24 }}>
                <HeritageStamp>Conference Strength Index</HeritageStamp>
                <p style={{ color: T.dust, fontSize: 12, marginTop: 8, marginBottom: 16 }}>
                  Composite index based on avg ERA, wOBA, and inter-conference record. 100 = D1 average.
                </p>
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: T.pressBox }}>
                        <th style={thStyle}>Conference</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Strength Idx</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Avg ERA</th>
                        <th style={{ ...thStyle, textAlign: "right" }}>Avg wOBA</th>
                        <th style={{ ...thStyle, textAlign: "center" }}>Tier</th>
                      </tr>
                    </thead>
                    <tbody>
                      {CONF_STRENGTH.map((c, i) => (
                        <tr key={i} style={{ borderBottom: `1px solid rgba(255,255,255,0.03)` }}>
                          <td style={{ ...tdStyle, fontWeight: 600, color: T.bone }}>{c.name}</td>
                          <td style={{ ...tdStyle, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: c.idx >= 105 ? T.ember : c.idx >= 100 ? T.columbia : T.dust, fontWeight: 700 }}>{c.idx}</td>
                          <td style={{ ...tdStyle, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: T.bone }}>{c.avgEra}</td>
                          <td style={{ ...tdStyle, textAlign: "right", fontFamily: "'JetBrains Mono', monospace", color: T.bone }}>{c.avgWoba}</td>
                          <td style={{ ...tdStyle, textAlign: "center" }}>
                            <span style={{
                              display: "inline-block", padding: "2px 8px", borderRadius: 2, fontSize: 9,
                              fontFamily: "'Oswald', sans-serif", textTransform: "uppercase", letterSpacing: "0.08em",
                              background: c.idx >= 105 ? "rgba(191,87,0,0.15)" : "rgba(75,156,211,0.1)",
                              color: c.idx >= 105 ? T.primary : T.columbia,
                              border: `1px solid ${c.idx >= 105 ? "rgba(191,87,0,0.3)" : "rgba(75,156,211,0.2)"}`,
                            }}>{c.idx >= 105 ? "Power" : c.idx >= 100 ? "Strong" : "Mid"}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </HeritageCard>
            )}
          </div>

          {/* ── Bottom Row: Charts ── */}
          <div className="fade-up-d4" style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 28,
          }}>
            {/* wRC+ Distribution */}
            <HeritageCard style={{ padding: 20 }}>
              <HeritageStamp>wRC+ Distribution — D1</HeritageStamp>
              <p style={{ fontSize: 10, color: "rgba(196,184,165,0.4)", marginTop: 4, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                862 qualified batters · Min 25 PA
              </p>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <BarChart data={WRC_DISTRIBUTION} margin={{ left: -10, right: 0, top: 0, bottom: 0 }}>
                    <XAxis dataKey="range" tick={{ fill: T.dust, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.dust, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {WRC_DISTRIBUTION.map((entry, i) => (
                        <rect key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </HeritageCard>

            {/* Radar: Team Profile */}
            <HeritageCard style={{ padding: 20 }}>
              <HeritageStamp>Team Radar — Texas vs SEC Avg</HeritageStamp>
              <p style={{ fontSize: 10, color: "rgba(196,184,165,0.4)", marginTop: 4, marginBottom: 12, fontFamily: "'JetBrains Mono', monospace" }}>
                Percentile rank across 6 metrics
              </p>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius="70%">
                    <PolarGrid stroke="rgba(255,255,255,0.06)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: T.dust, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} />
                    <PolarRadiusAxis tick={false} axisLine={false} domain={[0, 100]} />
                    <Radar name="Texas" dataKey="texas" stroke={T.primary} fill={T.primary} fillOpacity={0.2} strokeWidth={2} />
                    <Radar name="SEC Avg" dataKey="sec_avg" stroke={T.columbia} fill={T.columbia} fillOpacity={0.08} strokeWidth={1} strokeDasharray="4 4" />
                    <Radar name="D1 Avg" dataKey="d1_avg" stroke="rgba(196,184,165,0.3)" fill="none" strokeWidth={1} strokeDasharray="2 4" />
                    <Legend wrapperStyle={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </HeritageCard>
          </div>

          {/* ── Season Trend ── */}
          <div className="fade-up-d4" style={{ marginTop: 16 }}>
            <HeritageCard style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <HeritageStamp>D1 Run Environment — Season Trend</HeritageStamp>
                <span style={{ fontSize: 9, color: "rgba(196,184,165,0.4)", fontFamily: "'JetBrains Mono', monospace" }}>
                  Week 1–12 · 2026
                </span>
              </div>
              <div style={{ width: "100%", height: 180 }}>
                <ResponsiveContainer>
                  <AreaChart data={TREND_DATA} margin={{ left: -10, right: 0, top: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="wobaGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={T.primary} stopOpacity={0.3} />
                        <stop offset="100%" stopColor={T.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="week" tick={{ fill: T.dust, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: T.dust, fontSize: 9, fontFamily: "'JetBrains Mono', monospace" }} axisLine={false} tickLine={false} domain={[0.3, 0.36]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="woba" name="League wOBA" stroke={T.primary} fill="url(#wobaGrad)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </HeritageCard>
          </div>

          {/* ── Footer Attribution ── */}
          <div className="fade-up-d4" style={{
            marginTop: 32, paddingTop: 16, borderTop: `1px solid rgba(255,255,255,0.04)`,
            display: "flex", justifyContent: "center", alignItems: "center", gap: 16,
          }}>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(196,184,165,0.3)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Source: BSI Savant
            </span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(191,87,0,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}>
              Methodology
            </span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(191,87,0,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}>
              Glossary
            </span>
            <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
            <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono', monospace", color: "rgba(191,87,0,0.4)", textTransform: "uppercase", letterSpacing: "0.12em", cursor: "pointer" }}>
              Conference Index
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
