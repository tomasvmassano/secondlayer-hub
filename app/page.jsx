"use client";

const LOGO_B64 = "data:image/png;base64,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";

const TOOLS = [
  {
    name: "Offer Builder",
    description: "Build Grand Slam Offers using Hormozi frameworks. AI-powered creator research, offer design, blind spot audit, objection playbook, and revenue projections.",
    url: "https://secondlayer-offer-builder.vercel.app",
    status: "live",
    icon: "\u26A1",
  },
  {
    name: "Creator Pitch Page",
    description: "Generate a shareable, branded pitch page for each creator. Shows the opportunity, the offer, revenue projections, and what Second Layer builds.",
    url: null,
    status: "planned",
    icon: "\uD83C\uDFAF",
  },
  {
    name: "Launch Blueprint",
    description: "Week-by-week build plan after signing a creator. Tasks assigned to Second Layer vs Creator, deliverables checklist, timeline to launch.",
    url: null,
    status: "planned",
    icon: "\uD83D\uDCC5",
  },
  {
    name: "Sales Page Generator",
    description: "Generate sales page copy from the Grand Slam Offer — headline, value stack, FAQ, CTA. Ready to paste into Webflow.",
    url: null,
    status: "planned",
    icon: "\uD83D\uDCDD",
  },
  {
    name: "Content Calendar",
    description: "30 days of content ideas for the creator based on Core Four lead gen. Hooks, formats, CTAs that funnel to the offer.",
    url: null,
    status: "planned",
    icon: "\uD83D\uDCC6",
  },
  {
    name: "Email Sequence Builder",
    description: "Generate full nurture sequences — welcome, value, pitch, cart close. Based on offer psychology and audience analysis.",
    url: null,
    status: "planned",
    icon: "\u2709\uFE0F",
  },
  {
    name: "Creator Dashboard",
    description: "Post-launch tracking. Real performance vs projections — sign-ups, revenue, churn. Flags when adjustments are needed.",
    url: null,
    status: "planned",
    icon: "\uD83D\uDCCA",
  },
];

const STATUS_STYLES = {
  live: { bg: "#22c55e14", color: "#22c55e", border: "#22c55e33", label: "LIVE" },
  planned: { bg: "#eab30814", color: "#eab308", border: "#eab30833", label: "PLANNED" },
  building: { bg: "#7A0E1814", color: "#7A0E18", border: "#7A0E1833", label: "BUILDING" },
};

export default function Hub() {
  const live = TOOLS.filter(t => t.status === "live");
  const planned = TOOLS.filter(t => t.status !== "live");

  return (
    <div style={{ minHeight: "100vh", background: "#010300", color: "#E2E4DF", fontFamily: "'Helvetica Neue',Helvetica,Arial,sans-serif" }}>
      {/* Header */}
      <div style={{ padding: "20px 28px", borderBottom: "1px solid #141210", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <img src={LOGO_B64} alt="Second Layer" style={{ height: 16, opacity: 0.85 }} />
          <span style={{ color: "#2a2720", fontSize: 14 }}>|</span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#4a4840" }}>HQ</span>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Hero */}
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontSize: 32, fontWeight: 300, margin: "0 0 8px", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            Second <span style={{ color: "#7A0E18", fontWeight: 600 }}>Layer</span> HQ
          </h1>
          <p style={{ fontSize: 14, color: "#4a4840", margin: 0, maxWidth: 480 }}>
            Operations hub. Every tool your team needs to research, pitch, sign, and launch creators.
          </p>
        </div>

        {/* Live tools */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#22c55e", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Active Tools</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {live.map(tool => (
              <a key={tool.name} href={tool.url} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "block", padding: "24px 22px", borderRadius: 6,
                  background: "#080604", border: "1px solid #1e1b17",
                  textDecoration: "none", color: "inherit",
                  transition: "border-color 0.15s, background 0.15s",
                  cursor: "pointer",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#7A0E18"; e.currentTarget.style.background = "#0a0806"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1b17"; e.currentTarget.style.background = "#080604"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ fontSize: 22 }}>{tool.icon}</span>
                  <span style={{
                    fontSize: 8, fontWeight: 700, letterSpacing: "0.08em",
                    padding: "2px 8px", borderRadius: 999,
                    background: STATUS_STYLES[tool.status].bg,
                    color: STATUS_STYLES[tool.status].color,
                    border: `1px solid ${STATUS_STYLES[tool.status].border}`,
                  }}>{STATUS_STYLES[tool.status].label}</span>
                </div>
                <h3 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 6px", color: "#E2E4DF" }}>{tool.name}</h3>
                <p style={{ fontSize: 12, color: "#6b6860", margin: 0, lineHeight: 1.5 }}>{tool.description}</p>
              </a>
            ))}
          </div>
        </div>

        {/* Planned tools */}
        <div>
          <div style={{ fontSize: 9, fontWeight: 600, color: "#eab308", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Coming Soon</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            {planned.map(tool => (
              <div key={tool.name} style={{
                padding: "20px 18px", borderRadius: 6,
                background: "#060503", border: "1px solid #0f0d0a",
                opacity: 0.7,
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 18 }}>{tool.icon}</span>
                  <span style={{
                    fontSize: 7, fontWeight: 700, letterSpacing: "0.08em",
                    padding: "2px 6px", borderRadius: 999,
                    background: STATUS_STYLES[tool.status].bg,
                    color: STATUS_STYLES[tool.status].color,
                    border: `1px solid ${STATUS_STYLES[tool.status].border}`,
                  }}>{STATUS_STYLES[tool.status].label}</span>
                </div>
                <h3 style={{ fontSize: 13, fontWeight: 600, margin: "0 0 4px", color: "#9a9890" }}>{tool.name}</h3>
                <p style={{ fontSize: 11, color: "#4a4840", margin: 0, lineHeight: 1.5 }}>{tool.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 20, borderTop: "1px solid #0f0d0a", textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "#2a2720", margin: 0 }}>Second Layer HQ &middot; Internal Operations</p>
        </div>
      </div>
    </div>
  );
}
