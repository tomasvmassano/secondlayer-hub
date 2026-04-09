"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

const LOGO_B64 = "data:image/png;base64,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";

const MEETING_QUESTIONS = [
  { key: "brandDealPct", label: "Que percentagem vem de brand deals vs produtos próprios?" },
  { key: "previousSales", label: "Já vendeste algo diretamente? O quê, a que preço, quantos?" },
  { key: "followerQuestions", label: "Que perguntas os teus seguidores te fazem mais?" },
  { key: "topContent", label: "Que tipo de conteúdo costuma ter mais alcance? E mais engagement?" },
  { key: "dmTopics", label: "Sobre o que te mandam DMs?" },
  { key: "audienceProblem", label: "Se pudesses resolver um problema da tua audiência, qual seria?" },
  { key: "emailList", label: "Tens lista de email? Quantos subscritores?" },
  { key: "storyViewRate", label: "Qual é a média de views nos stories?" },
  { key: "exclusivity", label: "Tens algum contrato existente ou exclusividade?" },
];

function formatFollowers(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

const metricCardStyle = {
  padding: "12px 16px",
  background: "#141414",
  border: "1px solid rgba(255,255,255,0.04)",
  borderRadius: 8,
  minWidth: 0,
};

const metricLabelStyle = {
  fontSize: 10,
  fontWeight: 600,
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
  marginBottom: 4,
};

const metricValueStyle = {
  fontSize: 16,
  fontWeight: 700,
  color: "#f5f5f5",
};

const sectionTitleStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: "#555",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  margin: "0 0 12px",
};

