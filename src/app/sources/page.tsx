"use client";

import { useState } from "react";
import { mockSources } from "@/lib/mock-data";
import type { Source, SourceCategory } from "@/lib/types";
import {
  Globe, Plus, Trash2, Pause, Play, ExternalLink,
  Shield, AlertTriangle, Database, Newspaper, Search, Radio, Settings
} from "lucide-react";

const catIcons: Record<SourceCategory, typeof Globe> = {
  broker: Globe, legal: Shield, distress: AlertTriangle,
  data: Database, news: Newspaper, signal: Radio, custom: Settings,
};
const catColors: Record<SourceCategory, string> = {
  broker: "#0070f3", legal: "#7c3aed", distress: "#dc2626",
  data: "#16a34a", news: "#d97706", signal: "#0891b2", custom: "#64748b",
};

const emptySource: Omit<Source, "id"> = {
  name: "", url: "", category: "custom", trust_level: 3, priority: 3,
  crawl_frequency: "daily", enabled: true, keywords: [],
};

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>(mockSources);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(emptySource);
  const [filterCat, setFilterCat] = useState<SourceCategory | "all">("all");
  const [kwInput, setKwInput] = useState("");

  const toggle = (id: string) => setSources(s => s.map(x => x.id === id ? { ...x, enabled: !x.enabled } : x));
  const remove = (id: string) => setSources(s => s.filter(x => x.id !== id));

  const addSource = () => {
    if (!draft.name || !draft.url) return;
    setSources(s => [...s, { ...draft, id: `s${Date.now()}`, keywords: draft.keywords?.length ? draft.keywords : undefined } as Source]);
    setDraft(emptySource);
    setKwInput("");
    setAdding(false);
  };

  const filtered = sources.filter(s => filterCat === "all" || s.category === filterCat);
  const cats = Object.keys(catColors) as SourceCategory[];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1000 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0c2340", margin: "0 0 4px" }}>Source Library</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>{sources.length} sources · {sources.filter(s => s.enabled).length} active</p>
        </div>
        <button onClick={() => setAdding(!adding)} style={{
          display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
          background: "#0070f3", color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>
          <Plus size={14} /> Add Source
        </button>
      </div>

      {/* Add source form */}
      {adding && (
        <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 12, padding: 24, marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "#0c2340", margin: "0 0 16px" }}>New Source</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Name *</label>
              <input value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Bolagsplatsen" style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>URL *</label>
              <input value={draft.url} onChange={e => setDraft({ ...draft, url: e.target.value })}
                placeholder="https://..." style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Category</label>
              <select value={draft.category} onChange={e => setDraft({ ...draft, category: e.target.value as SourceCategory })}
                style={{ ...inputStyle, cursor: "pointer" }}>
                {cats.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Crawl Frequency</label>
              <select value={draft.crawl_frequency} onChange={e => setDraft({ ...draft, crawl_frequency: e.target.value })}
                style={{ ...inputStyle, cursor: "pointer" }}>
                {["hourly", "daily", "weekly", "manual"].map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Trust Level (1–5)</label>
              <input type="number" min={1} max={5} value={draft.trust_level}
                onChange={e => setDraft({ ...draft, trust_level: +e.target.value })} style={inputStyle} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Priority (1–5)</label>
              <input type="number" min={1} max={5} value={draft.priority}
                onChange={e => setDraft({ ...draft, priority: +e.target.value })} style={inputStyle} />
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: 12, color: "#64748b", display: "block", marginBottom: 4 }}>Keywords (comma separated)</label>
              <input value={kwInput} onChange={e => { setKwInput(e.target.value); setDraft({ ...draft, keywords: e.target.value.split(",").map(k => k.trim()).filter(Boolean) }); }}
                placeholder="industri, CNC, mekanisk, svets" style={inputStyle} />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
            <button onClick={addSource} style={{ padding: "8px 20px", borderRadius: 8, background: "#0070f3", color: "white", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              Save Source
            </button>
            <button onClick={() => { setAdding(false); setDraft(emptySource); }} style={{ padding: "8px 20px", borderRadius: 8, background: "white", color: "#64748b", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: 13 }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        <button onClick={() => setFilterCat("all")} style={filterBtn(filterCat === "all")}>All ({sources.length})</button>
        {cats.map(c => {
          const count = sources.filter(s => s.category === c).length;
          if (!count) return null;
          return <button key={c} onClick={() => setFilterCat(c)} style={filterBtn(filterCat === c)}>{c} ({count})</button>;
        })}
      </div>

      {/* Source list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(s => {
          const Icon = catIcons[s.category];
          const color = catColors[s.category];
          return (
            <div key={s.id} style={{
              background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px",
              opacity: s.enabled ? 1 : 0.5, display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${color}12`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} style={{ color }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{s.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999, background: `${color}18`, color }}>{s.category}</span>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>Trust: {"★".repeat(s.trust_level)}{"☆".repeat(5 - s.trust_level)}</span>
                </div>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>{s.url}</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Crawl: {s.crawl_frequency}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>Priority: {s.priority}/5</span>
                  {s.last_crawled_at && <span style={{ fontSize: 11, color: "#94a3b8" }}>Last: {new Date(s.last_crawled_at).toLocaleDateString()}</span>}
                  {s.keywords?.map(k => (
                    <span key={k} style={{ fontSize: 10, color: "#475569", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>{k}</span>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => toggle(s.id)} title={s.enabled ? "Pause" : "Enable"}
                  style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: 6, cursor: "pointer" }}>
                  {s.enabled ? <Pause size={14} style={{ color: "#d97706" }} /> : <Play size={14} style={{ color: "#16a34a" }} />}
                </button>
                <a href={s.url} target="_blank" rel="noopener" style={{ display: "flex", alignItems: "center", border: "1px solid #e2e8f0", borderRadius: 6, padding: 6 }}>
                  <ExternalLink size={14} style={{ color: "#64748b" }} />
                </a>
                <button onClick={() => remove(s.id)} title="Remove"
                  style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, padding: 6, cursor: "pointer" }}>
                  <Trash2 size={14} style={{ color: "#dc2626" }} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0",
  fontSize: 13, color: "#0f172a", outline: "none",
};

function filterBtn(active: boolean): React.CSSProperties {
  return {
    padding: "5px 12px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
    border: active ? "1px solid #0070f3" : "1px solid #e2e8f0",
    background: active ? "#0070f3" : "white", color: active ? "white" : "#64748b",
  };
}
