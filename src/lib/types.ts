// Core entity types

export type SaleStatus = "for_sale" | "distressed" | "bankruptcy" | "restructuring" | "early_signal" | "off_market" | "unknown";
export type PipelineStatus = "new" | "monitoring" | "interesting" | "contacted" | "under_review" | "deprioritized" | "not_relevant" | "high_priority";
export type SourceCategory = "broker" | "legal" | "distress" | "data" | "news" | "signal" | "custom";
export type SignalType = "owner_retirement" | "succession_issue" | "declining_financials" | "board_change" | "stale_website" | "low_social" | "property_sale" | "restructuring_notice" | "weak_digital" | "phrase_match" | "multiple_source_hits";

export interface Company {
  id: string;
  name: string;
  org_nr?: string;
  website?: string;
  city?: string;
  municipality?: string;
  county?: string;
  country: string;
  revenue_msek?: number;
  employees?: number;
  business_description?: string;
  industry_tags?: string[];
  capabilities?: string[];
  owner_names?: string[];
  founded_year?: number;
  owner_age_estimate?: number;
  revenue_trend?: string;
  sale_status: SaleStatus;
  transaction_type?: string;
  first_seen_at: string;
  last_updated_at: string;
}

export interface Score {
  id: string;
  company_id: string;
  strategic_fit: number;
  transaction_probability: number;
  improvement_potential: number;
  risk_score: number;
  source_confidence: number;
  deal_priority: number;
  fit_reasons?: string[];
  risk_reasons?: string[];
  improvement_reasons?: string[];
  scored_at: string;
}

export interface Signal {
  id: string;
  company_id: string;
  signal_type: SignalType;
  description?: string;
  confidence: number;
  source_url?: string;
  detected_at: string;
}

export interface DealBrief {
  id: string;
  company_id: string;
  summary?: string;
  why_match?: string;
  why_available?: string;
  strengths?: string[];
  risks?: string[];
  suggested_next_step?: string;
  generated_at: string;
}

export interface Pipeline {
  id: string;
  company_id: string;
  status: PipelineStatus;
  notes?: string;
  tags?: string[];
  watchlist: boolean;
  user_override_score?: number;
}

export interface Source {
  id: string;
  name: string;
  url: string;
  domain?: string;
  category: SourceCategory;
  trust_level: number;
  priority: number;
  crawl_frequency: string;
  keywords?: string[];
  enabled: boolean;
  last_crawled_at?: string;
}

export interface Notification {
  id: string;
  company_id?: string;
  type: string;
  title: string;
  body?: string;
  read: boolean;
  created_at: string;
}

// Joined view for dashboard
export interface CompanyWithScore extends Company {
  score?: Score;
  pipeline?: Pipeline;
  signals?: Signal[];
  brief?: DealBrief;
  source_count?: number;
}