export default function CreatorProfilePage({ params: paramsPromise }) {
  const router = useRouter();
  const [params, setParams] = useState(null);
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState("");
  const [showResearch, setShowResearch] = useState(false);
  const [editName, setEditName] = useState(false);
  const [tiktokUrl, setTiktokUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [deleting, setDeleting] = useState(false);
  const nameRef = useRef(null);

  // Resolve params promise
  useEffect(() => {
    Promise.resolve(paramsPromise).then(setParams);
  }, [paramsPromise]);

  const fetchCreator = useCallback(async (id) => {
    try {
      const res = await fetch(`/api/creators/${id}`);
      if (!res.ok) throw new Error("Creator não encontrado");
      const data = await res.json();
      setCreator(data);
      setTiktokUrl(data.tiktokUrl || "");
      setYoutubeUrl(data.youtubeUrl || "");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params?.id) fetchCreator(params.id);
  }, [params, fetchCreator]);

  const patchCreator = useCallback(async (updates) => {
    if (!params?.id) return;
    setSaving("A guardar...");
    try {
      const res = await fetch(`/api/creators/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) throw new Error("Erro ao guardar");
      const data = await res.json();
      setCreator(data);
      setSaving("Guardado!");
      setTimeout(() => setSaving(""), 2000);
    } catch {
      setSaving("Erro ao guardar");
      setTimeout(() => setSaving(""), 3000);
    }
  }, [params]);

  const handleDelete = useCallback(async () => {
    if (!params?.id) return;
    if (!window.confirm("Tens a certeza que queres eliminar este creator?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/creators/${params.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao eliminar");
      router.push("/creators");
    } catch {
      setDeleting(false);
      alert("Erro ao eliminar o creator.");
    }
  }, [params, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <p style={{ color: "#555" }}>A carregar...</p>
      </div>
    );
  }

  if (error || !creator) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Inter', sans-serif", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <div style={{ textAlign: "center" }}>
          <p style={{ color: "#ef4444", marginBottom: 16 }}>{error || "Creator não encontrado"}</p>
          <a href="/creators" style={{ color: "#7A0E18", textDecoration: "none", fontSize: 14 }}>Voltar</a>
        </div>
      </div>
    );
  }

  const igData = creator.platforms?.instagram || null;
  const tkData = creator.platforms?.tiktok || null;
  const ytData = creator.platforms?.youtube || null;

  const recentPosts = igData?.recentPosts || [];
  const recentVideos = tkData?.recentVideos || [];

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", color: "#f5f5f5", fontFamily: "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <img src={LOGO_B64} alt="Second Layer" style={{ height: 16, opacity: 0.85 }} />
          </a>
          <span style={{ color: "#333", fontSize: 14 }}>|</span>
          <a href="/creators" style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#555", textDecoration: "none" }}>CRM</a>
          <span style={{ color: "#333", fontSize: 14 }}>/</span>
          <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#888" }}>{creator.name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {saving && <span style={{ fontSize: 11, color: saving.includes("Erro") ? "#ef4444" : "#22c55e" }}>{saving}</span>}
          <a href="/creators" style={{ fontSize: 12, color: "#555", textDecoration: "none" }}>Voltar</a>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px 80px" }}>
        {/* Two Column Layout */}
        <div style={{ display: "flex", gap: 28 }}>
          {/* Left Column - Creator Info */}
          <div style={{ flex: "0 0 60%", maxWidth: "60%" }}>

            {/* Profile Header */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 24 }}>
              {creator.profilePicUrl && (
                <img
                  src={creator.profilePicUrl}
                  alt={creator.name}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid rgba(255,255,255,0.06)",
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Name */}
                <div style={{ marginBottom: 6 }}>
                  {editName ? (
                    <input
                      ref={nameRef}
                      defaultValue={creator.name}
                      autoFocus
                      onBlur={(e) => {
                        const val = e.target.value.trim();
                        if (val && val !== creator.name) patchCreator({ name: val });
                        setEditName(false);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter") e.target.blur(); }}
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        background: "transparent",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 8,
                        color: "#f5f5f5",
                        padding: "4px 8px",
                        outline: "none",
                        fontFamily: "inherit",
                        width: "100%",
                      }}
                    />
                  ) : (
                    <h1
                      onClick={() => setEditName(true)}
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        margin: 0,
                        cursor: "pointer",
                        letterSpacing: "-0.02em",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                      title="Clica para editar"
                    >
                      {creator.name}
                      {creator.isVerified && (
                        <span style={{ fontSize: 14, color: "#3b82f6", fontWeight: 400 }} title="Verificado">&#10003;</span>
                      )}
                      {creator.isBusinessAccount && (
                        <span style={{ fontSize: 10, padding: "2px 6px", background: "rgba(122,14,24,0.15)", border: "1px solid rgba(122,14,24,0.25)", borderRadius: 4, color: "#ccc", fontWeight: 600 }}>Business</span>
                      )}
                    </h1>
                  )}
                </div>

                {/* Badges */}
                {creator.niche && (
                  <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: "#888", padding: "6px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 6 }}>
                      {creator.niche}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ===== INSTAGRAM SECTION ===== */}
            {igData && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={sectionTitleStyle}>
                  Instagram
                  {igData.url && (
                    <a href={igData.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#7A0E18", textDecoration: "none", marginLeft: 8, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                      Ver perfil
                    </a>
                  )}
                </h3>

                {/* Instagram Bio */}
                {(creator.bio || creator.externalUrl) && (
                  <div style={{ marginBottom: 14, padding: "14px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 10 }}>
                    {creator.bio && (
                      <p style={{ fontSize: 13, color: "#bbb", margin: 0, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{creator.bio}</p>
                    )}
                    {(() => {
                      // Extract all URLs from bio text + externalUrl
                      const bioLinks = [];
                      if (creator.externalUrl) bioLinks.push(creator.externalUrl);
                      if (creator.bio) {
                        const urlRegex = /https?:\/\/[^\s,)]+/gi;
                        const found = creator.bio.match(urlRegex) || [];
                        found.forEach(u => { if (!bioLinks.includes(u)) bioLinks.push(u); });
                      }
                      if (bioLinks.length === 0) return null;
                      return (
                        <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Links na Bio</div>
                          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                            {bioLinks.map((link, i) => (
                              <a key={i} href={link.startsWith("http") ? link : "https://" + link} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#7A0E18", textDecoration: "none", wordBreak: "break-all" }}>
                                {link}
                              </a>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 12 }}>
                  {igData.followers > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Followers</div>
                      <div style={metricValueStyle}>{formatFollowers(igData.followers)}</div>
                    </div>
                  )}
                  {igData.following > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Following</div>
                      <div style={metricValueStyle}>{formatFollowers(igData.following)}</div>
                    </div>
                  )}
                  {igData.postCount > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Posts</div>
                      <div style={metricValueStyle}>{formatFollowers(igData.postCount)}</div>
                    </div>
                  )}
                  {igData.avgLikes > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Média Likes</div>
                      <div style={metricValueStyle}>{formatFollowers(igData.avgLikes)}</div>
                    </div>
                  )}
                  {igData.avgComments > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Média Comentários</div>
                      <div style={metricValueStyle}>{formatFollowers(igData.avgComments)}</div>
                    </div>
                  )}
                  {igData.followerFollowingRatio && igData.followerFollowingRatio !== '0' && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Ratio</div>
                      <div style={metricValueStyle}>{typeof igData.followerFollowingRatio === 'number' ? igData.followerFollowingRatio.toFixed(1) : igData.followerFollowingRatio}</div>
                    </div>
                  )}
                  {(igData.engagementRate || creator.engagement) && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Engagement</div>
                      <div style={metricValueStyle}>{igData.engagementRate || creator.engagement}</div>
                    </div>
                  )}
                </div>

                {/* Recent Posts */}
                {recentPosts.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                      Posts Recentes
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {recentPosts.slice(0, 6).map((post, i) => (
                        <div key={i} style={{
                          padding: "10px 14px",
                          background: "#141414",
                          border: "1px solid rgba(255,255,255,0.04)",
                          borderRadius: 8,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}>
                          <div style={{ fontSize: 12, color: "#aaa", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {post.caption ? post.caption.slice(0, 80) : "(sem legenda)"}
                            {post.type && <span style={{ fontSize: 10, color: "#555", marginLeft: 6 }}>[{post.type}]</span>}
                          </div>
                          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: "#888" }}>{formatFollowers(post.likes || 0)} likes</span>
                            <span style={{ fontSize: 11, color: "#666" }}>{formatFollowers(post.comments || 0)} com.</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== TIKTOK SECTION ===== */}
            {tkData && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={sectionTitleStyle}>
                  TikTok
                  {tkData.url && (
                    <a href={tkData.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#7A0E18", textDecoration: "none", marginLeft: 8, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                      Ver perfil
                    </a>
                  )}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 12 }}>
                  {tkData.followers > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Followers</div>
                      <div style={metricValueStyle}>{formatFollowers(tkData.followers)}</div>
                    </div>
                  )}
                  {tkData.following > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Following</div>
                      <div style={metricValueStyle}>{formatFollowers(tkData.following)}</div>
                    </div>
                  )}
                  {tkData.totalLikes > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Total Likes</div>
                      <div style={metricValueStyle}>{formatFollowers(tkData.totalLikes)}</div>
                    </div>
                  )}
                  {tkData.videoCount > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Vídeos</div>
                      <div style={metricValueStyle}>{formatFollowers(tkData.videoCount)}</div>
                    </div>
                  )}
                  {tkData.avgViews > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Média Views</div>
                      <div style={metricValueStyle}>{formatFollowers(tkData.avgViews)}</div>
                    </div>
                  )}
                </div>

                {/* Recent Videos */}
                {recentVideos.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#444", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>
                      Vídeos Recentes
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {recentVideos.slice(0, 5).map((vid, i) => (
                        <div key={i} style={{
                          padding: "10px 14px",
                          background: "#141414",
                          border: "1px solid rgba(255,255,255,0.04)",
                          borderRadius: 8,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 12,
                        }}>
                          <div style={{ fontSize: 12, color: "#aaa", flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {vid.caption ? vid.caption.slice(0, 80) : "(sem legenda)"}
                          </div>
                          <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                            <span style={{ fontSize: 11, color: "#888" }}>{formatFollowers(vid.views || 0)} views</span>
                            <span style={{ fontSize: 11, color: "#888" }}>{formatFollowers(vid.likes || 0)} likes</span>
                            <span style={{ fontSize: 11, color: "#666" }}>{formatFollowers(vid.shares || 0)} shares</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ===== YOUTUBE SECTION ===== */}
            {ytData && (
              <div style={{ marginBottom: 28 }}>
                <h3 style={sectionTitleStyle}>
                  YouTube
                  {ytData.url && (
                    <a href={ytData.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: "#7A0E18", textDecoration: "none", marginLeft: 8, fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                      Ver canal
                    </a>
                  )}
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 12 }}>
                  {ytData.subscribers > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Subscribers</div>
                      <div style={metricValueStyle}>{formatFollowers(ytData.subscribers)}</div>
                    </div>
                  )}
                  {ytData.videoCount > 0 && (
                    <div style={metricCardStyle}>
                      <div style={metricLabelStyle}>Total Videos</div>
                      <div style={metricValueStyle}>{formatFollowers(ytData.videoCount)}</div>
                    </div>
                  )}
                </div>
                {ytData.recentVideos && ytData.recentVideos.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Vídeos Recentes</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {ytData.recentVideos.slice(0, 3).map((vid, i) => (
                        <div key={i} style={{ padding: "10px 14px", background: "#141414", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 8 }}>
                          <div style={{ fontSize: 12, color: "#ccc", marginBottom: 4, lineHeight: 1.4 }}>
                            {vid.url ? (
                              <a href={vid.url} target="_blank" rel="noopener noreferrer" style={{ color: "#ccc", textDecoration: "none" }}>{vid.title}</a>
                            ) : vid.title}
                          </div>
                          <div style={{ display: "flex", gap: 12 }}>
                            <span style={{ fontSize: 11, color: "#888" }}>{formatFollowers(vid.views || 0)} views</span>
                            <span style={{ fontSize: 11, color: "#888" }}>{formatFollowers(vid.likes || 0)} likes</span>
                            <span style={{ fontSize: 11, color: "#666" }}>{formatFollowers(vid.comments || 0)} comments</span>
                            {vid.date && <span style={{ fontSize: 11, color: "#444" }}>{vid.date}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}


            {/* Products */}
            {creator.products && creator.products.length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={sectionTitleStyle}>Produtos Encontrados</h3>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {creator.products.map((p, i) => (
                    <span key={i} style={{
                      fontSize: 12,
                      color: "#f5f5f5",
                      padding: "6px 12px",
                      background: "rgba(122,14,24,0.15)",
                      border: "1px solid rgba(122,14,24,0.25)",
                      borderRadius: 6,
                    }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reputation */}
            {creator.reputation && (
              <div style={{ marginBottom: 24 }}>
                <h3 style={sectionTitleStyle}>Reputação</h3>
                <p style={{ fontSize: 13, color: "#888", margin: 0, lineHeight: 1.6 }}>{creator.reputation}</p>
              </div>
            )}

            {/* Research (collapsible) */}
            {creator.research && (
              <div style={{ marginBottom: 24 }}>
                <button
                  onClick={() => setShowResearch(!showResearch)}
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#555",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    marginBottom: 12,
                    fontFamily: "inherit",
                  }}
                >
                  Pesquisa Completa {showResearch ? "[-]" : "[+]"}
                </button>
                {showResearch && (
                  <div style={{
                    padding: 20,
                    background: "#141414",
                    border: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: 10,
                    fontSize: 12,
                    color: "#888",
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    maxHeight: 500,
                    overflowY: "auto",
                  }}>
                    {creator.research}
                  </div>
                )}
              </div>
            )}

            {/* Notes */}
            <div style={{ marginBottom: 24 }}>
              <h3 style={sectionTitleStyle}>Notas</h3>
              <textarea
                defaultValue={creator.notes || ""}
                placeholder="Adicionar notas sobre este creator..."
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val !== (creator.notes || "")) patchCreator({ notes: val });
                }}
                style={{
                  width: "100%",
                  minHeight: 100,
                  padding: "14px 16px",
                  background: "#141414",
                  border: "1px solid rgba(255,255,255,0.04)",
                  borderRadius: 10,
                  color: "#f5f5f5",
                  fontSize: 13,
                  lineHeight: 1.6,
                  outline: "none",
                  resize: "vertical",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                }}
              />
            </div>
          </div>

          {/* Right Column - Meeting Form */}
          <div style={{ flex: "0 0 40%", maxWidth: "40%" }}>
            <div style={{
              padding: 24,
              background: "#141414",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: 12,
              position: "sticky",
              top: 24,
            }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 4px" }}>Notas de Reunião</h2>
              <p style={{ fontSize: 11, color: "#555", margin: "0 0 20px" }}>Preencher durante ou após a call com o creator.</p>

              {MEETING_QUESTIONS.map((q) => (
                <div key={q.key} style={{ marginBottom: 16 }}>
                  <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "#888", marginBottom: 6 }}>
                    {q.label}
                  </label>
                  <textarea
                    defaultValue={creator.meeting?.[q.key] || ""}
                    onBlur={(e) => {
                      const val = e.target.value;
                      if (val !== (creator.meeting?.[q.key] || "")) {
                        patchCreator({ meeting: { [q.key]: val } });
                      }
                    }}
                    style={{
                      width: "100%",
                      minHeight: 60,
                      padding: "10px 12px",
                      background: "#1a1a1a",
                      border: "1px solid rgba(255,255,255,0.04)",
                      borderRadius: 8,
                      color: "#f5f5f5",
                      fontSize: 12,
                      lineHeight: 1.5,
                      outline: "none",
                      resize: "vertical",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{
          marginTop: 40,
          padding: 24,
          background: "#141414",
          border: "1px solid rgba(255,255,255,0.04)",
          borderRadius: 12,
          display: "flex",
          gap: 14,
        }}>
          <a
            href={`/dm-writer?url=${encodeURIComponent(igData?.url || tkData?.url || "")}&name=${encodeURIComponent(creator.name || "")}`}
            style={{
              padding: "12px 24px",
              background: "#7A0E18",
              border: "none",
              borderRadius: 8,
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            Escrever DM
          </a>
          <a
            href={`/offer-builder?name=${encodeURIComponent(creator.name || "")}&niche=${encodeURIComponent(creator.niche || "")}&platform=${encodeURIComponent(creator.primaryPlatform || "Instagram")}`}
            style={{
              padding: "12px 24px",
              background: "transparent",
              border: "1px solid #7A0E18",
              borderRadius: 8,
              color: "#7A0E18",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            Construir Oferta
          </a>
          <a
            href="/pitch"
            style={{
              padding: "12px 24px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 8,
              color: "#888",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
              fontFamily: "inherit",
            }}
          >
            Criar Pitch Page
          </a>
        </div>

        {/* Delete Creator */}
        <div style={{ marginTop: 40, padding: 24, background: "#141414", border: "1px solid rgba(255,255,255,0.04)", borderRadius: 12 }}>
          <h3 style={{ fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 12px" }}>
            Zona de Perigo
          </h3>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{
              padding: "10px 20px",
              background: "transparent",
              border: "1px solid #dc2626",
              borderRadius: 8,
              color: "#dc2626",
              fontSize: 13,
              fontWeight: 600,
              cursor: deleting ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              opacity: deleting ? 0.5 : 1,
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { if (!deleting) e.target.style.background = "rgba(220,38,38,0.06)"; }}
            onMouseLeave={(e) => { e.target.style.background = "transparent"; }}
          >
            {deleting ? "A eliminar..." : "Eliminar Creator"}
          </button>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 60, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.04)", textAlign: "center" }}>
          <p style={{ fontSize: 10, color: "#333", margin: 0 }}>Second Layer HQ &middot; Creator CRM</p>
        </div>
      </div>
    </div>
  );
}
