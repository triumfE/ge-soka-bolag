"use client";

import { mockCompanies } from "@/lib/mock-data";
import {
  TrendingUp, AlertTriangle, Building2, Target, Eye, Star,
  ArrowUpRight, MapPin, Users, DollarSign, ChevronRight
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

const sorted = [...mockCompanies].sort((a, b) => (b.score?.deal_priority ?? 0) - (a.score?.deal_priority ?? 0));

const kpis = [
  { label: "Total Cases", value: mockCompanies.length, icon: Building2, color: "#0070f3" },
  { label: "High Priority", value: mockCompanies.filter(c => c.score && c.score.deal_priority >= 80).length, icon: Target, color: "#dc2626" },
  { label: "Watchlist", value: mockCompanies.filter(c => c.pipeline?.watchlist).length, icon: Star, color: "#d97706" },
  { label: "New Signals", value: mockCompanies.reduce((n, c) => n + (c.signals?.length ?? 0), 0), icon: AlertTriangle, color: "#7c3aed" },
];

export default function Dashboard() {
  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0c2340", margin: "0 0 4px" }}>Deal Sourcing Dashboard</h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>AI-driven acquisition pipeline for industrial companies in Sweden</p>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 28 }}>
        {kpis.map(k => (
          <div key={k.label} style={{ background: "white", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
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

      {/* Top deals table */}
      <div style={{ background: "white", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: "#0c2340", margin: 0 }}>Top Deals — Ranked by AI Priority Score</h2>
          <Link href="/pipeline" style={{ fontSize: 12, color: "#0070f3", textDecoration: "none", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            View pipeline <ChevronRight size={14} />
          </Link>
        </div>

        {sorted.map((c, i) => (
          <div key={c.id} style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", gap: 16, alignItems: "flex-start",
            background: i % 2 === 0 ? "white" : "#fafbfc" }}>

            {/* Priority score */}
            <div style={{ width: 48, height: 48, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center",
              background: (c.score?.deal_priority ?? 0) >= 80 ? "#fef2f2" : (c.score?.deal_priority ?? 0) >= 60 ? "#fffbeb" : "#f0fdf4",
              color: (c.score?.deal_priority ?? 0) >= 80 ? "#dc2626" : (c.score?.deal_priority ?? 0) >= 60 ? "#d97706" : "#16a34a",
              fontWeight: 800, fontSize: 18, flexShrink: 0 }}>
              {c.score?.deal_priority ?? "–"}
            </div>

            {/* Company info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Link href={`/company/${c.id}`} style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", textDecoration: "none" }}>{c.name}</Link>
                <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                  background: `${statusColors[c.sale_status]}18`, color: statusColors[c.sale_status] }}>
                  {statusLabels[c.sale_status]}
                </span>
                {c.pipeline && (
                  <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                    background: `${pipelineColors[c.pipeline.status]}18`, color: pipelineColors[c.pipeline.status] }}>
                    {c.pipeline.status.replace("_", " ")}
                  </span>
                )}
                {c.pipeline?.watchlist && <Star size={12} style={{ color: "#d97706" }} fill="#d97706" />}
              </div>

              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6, lineHeight: 1.4 }}>
                {c.business_description}
              </div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                {c.city && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}><MapPin size={11} /> {c.city}, {c.county}</span>}
                {c.revenue_msek && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}><DollarSign size={11} /> {c.revenue_msek} MSEK</span>}
                {c.employees && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}><Users size={11} /> {c.employees} emp</span>}
                {c.industry_tags?.slice(0, 3).map(t => (
                  <span key={t} style={{ fontSize: 11, color: "#475569", background: "#f1f5f9", padding: "1px 8px", borderRadius: 4 }}>{t}</span>
                ))}
              </div>

              {/* Signals */}
              {c.signals && c.signals.length > 0 && (
                <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {c.signals.map(s => (
                    <span key={s.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11,
                      color: "#d97706", background: "#fffbeb", padding: "2px 8px", borderRadius: 4, border: "1px solid #fde68a" }}>
                      <AlertTriangle size={10} /> {s.signal_type.replace(/_/g, " ")} ({s.confidence}%)
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Score breakdown */}
            <div style={{ width: 160, flexShrink: 0 }}>
              {c.score && (
                <div style={{ fontSize: 11 }}>
                  {([
                    ["Fit", c.score.strategic_fit, "#0070f3"],
                    ["Probability", c.score.transaction_probability, "#16a34a"],
                    ["Potential", c.score.improvement_potential, "#d97706"],
                    ["Risk", c.score.risk_score, "#dc2626"],
                  ] as const).map(([label, val, color]) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                      <span style={{ width: 56, color: "#94a3b8" }}>{label}</span>
                      <div style={{ flex: 1, height: 4, background: "#f1f5f9", borderRadius: 2 }}>
                        <div style={{ width: `${val}%`, height: "100%", background: color, borderRadius: 2 }} />
                      </div>
                      <span style={{ width: 24, textAlign: "right", color: "#64748b", fontWeight: 600 }}>{val}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
