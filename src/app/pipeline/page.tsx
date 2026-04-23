"use client";

import { useState, useEffect } from "react";
import { getCompanies, getScore, getPipeline, getSignals, upsertPipeline } from "@/lib/db";
import { mockCompanies } from "@/lib/mock-data";
import type { PipelineStatus, CompanyWithScore } from "@/lib/types";
import { Star, MapPin, DollarSign, AlertTriangle, ChevronDown, Search } from "lucide-react";
import Link from "next/link";

const columns: { id: PipelineStatus; label: string; color: string }[] = [
  { id: "new", label: "New", color: "#0070f3" },
  { id: "monitoring", label: "Monitoring", color: "#6366f1" },
  { id: "interesting", label: "Interesting", color: "#d97706" },
  { id: "contacted", label: "Contacted", color: "#0891b2" },
  { id: "under_review", label: "Under Review", color: "#7c3aed" },
  { id: "high_priority", label: "High Priority", color: "#dc2626" },
];
const statusColors: Record<string, string> = {
  for_sale: "#16a34a", distressed: "#d97706", bankruptcy: "#dc2626",
  early_signal: "#0070f3", off_market: "#64748b", unknown: "#94a3b8",
};
type View = "board" | "list";

export default function PipelinePage() {
  const [cases, setCases] = useState<CompanyWithScore[]>([]);
  const [view, setView] = useState<View>("list");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const companies = await getCompanies({ limit: 100 });
        if (companies.length === 0) { setCases(mockCompanies); setUseMock(true); setLoading(false); return; }
        const enriched: CompanyWithScore[] = await Promise.all(companies.map(async c => {
          const [score, pipeline, signals] = await Promise.all([getScore(c.id), getPipeline(c.id), getSignals(c.id)]);
          return { ...c, score: score ?? undefined, pipeline: pipeline ?? undefined, signals };
        }));
        setCases(enriched);
        setUseMock(false);
      } catch { setCases(mockCompanies); setUseMock(true); }
      setLoading(false);
    })();
  }, []);

  const moveCase = async (companyId: string, newStatus: PipelineStatus) => {
    setCases(prev => prev.map(c => c.id === companyId ? { ...c, pipeline: { ...c.pipeline!, status: newStatus, company_id: companyId, id: c.pipeline?.id ?? "", watchlist: c.pipeline?.watchlist ?? false } } : c));
    if (!useMock) await upsertPipeline({ company_id: companyId, status: newStatus });
  };

  const toggleWatch = async (companyId: string) => {
    const c = cases.find(x => x.id === companyId);
    const newVal = !c?.pipeline?.watchlist;
    setCases(prev => prev.map(x => x.id === companyId ? { ...x, pipeline: { ...x.pipeline!, watchlist: newVal, company_id: companyId, id: x.pipeline?.id ?? "", status: x.pipeline?.status ?? "new" } } : x));
    if (!useMock) await upsertPipeline({ company_id: companyId, watchlist: newVal });
  };

  const filtered = cases.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()));
  const getCol = (status: PipelineStatus) => filtered.filter(c => (c.pipeline?.status ?? "new") === status).sort((a, b) => (b.score?.deal_priority ?? 0) - (a.score?.deal_priority ?? 0));

  if (loading) return <div style={{ padding: 40, color: "#94a3b8" }}>Loading pipeline...</div>;

  return (
    <div style={{ padding: "28px 32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0c2340", margin: "0 0 4px" }}>Pipeline</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>{cases.length} cases{useMock ? " (demo)" : ""}</p>
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

      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 12px", flex: 1, maxWidth: 300 }}>
          <Search size={14} style={{ color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, flex: 1 }} />
        </div>
      </div>

      {view === "board" ? (
        <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 20 }}>
          {columns.map(col => {
            const colCases = getCol(col.id);
            return (
              <div key={col.id} style={{ minWidth: 230, width: 230, flexShrink: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: col.color }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#0c2340" }}>{col.label}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8", marginLeft: "auto" }}>{colCases.length}</span>
                </div>
                {colCases.map(c => (
                  <div key={c.id} style={{ background: "white", borderRadius: 10, border: "1px solid #e2e8f0", padding: 12, marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                      <Link href={`/company/${c.id}`} style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", textDecoration: "none", flex: 1 }}>{c.name}</Link>
                      <span style={{ fontSize: 14, fontWeight: 800, color: (c.score?.deal_priority ?? 0) >= 70 ? "#dc2626" : "#d97706" }}>{c.score?.deal_priority ?? "–"}</span>
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>{c.city} · {c.revenue_msek ? `${c.revenue_msek}M` : ""}</div>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 999, background: `${statusColors[c.sale_status] ?? "#94a3b8"}18`, color: statusColors[c.sale_status] ?? "#94a3b8" }}>
                      {c.sale_status.replace("_", " ")}
                    </span>
                    <select value={c.pipeline?.status ?? "new"} onChange={e => moveCase(c.id, e.target.value as PipelineStatus)}
                      style={{ display: "block", width: "100%", marginTop: 8, padding: "4px 6px", borderRadius: 4, border: "1px solid #e2e8f0", fontSize: 11, cursor: "pointer" }}>
                      {columns.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                    </select>
                  </div>
                ))}
                {colCases.length === 0 && <div style={{ padding: 16, textAlign: "center", background: "#f8fafc", borderRadius: 8, border: "1px dashed #e2e8f0", fontSize: 12, color: "#cbd5e1" }}>Empty</div>}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Score</th>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Company</th>
              <th style={{ padding: "10px 16px", textAlign: "left", color: "#64748b", fontWeight: 600 }}>Location</th>
              <th style={{ padding: "10px 16px", textAlign: "right", color: "#64748b", fontWeight: 600 }}>Revenue</th>
              <th style={{ padding: "10px 16px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Status</th>
              <th style={{ padding: "10px 16px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Pipeline</th>
              <th style={{ padding: "10px 16px", textAlign: "center", color: "#64748b", fontWeight: 600 }}>Watch</th>
            </tr></thead>
            <tbody>{filtered.sort((a, b) => (b.score?.deal_priority ?? 0) - (a.score?.deal_priority ?? 0)).map((c, i) => (
              <tr key={c.id} style={{ borderTop: "1px solid #f1f5f9", background: i % 2 === 0 ? "white" : "#fafbfc" }}>
                <td style={{ padding: "10px 16px", fontWeight: 800, fontSize: 16, color: (c.score?.deal_priority ?? 0) >= 70 ? "#dc2626" : "#d97706" }}>{c.score?.deal_priority ?? "–"}</td>
                <td style={{ padding: "10px 16px" }}><Link href={`/company/${c.id}`} style={{ fontWeight: 600, color: "#0f172a", textDecoration: "none" }}>{c.name}</Link><div style={{ fontSize: 11, color: "#94a3b8" }}>{c.industry_tags?.join(" · ")}</div></td>
                <td style={{ padding: "10px 16px", color: "#64748b" }}>{c.city}{c.county ? `, ${c.county}` : ""}</td>
                <td style={{ padding: "10px 16px", textAlign: "right", fontWeight: 600 }}>{c.revenue_msek ? `${c.revenue_msek}M` : "–"}</td>
                <td style={{ padding: "10px 16px", textAlign: "center" }}><span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: `${statusColors[c.sale_status] ?? "#94a3b8"}18`, color: statusColors[c.sale_status] ?? "#94a3b8" }}>{c.sale_status.replace("_", " ")}</span></td>
                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                  <select value={c.pipeline?.status ?? "new"} onChange={e => moveCase(c.id, e.target.value as PipelineStatus)} style={{ fontSize: 11, padding: "3px 6px", borderRadius: 4, border: "1px solid #e2e8f0", cursor: "pointer" }}>
                    {columns.map(col => <option key={col.id} value={col.id}>{col.label}</option>)}
                  </select>
                </td>
                <td style={{ padding: "10px 16px", textAlign: "center" }}>
                  <button onClick={() => toggleWatch(c.id)} style={{ background: "none", border: "none", cursor: "pointer" }}>
                    <Star size={14} style={{ color: c.pipeline?.watchlist ? "#d97706" : "#cbd5e1" }} fill={c.pipeline?.watchlist ? "#d97706" : "none"} />
                  </button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}
