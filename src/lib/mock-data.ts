import { CompanyWithScore, Source } from "./types";

export const mockCompanies: CompanyWithScore[] = [
  {
    id: "1", name: "Westermo Mekaniska AB", org_nr: "556123-4567", website: "westermomek.se",
    city: "Karlstad", county: "Värmland", country: "Sweden",
    revenue_msek: 28, employees: 18, business_description: "CNC-bearbetning och svetsning av industriella komponenter. Underleverantör till fordon och energi.",
    industry_tags: ["CNC", "Welding", "Subcontractor"], capabilities: ["5-axis CNC", "TIG welding", "Assembly"],
    owner_names: ["Lars Eriksson (68 år)"], founded_year: 1992, owner_age_estimate: 68,
    revenue_trend: "stable", sale_status: "early_signal", transaction_type: "unknown",
    first_seen_at: "2026-04-10", last_updated_at: "2026-04-22",
    score: {
      id: "s1", company_id: "1", strategic_fit: 92, transaction_probability: 75,
      improvement_potential: 80, risk_score: 25, source_confidence: 70, deal_priority: 88,
      fit_reasons: ["Core CNC capabilities", "Right geography (Värmland)", "Revenue in sweet spot 28 MSEK"],
      risk_reasons: ["Single owner dependency", "No succession plan identified"],
      improvement_reasons: ["Low digital presence — room for commercial growth", "Underutilized 5-axis capacity"],
      scored_at: "2026-04-22"
    },
    pipeline: { id: "p1", company_id: "1", status: "interesting", watchlist: true, tags: ["CNC", "succession"] },
    signals: [
      { id: "sig1", company_id: "1", signal_type: "owner_retirement", description: "Owner Lars Eriksson is 68, no successor identified", confidence: 85, detected_at: "2026-04-15" },
      { id: "sig2", company_id: "1", signal_type: "stale_website", description: "Website last updated 2023, no social media activity", confidence: 70, detected_at: "2026-04-12" },
    ],
    brief: {
      id: "b1", company_id: "1",
      summary: "Well-established CNC subcontractor in Karlstad with strong industrial customer base. Owner approaching retirement with no clear successor.",
      why_match: "Core industrial machining — perfect fit for buy-and-build platform in Värmland region.",
      why_available: "Owner is 68 with no identified successor. Website stale since 2023 signals reduced commercial ambition.",
      strengths: ["Stable revenue 28 MSEK", "18 skilled employees", "5-axis CNC capability", "Long-term customer relationships"],
      risks: ["Key-person dependency on owner", "Aging machine park needs investment", "No digital sales channel"],
      suggested_next_step: "Reach out via local industry network. Position as continuation opportunity.",
      generated_at: "2026-04-22"
    },
    source_count: 3
  },
  {
    id: "2", name: "Götaplåt Industri AB", org_nr: "556234-5678",
    city: "Borås", county: "Västra Götaland", country: "Sweden",
    revenue_msek: 42, employees: 32, business_description: "Plåtbearbetning, laserskärning och svetsning. Tillverkar kompletta produkter för fordonsindustri.",
    industry_tags: ["Sheet metal", "Laser cutting", "Welding", "Assembly"],
    capabilities: ["Fiber laser 6kW", "CNC press brake", "Robot welding", "Powder coating"],
    owner_names: ["Familjen Andersson"], founded_year: 1985, owner_age_estimate: 72,
    revenue_trend: "declining", sale_status: "for_sale", transaction_type: "share_sale",
    first_seen_at: "2026-04-05", last_updated_at: "2026-04-21",
    score: {
      id: "s2", company_id: "2", strategic_fit: 88, transaction_probability: 95,
      improvement_potential: 85, risk_score: 35, source_confidence: 95, deal_priority: 92,
      fit_reasons: ["Sheet metal + laser — high-demand capability", "32 employees — operational scale", "Listed on Bolagsplatsen"],
      risk_reasons: ["Declining revenue trend", "Key automotive customer concentration"],
      improvement_reasons: ["Commercial underperformance", "Add-on acquisition potential", "Cross-sell with CNC platform"],
      scored_at: "2026-04-21"
    },
    pipeline: { id: "p2", company_id: "2", status: "high_priority", watchlist: true, tags: ["sheet metal", "for sale", "VGR"] },
    signals: [
      { id: "sig3", company_id: "2", signal_type: "owner_retirement", description: "Family-owned since 1985, owners in 70s", confidence: 90, detected_at: "2026-04-05" },
    ],
    source_count: 2
  },
  {
    id: "3", name: "Skaraborgs Svets & Montage AB", org_nr: "556345-6789",
    city: "Skövde", county: "Västra Götaland", country: "Sweden",
    revenue_msek: 15, employees: 11, business_description: "Svetsning, montage och mekanisk bearbetning. Specialisering på tryckkärl och rostfritt.",
    industry_tags: ["Welding", "Assembly", "Pressure vessels", "Stainless steel"],
    capabilities: ["TIG", "MIG/MAG", "Pressure vessel certified", "EN 1090"],
    founded_year: 2001, revenue_trend: "stable", sale_status: "off_market",
    first_seen_at: "2026-04-18", last_updated_at: "2026-04-22",
    score: {
      id: "s3", company_id: "3", strategic_fit: 72, transaction_probability: 30,
      improvement_potential: 65, risk_score: 20, source_confidence: 45, deal_priority: 55,
      fit_reasons: ["Welding + pressure vessel niche", "EN 1090 certification valuable"],
      risk_reasons: ["Not for sale — off-market only", "Low revenue 15 MSEK"],
      improvement_reasons: ["Could benefit from commercial support", "Add-on to larger platform"],
      scored_at: "2026-04-22"
    },
    pipeline: { id: "p3", company_id: "3", status: "monitoring", watchlist: false, tags: ["welding", "off-market"] },
    signals: [
      { id: "sig4", company_id: "3", signal_type: "weak_digital", description: "No website found, only Eniro listing", confidence: 80, detected_at: "2026-04-18" },
    ],
    source_count: 1
  },
  {
    id: "4", name: "Precisionsverktyg i Halmstad AB", org_nr: "556456-7890",
    city: "Halmstad", county: "Halland", country: "Sweden",
    revenue_msek: 65, employees: 45, business_description: "Precisionsbearbetning, verktyg och prototyper. ISO 9001 & ISO 14001. Leverantör till försvar och medicinteknik.",
    industry_tags: ["Precision machining", "Tooling", "Prototypes", "Defence"],
    capabilities: ["Multi-axis CNC", "EDM", "Grinding", "CMM inspection"],
    owner_names: ["Investment AB Halland (holdingbolag)"], founded_year: 1978,
    revenue_trend: "growing", sale_status: "unknown",
    first_seen_at: "2026-03-28", last_updated_at: "2026-04-20",
    score: {
      id: "s4", company_id: "4", strategic_fit: 95, transaction_probability: 40,
      improvement_potential: 60, risk_score: 15, source_confidence: 60, deal_priority: 72,
      fit_reasons: ["Premium precision machining", "Defence + medtech customer base", "ISO certified", "45 employees — real scale"],
      risk_reasons: ["Holding company ownership — may not want to sell", "Higher price expectation"],
      improvement_reasons: ["Could expand capacity", "Add sheet metal/welding to offering"],
      scored_at: "2026-04-20"
    },
    pipeline: { id: "p4", company_id: "4", status: "monitoring", watchlist: true, tags: ["precision", "scale", "Halland"] },
    signals: [],
    source_count: 4
  },
  {
    id: "5", name: "Konkursbo: Metallix Produktion AB", org_nr: "556567-8901",
    city: "Trollhättan", county: "Västra Götaland", country: "Sweden",
    revenue_msek: 8, employees: 0, business_description: "F.d. metallproduktion och ytbehandling. Konkurs dec 2025. Maskinpark och fastighet till salu.",
    industry_tags: ["Metal production", "Surface treatment"],
    capabilities: ["Galvanizing", "Powder coating", "Sandblasting"],
    revenue_trend: "declining", sale_status: "bankruptcy", transaction_type: "asset_sale",
    first_seen_at: "2026-01-15", last_updated_at: "2026-04-19",
    score: {
      id: "s5", company_id: "5", strategic_fit: 55, transaction_probability: 90,
      improvement_potential: 70, risk_score: 60, source_confidence: 95, deal_priority: 65,
      fit_reasons: ["Surface treatment capability complements machining", "Asset sale — potentially low price"],
      risk_reasons: ["Bankruptcy — unknown liabilities", "No employees remaining", "Equipment condition unknown"],
      improvement_reasons: ["Restart with new management", "Integrate into platform as coating capacity"],
      scored_at: "2026-04-19"
    },
    pipeline: { id: "p5", company_id: "5", status: "under_review", watchlist: false, tags: ["bankruptcy", "asset sale"] },
    signals: [
      { id: "sig5", company_id: "5", signal_type: "restructuring_notice", description: "Bankruptcy filed Dec 2025. Assets being marketed via Ackordscentralen.", confidence: 100, detected_at: "2026-01-15" },
    ],
    source_count: 2
  },
];

