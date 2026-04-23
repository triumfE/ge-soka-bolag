"use client";

import { useEffect, useState } from "react";
import { getDashboardCompanies, getDashboardStats } from "@/lib/db";
import { mockCompanies } from "@/lib/mock-data";
import type { CompanyWithScore } from "@/lib/types";
import {
  TrendingUp, AlertTriangle, Building2, Target, Star,
  MapPin, Users, DollarSign, ChevronRight, RefreshCw, Database
} from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  for_sale: "#16a34a", distressed: "#d97706", bankruptcy: "#dc2626",
  restructuring: "#7c3aed", early_signal: "#0070f3", off_market: "#64748b", unknown: "#94a3b8",
};
const statusLabels: Record<string, string> = {
  for_sale: "For Sale", distressed: "Distressed", bankruptcy: "Bankruptcy",
  restructuring: "Restructuring", early_signal: "Early Signal", off_market: "Off-Market", unknown: "Unknown",
};
const pipelineColors: Record<string, string> = {
  new: "#0070f3", monitoring: "#6366f1", interesting: "#d97706", contacted: "#0891b2",
  under_review: "#7c3aed", high_priority: "#dc2626", deprioritized: "#94a3b8", not_relevant: "#cbd5e1",
};

export default function Dashboard() {
  const [companies, setCompanies] = useState<CompanyWithScore[]>([]);
  const [stats, setStats] = useState({ totalCompanies: 0, newLast7: 0, bankruptcies: 0, earlySignals: 0, pipelineCounts: {} as Record<string, number> });
  const [loading, setLoading] = useState(true);
  const [useMock, setUseMock] = useState(false);
  const [crawling, setCrawling] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, st] = await Promise.all([getDashboardCompanies(20), getDashboardStats()]);
      if (comps.length === 0) { setCompanies(mockCompanies); setUseMock(true); }
      else { setCompanies(comps); setUseMock(false); setStats(st); }
    } catch {
      setCompanies(mockCompanies); setUseMock(true);
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const runCrawl = async () => {
    setCrawling(true);
    try {
      const res = await fetch("/api/crawl", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      const data = await res.json();
      alert(`Crawl complete: ${JSON.stringify(data.results?.map((r: { source: string; newCompanies: number }) => `${r.source}: ${r.newCompanies} new`))}`);
      await loadData();
    } catch (e) {
      alert(`Crawl failed: ${e instanceof Error ? e.message : String(e)}`);
    }
    setCrawling(false);
  };

  const sorted = [...companies].sort((a, b) => (b.score?.deal_priority ?? 0) - (a.score?.deal_priority ?? 0));
  const watchlistCount = companies.filter(c => c.pipeline?.watchlist).length;
  const signalCount = companies.reduce((n, c) => n + (c.signals?.length ?? 0), 0);

  const kpis = useMock
    ? [
      { label: "Total Cases", value: companies.length, icon: Building2, color: "#0070f3" },
      { label: "High Priority", value: companies.filter(c => (c.score?.deal_priority ?? 0) >= 80).length, icon: Target, color: "#dc2626" },
      { label: "Watchlist", value: watchlistCount, icon: Star, color: "#d97706" },
      { label: "Signals", value: signalCount, icon: AlertTriangle, color: "#7c3aed" },
    ]
    : [
      { label: "Total Cases", value: stats.totalCompanies, icon: Building2, color: "#0070f3" },
      { label: "New (7 days)", value: stats.newLast7, icon: TrendingUp, color: "#16a34a" },
      { label: "Bankruptcies", value: stats.bankruptcies, icon: AlertTriangle, color: "#dc2626" },
      { label: "Early Signals", value: stats.earlySignals, icon: Target, color: "#d97706" },
    ];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0c2340", margin: "0 0 4px" }}>Deal Sourcing Dashboard</h1>
          <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>
            {useMock ? "Showing demo data — connect Supabase for live data" : "Live data from Supabase"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {useMock && (
            <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#d97706", background: "#fffbeb", padding: "4px 10px", borderRadius: 6, border: "1px solid #fde68a" }}>
              <Database size={12} /> Demo mode
            </span>
          )}
          <button onClick={runCrawl} disabled={crawling} style={{
            display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 8,
            background: "#0070f3", color: "white", border: "none", cursor: crawling ? "wait" : "pointer",
            fontSize: 13, fontWeight: 600, opacity: crawling ? 0.7 : 1,
          }}>
            <RefreshCw size={14} className={crawling ? "animate-spin" : ""} /> {crawling ? "Crawling..." : "Run Crawl"}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: "white", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500, marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#0f172a" }}>{k.value}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${k.color}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon size={18} style={{ color: k.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0c2340", margin: 0 }}>Top Deals — Ranked by AI Priority</h2>
          <Link href="/pipeline" style={{ fontSize: 12, color: "#0070f3", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            Pipeline <ChevronRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
        ) : sorted.map((c, i) => (
          <div key={c.id} style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 16, background: i % 2 === 0 ? "white" : "#fafbfc" }}>
            <div style={{ width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              background: (c.score?.deal_priority ?? 0) >= 80 ? "#fef2f2" : (c.score?.deal_priority ?? 0) >= 60 ? "#fffbeb" : "#f0fdf4",
              color: (c.score?.deal_priority ?? 0) >= 80 ? "#dc2626" : (c.score?.deal_priority ?? 0) >= 60 ? "#d97706" : "#16a34a",
              fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
              {c.score?.deal_priority ?? "–"}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Link href={`/company/${c.id}`} style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", textDecoration: "none" }}>{c.name}</Link>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                  background: `${statusColors[c.sale_status] ?? "#94a3b8"}18`, color: statusColors[c.sale_status] ?? "#94a3b8" }}>
                  {statusLabels[c.sale_status] ?? c.sale_status}
                </span>
                {c.pipeline?.watchlist && <Star size={12} style={{ color: "#d97706" }} fill="#d97706" />}
              </div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>{c.business_description}</div>
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                {c.city && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}><MapPin size={11} /> {c.city}{c.county ? `, ${c.county}` : ""}</span>}
                {c.revenue_msek && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}><DollarSign size={11} /> {c.revenue_msek} MSEK</span>}
                {c.employees && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}><Users size={11} /> {c.employees}</span>}
                {c.industry_tags?.slice(0, 3).map(t => (
                  <span key={t} style={{ fontSize: 11, color: "#475569", background: "#f1f5f9", padding: "1px 8px", borderRadius: 4 }}>{t}</span>
                ))}
              </div>
              {c.signals && c.signals.length > 0 && (
                <div style={{ marginTop: 6, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {c.signals.map(s => (
                    <span key={s.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                      color: "#d97706", background: "#fffbeb", padding: "2px 8px", borderRadius: 4, border: "1px solid #fde68a" }}>
                      <AlertTriangle size={10} /> {s.signal_type.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
            </div>
            {c.score && (
              <div style={{ width: 150, flexShrink: 0, fontSize: 11 }}>
                {([["Fit", c.score.strategic_fit, "#0070f3"], ["Prob", c.score.transaction_probability, "#16a34a"],
                  ["Potential", c.score.improvement_potential, "#d97706"], ["Risk", c.score.risk_score, "#dc2626"]] as const).map(([l, v, col]) => (
                  <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ width: 48, color: "#94a3b8" }}>{l}</span>
                    <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 2 }}>
                      <div style={{ width: `${v}%`, height: "100%", background: col, borderRadius: 2 }} />
                    </div>
                    <span style={{ width: 22, textAlign: "right", color: "#64748b", fontWeight: 600 }}>{v}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
