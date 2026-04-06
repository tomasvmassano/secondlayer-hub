"use client";

const LOGO_B64 = "data:image/png;base64,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";

const TOOLS = [
  {
    name: "Offer Builder",
    desc: "AI-powered creator research, Grand Slam Offer design, blind spot audit, and revenue projections.",
    url: "/offer-builder",
    status: "live",
    span: 2,
  },
  {
    name: "DM Writer",
    desc: "Full 5-touchpoint outreach sequence. DMs and emails based on real creator research.",
    url: "/dm-writer",
    status: "live",
    span: 1,
  },
  {
    name: "Past Offers",
    desc: "View and share all generated offer analyses.",
    url: "/dashboard",
    status: "live",
    span: 1,
  },
  {
    name: "Creator Pitch Page",
    desc: "Shareable branded pitch page per creator with revenue projections.",
    url: null,
    status: "planned",
    span: 1,
  },
  {
    name: "Launch Blueprint",
    desc: "Week-by-week build plan. Tasks, deliverables, timeline to launch.",
    url: null,
    status: "planned",
    span: 1,
  },
  {
    name: "Sales Page Generator",
    desc: "Generate sales page copy from the offer. Ready for Webflow.",
    url: null,
    status: "planned",
    span: 1,
  },
  {
    name: "Content Calendar",
    desc: "30 days of content ideas based on Core Four lead gen.",
    url: null,
    status: "planned",
    span: 1,
  },
  {
    name: "Email Sequences",
    desc: "Full nurture sequences. Welcome, value, pitch, close.",
    url: null,
    status: "planned",
    span: 1,
  },
  {
    name: "Creator Dashboard",
    desc: "Post-launch tracking. Performance vs projections.",
    url: null,
    status: "planned",
    span: 1,
  },
];

function ToolCard({ tool }) {
  const isLive = tool.status === "live";
  const Tag = isLive ? "a" : "div";
  const props = isLive ? { href: tool.url } : {};

  return (
    <Tag {...props}
      style={{
        gridColumn: tool.span === 2 ? "span 2" : "span 1",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: tool.span === 2 ? "36px 32px" : "28px 24px",
        borderRadius: 16,
        background: isLive ? "#141414" : "#0f0f0f",
        border: "1px solid rgba(255,255,255,0.04)",
        textDecoration: "none", color: "inherit",
        cursor: isLive ? "pointer" : "default",
        transition: "border-color 0.2s ease, background 0.2s ease",
        minHeight: tool.span === 2 ? 180 : 140,
        position: "relative",
        overflow: "hidden",
        opacity: isLive ? 1 : 0.5,
      }}
      onMouseEnter={isLive ? e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; e.currentTarget.style.background = "#1a1a1a"; } : undefined}
      onMouseLeave={isLive ? e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.04)"; e.currentTarget.style.background = "#141414"; } : undefined}
    >
      {/* Subtle gradient overlay */}
      {isLive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 60%)", pointerEvents: "none" }} />}

      <div style={{ position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: tool.span === 2 ? 16 : 12 }}>
          <h3 style={{
            fontSize: tool.span === 2 ? 24 : 18,
            fontWeight: 600, margin: 0, color: "#f5f5f5",
            letterSpacing: "-0.02em",
          }}>
            {tool.name}
          </h3>
          {isLive && (
            <span style={{
              fontSize: 9, fontWeight: 500, letterSpacing: "0.06em",
              padding: "3px 8px", borderRadius: 6,
              background: "rgba(34,197,94,0.1)", color: "#22c55e",
            }}>LIVE</span>
          )}
          {!isLive && (
            <span style={{
              fontSize: 9, fontWeight: 500, letterSpacing: "0.06em",
              padding: "3px 8px", borderRadius: 6,
              background: "rgba(255,255,255,0.04)", color: "#555",
            }}>SOON</span>
          )}
        </div>
        <p style={{
          fontSize: tool.span === 2 ? 15 : 13,
          color: "#888", margin: 0, lineHeight: 1.6,
          maxWidth: tool.span === 2 ? 420 : 300,
        }}>
          {tool.desc}
        </p>
      </div>

      {isLive && (
        <div style={{ position: "relative", marginTop: 20 }}>
          <span style={{
            fontSize: 13, fontWeight: 500, color: "#f5f5f5",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}>
            Open
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17l10-10M7 7h10v10"/></svg>
          </span>
        </div>
      )}
    </Tag>
  );
}

export default function Hub() {
  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet" />

      {/* Nav */}
      <nav style={{
        padding: "20px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}>
        <img src={LOGO_B64} alt="Second Layer" style={{ height: 16, opacity: 0.8 }} />
        <a href="/dashboard" style={{
          fontSize: 13, fontWeight: 500, color: "#555",
          textDecoration: "none", transition: "color 0.15s",
        }}
          onMouseEnter={e => e.currentTarget.style.color = "#888"}
          onMouseLeave={e => e.currentTarget.style.color = "#555"}
        >
          Past Offers
        </a>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "64px 40px 100px" }}>

        {/* Hero */}
        <div style={{ marginBottom: 64 }}>
          <p style={{ fontSize: 11, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", color: "#555", margin: "0 0 16px" }}>
            Operations Hub
          </p>
          <h1 style={{
            fontSize: 52, fontWeight: 600, margin: "0 0 16px",
            letterSpacing: "-0.03em", lineHeight: 1.1, color: "#f5f5f5",
          }}>
            Research. Pitch.<br />
            <span style={{ color: "#7A0E18" }}>Close.</span>
          </h1>
          <p style={{ fontSize: 16, color: "#666", margin: 0, maxWidth: 440, lineHeight: 1.6 }}>
            Every tool your team needs to find creators, build offers, and sign partnerships.
          </p>
        </div>

        {/* Bento Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
        }}>
          {TOOLS.map(tool => <ToolCard key={tool.name} tool={tool} />)}
        </div>

        {/* Footer */}
        <div style={{ marginTop: 80, textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#333", margin: 0 }}>Second Layer HQ</p>
        </div>
      </div>
    </div>
  );
}