export const mockSources: Source[] = [
  { id: "s1", name: "Bolagsplatsen", url: "https://bolagsplatsen.se", domain: "bolagsplatsen.se", category: "broker", trust_level: 4, priority: 5, crawl_frequency: "daily", keywords: ["industri", "tillverkning", "mekanisk"], enabled: true, last_crawled_at: "2026-04-22T08:00:00Z" },
  { id: "s2", name: "Ackordscentralen", url: "https://ackordscentralen.se", domain: "ackordscentralen.se", category: "legal", trust_level: 5, priority: 5, crawl_frequency: "daily", keywords: ["konkurs", "rekonstruktion"], enabled: true, last_crawled_at: "2026-04-22T06:00:00Z" },
  { id: "s3", name: "Allabolag", url: "https://allabolag.se", domain: "allabolag.se", category: "data", trust_level: 5, priority: 3, crawl_frequency: "weekly", enabled: true, last_crawled_at: "2026-04-20T10:00:00Z" },
  { id: "s4", name: "Exitpartner", url: "https://exitpartner.se", domain: "exitpartner.se", category: "broker", trust_level: 4, priority: 4, crawl_frequency: "daily", keywords: ["överlåtelse", "försäljning"], enabled: true },
  { id: "s5", name: "Objektvision", url: "https://objektvision.se", domain: "objektvision.se", category: "broker", trust_level: 3, priority: 3, crawl_frequency: "daily", enabled: true },
  { id: "s6", name: "Konkurslistan", url: "https://konkurslistan.se", domain: "konkurslistan.se", category: "distress", trust_level: 5, priority: 5, crawl_frequency: "daily", enabled: true },
  { id: "s7", name: "Lokaltidningen Värmland", url: "https://vt.se", domain: "vt.se", category: "news", trust_level: 3, priority: 2, crawl_frequency: "daily", keywords: ["företag", "säljer", "pension", "generationsskifte"], enabled: true },
];
