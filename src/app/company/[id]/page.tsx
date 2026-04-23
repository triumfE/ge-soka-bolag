"use client";

import { useParams } from "next/navigation";
import { mockCompanies } from "@/lib/mock-data";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Users, DollarSign, Globe, Building2, Star,
  AlertTriangle, TrendingUp, TrendingDown, Shield, Target, Zap,
  FileText, ExternalLink, Calendar, Wrench, Award
} from "lucide-react";
import type { PipelineStatus } from "@/lib/types";
import { useState } from "react";

const statusColors: Record<string,string> = {
  for_sale:"#16a34a", distressed:"#d97706", bankruptcy:"#dc2626",
  restructuring:"#7c3aed", early_signal:"#0070f3", off_market:"#64748b", unknown:"#94a3b8",
};
const pipeStatuses: PipelineStatus[] = ["new","monitoring","interesting","contacted","under_review","high_priority","deprioritized","not_relevant"];

function ScoreBar({label,value,color,max=100}:{label:string,value:number,color:string,max?:number}) {
  return (
    <div style={{ marginBottom:12 }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
        <span style={{ fontSize:12, color:"#64748b" }}>{label}</span>
        <span style={{ fontSize:13, fontWeight:700, color }}>{value}/{max}</span>
      </div>
      <div style={{ height:6, background:"#f1f5f9", borderRadius:3 }}>
        <div style={{ width:`${(value/max)*100}%`, height:"100%", background:color, borderRadius:3 }} />
      </div>
    </div>
  );
}

export default function CompanyDetail() {
  const { id } = useParams();
  const c = mockCompanies.find(x => x.id === id);
  const [pipeStatus, setPipeStatus] = useState(c?.pipeline?.status ?? "new");
  const [watchlist, setWatchlist] = useState(c?.pipeline?.watchlist ?? false);
  const [notes, setNotes] = useState(c?.pipeline?.notes ?? "");

  if (!c) return (
    <div style={{ padding:40, textAlign:"center" }}>
      <h2 style={{ color:"#94a3b8" }}>Company not found</h2>
      <Link href="/dashboard" style={{ color:"#0070f3" }}>Back to dashboard</Link>
    </div>
  );

  const s = c.score;
  const b = c.brief;

  return (
    <div style={{ padding:"28px 32px", maxWidth:1100 }}>
      {/* Back */}
      <Link href="/dashboard" style={{ display:"inline-flex", alignItems:"center", gap:6, fontSize:13, color:"#64748b", textDecoration:"none", marginBottom:16 }}>
        <ArrowLeft size={14} /> Back to dashboard
      </Link>

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:16 }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
            <h1 style={{ fontSize:24, fontWeight:800, color:"#0c2340", margin:0 }}>{c.name}</h1>
            <span style={{ fontSize:11, fontWeight:600, padding:"3px 10px", borderRadius:999,
              background:`${statusColors[c.sale_status]}18`, color:statusColors[c.sale_status] }}>
              {c.sale_status.replace("_"," ")}
            </span>
            <button onClick={()=>setWatchlist(!watchlist)} style={{ background:"none", border:"none", cursor:"pointer" }}>
              <Star size={18} style={{ color: watchlist ? "#d97706":"#cbd5e1" }} fill={watchlist ? "#d97706":"none"} />
            </button>
          </div>
          <div style={{ display:"flex", gap:16, flexWrap:"wrap", fontSize:13, color:"#64748b" }}>
            {c.org_nr && <span>Org.nr: {c.org_nr}</span>}
            {c.city && <span style={{ display:"flex", alignItems:"center", gap:4 }}><MapPin size={12} /> {c.city}, {c.county}</span>}
            {c.revenue_msek && <span style={{ display:"flex", alignItems:"center", gap:4 }}><DollarSign size={12} /> {c.revenue_msek} MSEK</span>}
            {c.employees && <span style={{ display:"flex", alignItems:"center", gap:4 }}><Users size={12} /> {c.employees} employees</span>}
            {c.founded_year && <span style={{ display:"flex", alignItems:"center", gap:4 }}><Calendar size={12} /> Founded {c.founded_year}</span>}
            {c.website && <a href={`https://${c.website}`} target="_blank" rel="noopener" style={{ display:"flex", alignItems:"center", gap:4, color:"#0070f3" }}><Globe size={12} /> {c.website}</a>}
          </div>
        </div>

        {/* Deal Priority */}
        {s && (
          <div style={{ width:80, height:80, borderRadius:16, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center",
            background: s.deal_priority >= 80 ? "#fef2f2" : s.deal_priority >= 60 ? "#fffbeb" : "#f0fdf4",
            border: `2px solid ${s.deal_priority >= 80 ? "#fecaca" : s.deal_priority >= 60 ? "#fde68a" : "#86efac"}`,
          }}>
            <span style={{ fontSize:28, fontWeight:800, color: s.deal_priority >= 80 ? "#dc2626" : s.deal_priority >= 60 ? "#d97706":"#16a34a" }}>{s.deal_priority}</span>
            <span style={{ fontSize:9, color:"#94a3b8", fontWeight:600 }}>PRIORITY</span>
          </div>
        )}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:20 }}>
        {/* Left column */}
        <div>
          {/* AI Deal Brief */}
          {b && (
            <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:12, padding:24, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <FileText size={16} style={{ color:"#0070f3" }} />
                <h2 style={{ fontSize:16, fontWeight:700, color:"#0c2340", margin:0 }}>AI Deal Brief</h2>
                <span style={{ fontSize:10, color:"#94a3b8", marginLeft:"auto" }}>Generated {new Date(b.generated_at).toLocaleDateString()}</span>
              </div>
              <p style={{ fontSize:14, color:"#334155", lineHeight:1.7, margin:"0 0 16px" }}>{b.summary}</p>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                <div>
                  <h4 style={{ fontSize:12, fontWeight:700, color:"#0c2340", margin:"0 0 6px" }}>Why it matches</h4>
                  <p style={{ fontSize:13, color:"#64748b", lineHeight:1.6, margin:0 }}>{b.why_match}</p>
                </div>
                <div>
                  <h4 style={{ fontSize:12, fontWeight:700, color:"#0c2340", margin:"0 0 6px" }}>Why it may become available</h4>
                  <p style={{ fontSize:13, color:"#64748b", lineHeight:1.6, margin:0 }}>{b.why_available}</p>
                </div>
              </div>

              {b.strengths && (
                <div style={{ marginTop:16 }}>
                  <h4 style={{ fontSize:12, fontWeight:700, color:"#16a34a", margin:"0 0 6px" }}>Strengths</h4>
                  <ul style={{ margin:0, paddingLeft:18 }}>
                    {b.strengths.map((s,i) => <li key={i} style={{ fontSize:13, color:"#334155", marginBottom:3 }}>{s}</li>)}
                  </ul>
                </div>
              )}
              {b.risks && (
                <div style={{ marginTop:12 }}>
                  <h4 style={{ fontSize:12, fontWeight:700, color:"#dc2626", margin:"0 0 6px" }}>Risks</h4>
                  <ul style={{ margin:0, paddingLeft:18 }}>
                    {b.risks.map((r,i) => <li key={i} style={{ fontSize:13, color:"#334155", marginBottom:3 }}>{r}</li>)}
                  </ul>
                </div>
              )}
              {b.suggested_next_step && (
                <div style={{ marginTop:14, padding:"10px 14px", background:"#f0f9ff", borderRadius:8, border:"1px solid #bae6fd" }}>
                  <span style={{ fontSize:12, fontWeight:700, color:"#0369a1" }}>Suggested next step: </span>
                  <span style={{ fontSize:13, color:"#0c4a6e" }}>{b.suggested_next_step}</span>
                </div>
              )}
            </div>
          )}

          {/* Business description */}
          <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:12, padding:24, marginBottom:20 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:"#0c2340", margin:"0 0 12px" }}>Business Description</h2>
            <p style={{ fontSize:14, color:"#334155", lineHeight:1.7, margin:"0 0 16px" }}>{c.business_description}</p>

            {c.industry_tags && c.industry_tags.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <span style={{ fontSize:12, color:"#94a3b8", marginRight:8 }}>Industry:</span>
                {c.industry_tags.map(t => <span key={t} style={{ fontSize:12, color:"#475569", background:"#f1f5f9", padding:"2px 8px", borderRadius:4, marginRight:6 }}>{t}</span>)}
              </div>
            )}
            {c.capabilities && c.capabilities.length > 0 && (
              <div style={{ marginBottom:12 }}>
                <span style={{ fontSize:12, color:"#94a3b8", marginRight:8 }}>Capabilities:</span>
                {c.capabilities.map(t => <span key={t} style={{ fontSize:12, color:"#0369a1", background:"#f0f9ff", padding:"2px 8px", borderRadius:4, marginRight:6 }}>{t}</span>)}
              </div>
            )}
            {c.owner_names && c.owner_names.length > 0 && (
              <div>
                <span style={{ fontSize:12, color:"#94a3b8", marginRight:8 }}>Ownership:</span>
                {c.owner_names.map(o => <span key={o} style={{ fontSize:13, color:"#334155" }}>{o}</span>)}
              </div>
            )}
          </div>

          {/* Signals */}
          {c.signals && c.signals.length > 0 && (
            <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:12, padding:24, marginBottom:20 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:14 }}>
                <AlertTriangle size={16} style={{ color:"#d97706" }} />
                <h2 style={{ fontSize:16, fontWeight:700, color:"#0c2340", margin:0 }}>Detected Signals ({c.signals.length})</h2>
              </div>
              {c.signals.map(sig => (
                <div key={sig.id} style={{ display:"flex", gap:12, padding:"10px 0", borderBottom:"1px solid #f1f5f9" }}>
                  <div style={{ width:40, height:40, borderRadius:8, background:"#fffbeb", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <AlertTriangle size={16} style={{ color:"#d97706" }} />
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:2 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:"#0f172a" }}>{sig.signal_type.replace(/_/g," ")}</span>
                      <span style={{ fontSize:11, fontWeight:600, color:"#d97706", background:"#fffbeb", padding:"1px 6px", borderRadius:999 }}>{sig.confidence}%</span>
                    </div>
                    <p style={{ fontSize:13, color:"#64748b", margin:0 }}>{sig.description}</p>
                    <span style={{ fontSize:11, color:"#94a3b8" }}>{new Date(sig.detected_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div>
          {/* Score breakdown */}
          {s && (
            <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:12, padding:20, marginBottom:16 }}>
              <h3 style={{ fontSize:14, fontWeight:700, color:"#0c2340", margin:"0 0 16px" }}>AI Score Breakdown</h3>
              <ScoreBar label="Strategic Fit" value={s.strategic_fit} color="#0070f3" />
              <ScoreBar label="Transaction Probability" value={s.transaction_probability} color="#16a34a" />
              <ScoreBar label="Improvement Potential" value={s.improvement_potential} color="#d97706" />
              <ScoreBar label="Risk" value={s.risk_score} color="#dc2626" />
              <ScoreBar label="Source Confidence" value={s.source_confidence} color="#6366f1" />

              {s.fit_reasons && s.fit_reasons.length > 0 && (
                <div style={{ marginTop:14, padding:"10px 12px", background:"#f0f9ff", borderRadius:8, fontSize:12 }}>
                  <div style={{ fontWeight:700, color:"#0369a1", marginBottom:4 }}>Fit reasons</div>
                  {s.fit_reasons.map((r,i) => <div key={i} style={{ color:"#475569", marginBottom:2 }}>• {r}</div>)}
                </div>
              )}
              {s.improvement_reasons && s.improvement_reasons.length > 0 && (
                <div style={{ marginTop:8, padding:"10px 12px", background:"#fffbeb", borderRadius:8, fontSize:12 }}>
                  <div style={{ fontWeight:700, color:"#92400e", marginBottom:4 }}>Improvement potential</div>
                  {s.improvement_reasons.map((r,i) => <div key={i} style={{ color:"#475569", marginBottom:2 }}>• {r}</div>)}
                </div>
              )}
              {s.risk_reasons && s.risk_reasons.length > 0 && (
                <div style={{ marginTop:8, padding:"10px 12px", background:"#fef2f2", borderRadius:8, fontSize:12 }}>
                  <div style={{ fontWeight:700, color:"#991b1b", marginBottom:4 }}>Risk factors</div>
                  {s.risk_reasons.map((r,i) => <div key={i} style={{ color:"#475569", marginBottom:2 }}>• {r}</div>)}
                </div>
              )}
            </div>
          )}

          {/* Pipeline controls */}
          <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:12, padding:20, marginBottom:16 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:"#0c2340", margin:"0 0 12px" }}>Pipeline Status</h3>
            <select value={pipeStatus} onChange={e => setPipeStatus(e.target.value as PipelineStatus)}
              style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, color:"#0f172a", marginBottom:12, cursor:"pointer" }}>
              {pipeStatuses.map(s => <option key={s} value={s}>{s.replace("_"," ")}</option>)}
            </select>

            <label style={{ fontSize:12, color:"#64748b", display:"block", marginBottom:4 }}>Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={4}
              placeholder="Add notes about this case..."
              style={{ width:"100%", padding:"8px 12px", borderRadius:8, border:"1px solid #e2e8f0", fontSize:13, color:"#0f172a", resize:"vertical" }} />

            {c.pipeline?.tags && c.pipeline.tags.length > 0 && (
              <div style={{ marginTop:10 }}>
                <span style={{ fontSize:12, color:"#94a3b8" }}>Tags: </span>
                {c.pipeline.tags.map(t => <span key={t} style={{ fontSize:11, color:"#475569", background:"#f1f5f9", padding:"2px 6px", borderRadius:4, marginRight:4 }}>{t}</span>)}
              </div>
            )}
          </div>

          {/* Quick facts */}
          <div style={{ background:"white", border:"1px solid #e2e8f0", borderRadius:12, padding:20 }}>
            <h3 style={{ fontSize:14, fontWeight:700, color:"#0c2340", margin:"0 0 12px" }}>Quick Facts</h3>
            {[
              { icon: Building2, label:"Transaction type", value: c.transaction_type?.replace("_"," ") ?? "Unknown" },
              { icon: TrendingUp, label:"Revenue trend", value: c.revenue_trend ?? "Unknown" },
              { icon: Calendar, label:"First seen", value: new Date(c.first_seen_at).toLocaleDateString() },
              { icon: Globe, label:"Sources", value: `${c.source_count ?? 0} sources` },
            ].map(f => (
              <div key={f.label} style={{ display:"flex", alignItems:"center", gap:10, padding:"6px 0", borderBottom:"1px solid #f8fafc" }}>
                <f.icon size={14} style={{ color:"#94a3b8" }} />
                <span style={{ fontSize:12, color:"#94a3b8", width:120 }}>{f.label}</span>
                <span style={{ fontSize:13, color:"#0f172a", fontWeight:500 }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
