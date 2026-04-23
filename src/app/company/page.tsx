"use client";

import { useState, useEffect } from "react";
import { getCompanies } from "@/lib/db";
import type { Company } from "@/lib/types";
import { Search, MapPin, Users, DollarSign, Building2, Filter } from "lucide-react";
import Link from "next/link";

const statusColors: Record<string, string> = {
  for_sale: "#16a34a", distressed: "#d97706", bankruptcy: "#dc2626",
  restructuring: "#7c3aed", early_signal: "#0070f3", off_market: "#64748b", unknown: "#94a3b8",
};
const counties = ["All", "Värmland", "Västra Götaland", "Halland", "Örebro", "Småland", "Stockholm", "Skåne", "Dalarna", "Gävleborg"];
const statuses = ["All", "for_sale", "bankruptcy", "restructuring", "early_signal", "off_market", "unknown"];

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [county, setCounty] = useState("All");
  const [status, setStatus] = useState("All");

  useEffect(() => {
    (async () => {
      try {
        const data = await getCompanies({ limit: 200 });
        setCompanies(data);
      } catch { /* empty */ }
      setLoading(false);
    })();
  }, []);

  const filtered = companies.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.business_description?.toLowerCase().includes(search.toLowerCase())) return false;
    if (county !== "All" && c.county !== county) return false;
    if (status !== "All" && c.sale_status !== status) return false;
    return true;
  });

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0c2340", margin: "0 0 4px" }}>Companies</h1>
        <p style={{ fontSize: 14, color: "#64748b", margin: 0 }}>{companies.length} companies in database</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "white", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", flex: 1, maxWidth: 350 }}>
          <Search size={14} style={{ color: "#94a3b8" }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or description..."
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 13, flex: 1, color: "#0f172a" }} />
        </div>
        <select value={county} onChange={e => setCounty(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#64748b", background: "white", cursor: "pointer" }}>
          {counties.map(c => <option key={c} value={c}>{c === "All" ? "All counties" : c}</option>)}
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #e2e8f0", fontSize: 13, color: "#64748b", background: "white", cursor: "pointer" }}>
          {statuses.map(s => <option key={s} value={s}>{s === "All" ? "All statuses" : s.replace("_", " ")}</option>)}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>Loading...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "white", borderRadius: 12, border: "1px solid #e2e8f0" }}>
          <Building2 size={32} style={{ color: "#cbd5e1", marginBottom: 12 }} />
          <h3 style={{ color: "#94a3b8", fontSize: 16, margin: "0 0 6px" }}>No companies found</h3>
          <p style={{ color: "#cbd5e1", fontSize: 13 }}>Run a crawl from the Dashboard to import companies</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {filtered.map(c => (
            <Link key={c.id} href={`/company/${c.id}`} style={{ textDecoration: "none" }}>
              <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 10, padding: "16px 20px", display: "flex", gap: 16, alignItems: "center", cursor: "pointer" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{c.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999,
                      background: `${statusColors[c.sale_status] ?? "#94a3b8"}18`, color: statusColors[c.sale_status] ?? "#94a3b8" }}>
                      {c.sale_status.replace("_", " ")}
                    </span>
                    {c.org_nr && <span style={{ fontSize: 11, color: "#94a3b8" }}>{c.org_nr}</span>}
                  </div>
                  {c.business_description && (
                    <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 6px", lineHeight: 1.4 }}>{c.business_description.slice(0, 200)}</p>
                  )}
                  <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
                    {c.city && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}><MapPin size={11} /> {c.city}{c.county ? `, ${c.county}` : ""}</span>}
                    {c.revenue_msek && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}><DollarSign size={11} /> {c.revenue_msek} MSEK</span>}
                    {c.employees && <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#94a3b8" }}><Users size={11} /> {c.employees}</span>}
                    {c.industry_tags?.slice(0, 4).map(t => (
                      <span key={t} style={{ fontSize: 11, color: "#475569", background: "#f1f5f9", padding: "1px 8px", borderRadius: 4 }}>{t}</span>
                    ))}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
