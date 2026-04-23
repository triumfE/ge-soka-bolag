"use client";

import { useState } from "react";
import { mockCompanies } from "@/lib/mock-data";
import type { PipelineStatus, CompanyWithScore } from "@/lib/types";
import { Star, MapPin, Users, DollarSign, AlertTriangle, ChevronDown, Filter, Search } from "lucide-react";

const columns: { id: PipelineStatus; label: string; color: string }[] = [
  { id: "new", label: "New", color: "#0070f3" },
  { id: "monitoring", label: "Monitoring", color: "#6366f1" },
  { id: "interesting", label: "Interesting", color: "#d97706" },
  { id: "contacted", label: "Contacted", color: "#0891b2" },
  { id: "under_review", label: "Under Review", color: "#7c3aed" },
  { id: "high_priority", label: "High Priority", color: "#dc2626" },
  { id: "deprioritized", label: "Deprioritized", color: "#94a3b8" },
  { id: "not_relevant", label: "Not Relevant", color: "#cbd5e1" },
];

const statusColors: Record<string, string> = {
  for_sale: "#16a34a", distressed: "#d97706", bankruptcy: "#dc2626",
  early_signal: "#0070f3", off_market: "#64748b", unknown: "#94a3b8",
};

type View = "board" | "list";

export default function PipelinePage() {
  const [cases, setCases] = useState(mockCompanies);
  const [view, setView] = useState<View>("board");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PipelineStatus | "all">("all");

  const moveCase = (companyId: string, newStatus: PipelineStatus) => {
    setCases(prev => prev.map(c =>
      c.id === companyId ? { ...c, pipeline: { ...c.pipeline!, status: newStatus } } : c
    ));
  };

  const toggleWatch = (companyId: string) => {
    setCases(prev => prev.map(c =>
      c.id === companyId ? { ...c, pipeline: { ...c.pipeline!, watchlist: !c.pipeline?.watchlist } } : c
    ));
  };

  const filtered = cases.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== "all" && c.pipeline?.status !== filterStatus) return false;
    return true;
  });

  const getColumnCases = (status: PipelineStatus) =>
    filtered.filter(c => c.pipeline?.status === status)
      .sort((a, b) => (b.score?.deal_priority ?? 0) - (a.score?.deal_priority ?? 0));

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0c2340", margin: "0 0 4px" }}>Pipeline</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>{cases.length} cases · {cases.filter(c => c.pipeline?.watchlist).length} on watchlist</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {(["board", "list"] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer",
              border: view === v ? "1px solid #0070f3" : "1px solid #e2e8f0",
              background: view === v ? "#0070f3" : "white", color: view === v ? "white" : "#64748b",
            }}>{v === "board" ? "Board" : "List"}</button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..."
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, flex: 1, color: "#0f172a" }} />
        </div>
        {view === "list" && (
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as PipelineStatus | "all")}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#64748b", background: "white", cursor: "pointer" }}>
            <option value="all">All statuses</option>
            {columns.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
          </select>
        )}
      </div>

      {/* Board view */}
      {view === "board" && (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 20 }}>
          {columns.filter(c => !["deprioritized", "not_relevant"].includes(c.id)).map(col => {
            const colCases = getColumnCases(col.id);
            return (
              <div key={col.id} style={{ minWidth: 240, width: 240, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, padding: "0 4px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0c2340" }}>{col.label}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>{colCases.length}</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {colCases.map(c => (
                    <Card key={c.id} c={c} onMove={moveCase} onWatch={toggleWatch} columns={columns} />
                  ))}
                  {colCases.length === 0 && (
                    <div style={{ padding: 20, textAlign: "center", background: "#f8fafc", borderRadius: 8, border: "1px dashed #e2e8f0" }}>
                      <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0 }}>No cases</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List view */}
      {view === "list" && (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "#f8fafc" }}>
                <th style={{ padding: "10px 16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Score</th>
                <th style={{ padding: "10px 16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Company</th>
                <th style={{ padding: "10px 16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Location</th>
                <th style={{ padding: "10px 16px", textAlign: "right", color: "#64748b", fontWeight: 600 }}>Revenue</th>
                <th style={{ padding: "10px 16px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Status</th>
                <th style={{ padding: "10px 16px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Pipeline</th>
                <th style={{ padding: "10px 16px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Signals</th>
                <th style={{ padding: "10px 16px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a, b) => (b.score?.deal_priority ?? 0) - (a.score?.deal_priority ?? 0)).map((c, i) => (
                <tr key={c.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                  <td style={{ padding: "10px 16px" }}>
                    <span style={{ fontWeight: 800, fontSize: 16, color: (c.score?.deal_priority ?? 0) >= 80 ? "#dc2626" : (c.score?.deal_priority ?? 0) >= 60 ? "#d97706" : "#16a34a" }}>
                      {c.score?.deal_priority ?? "–"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{c.industry_tags?.join(" · ")}</div>
                  </td>
                  <td style={{ padding: "10px 16px", color: "#64748b" }}>{c.city}, {c.county}</td>
                  <td style={{ padding: "10px 16px", textAlign: "right", color: "#0f172a", fontWeight: 600 }}>{c.revenue_msek ? `${c.revenue_msek} MSEK` : "–"}</td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                      background: `${statusColors[c.sale_status] ?? "#94a3b8"}18`, color: statusColors[c.sale_status] ?? "#94a3b8" }}>
                      {c.sale_status.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <select value={c.pipeline?.status ?? "new"} onChange={e => moveCase(c.id, e.target.value as PipelineStatus)}
                      style={{ fontSize: 11, padding: "3px 6px", borderRadius: 4, border: "1px solid #e2e8f0", color: "#475569", cursor: "pointer" }}>
                      {columns.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                    </select>
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    {c.signals && c.signals.length > 0 ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, fontSize: 11, color: "#d97706" }}>
                        <AlertTriangle size={12} /> {c.signals.length}
                      </span>
                    ) : <span style={{ color: "#cbd5e1" }}>–</span>}
                  </td>
                  <td style={{ padding: "10px 16px", textAlign: "center" }}>
                    <button onClick={() => toggleWatch(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                      <Star size={14} style={{ color: c.pipeline?.watchlist ? "#d97706" : "#cbd5e1" }} fill={c.pipeline?.watchlist ? "#d97706" : "none"} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Board card component
function Card({ c, onMove, onWatch, columns }: {
  c: CompanyWithScore;
  onMove: (id: string, status: PipelineStatus) => void;
  onWatch: (id: string) => void;
  columns: { id: PipelineStatus; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", padding: 14, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", flex: 1 }}>{c.name}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => onWatch(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
            <Star size={12} style={{ color: c.pipeline?.watchlist ? "#d97706" : "#cbd5e1" }} fill={c.pipeline?.watchlist ? "#d97706" : "none"} />
          </button>
          <span style={{ fontSize: 14, fontWeight: 800, color: (c.score?.deal_priority ?? 0) >= 80 ? "#dc2626" : "#d97706" }}>
            {c.score?.deal_priority ?? "–"}
          </span>
        </div>
      </div>

      <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
        {c.city} · {c.revenue_msek ? `${c.revenue_msek} MSEK` : ""} {c.employees ? `· ${c.employees} emp` : ""}
      </div>

      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999,
          background: `${statusColors[c.sale_status] ?? "#94a3b8"}18`, color: statusColors[c.sale_status] ?? "#94a3b8" }}>
          {c.sale_status.replace("_", " ")}
        </span>
        {c.industry_tags?.slice(0, 2).map(t => (
          <span key={t} style={{ fontSize: 10, color: "#64748b", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>{t}</span>
        ))}
      </div>

      {c.signals && c.signals.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, color: "#d97706", marginBottom: 8 }}>
          <AlertTriangle size={10} /> {c.signals.length} signal{c.signals.length > 1 ? "s" : ""}
        </div>
      )}

      {/* Move dropdown */}
      <div style={{ position: "relative" }}>
        <button onClick={() => setOpen(!open)} style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "5px 8px", borderRadius: 6, border: "1px solid #e2e8f0", background: "#f8fafc",
          fontSize: 11, color: "#64748b", cursor: "pointer",
        }}>
          Move to... <ChevronDown size={12} />
        </button>
        {open && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, marginTop: 4, background: "white",
            borderRadius: 8, boxShadow: "0 8px 30px rgba(0,0,0,0.15)", zIndex: 10, overflow: "hidden" }}>
            {columns.map(col => (
              <button key={col.id} onClick={() => { onMove(c.id, col.id); setOpen(false); }}
                style={{ display: "block", width: "100%", padding: "7px 10px", border: "none", cursor: "pointer",
                  background: c.pipeline?.status === col.id ? "#f0f9ff" : "white", fontSize: 11,
                  color: c.pipeline?.status === col.id ? "#0070f3" : "#334155", textAlign: "left",
                  fontWeight: c.pipeline?.status === col.id ? 600 : 400,
                }}>
                {col.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
