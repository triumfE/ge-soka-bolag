import { getSupabase } from "./supabase";
const sb = () => getSupabase();
import type { Company, Score, Signal, DealBrief, Pipeline, Source, CompanyWithScore, Notification } from "./types";

// ─── Sources ──────────────────────────────────────────────────
export async function getSources() {
  const { data } = await sb().from("sources").select("*").order("priority", { ascending: false });
  return (data ?? []) as Source[];
}
export async function getSource(id: string) {
  const { data } = await sb().from("sources").select("*").eq("id", id).single();
  return data as Source | null;
}
export async function upsertSource(s: Partial<Source>) {
  const { data } = await sb().from("sources").upsert(s).select().single();
  return data as Source;
}
export async function deleteSource(id: string) {
  await sb().from("sources").delete().eq("id", id);
}

// ─── Companies ────────────────────────────────────────────────
export async function getCompanies(filters?: {
  county?: string; sale_status?: string; min_revenue?: number;
  max_revenue?: number; search?: string; limit?: number;
}) {
  let q = sb().from("companies").select("*").is("merged_into_id", null).order("last_updated_at", { ascending: false });
  if (filters?.county) q = q.eq("county", filters.county);
  if (filters?.sale_status) q = q.eq("sale_status", filters.sale_status);
  if (filters?.min_revenue) q = q.gte("revenue_msek", filters.min_revenue);
  if (filters?.max_revenue) q = q.lte("revenue_msek", filters.max_revenue);
  if (filters?.search) q = q.ilike("name", `%${filters.search}%`);
  if (filters?.limit) q = q.limit(filters.limit);
  const { data } = await q;
  return (data ?? []) as Company[];
}

export async function getCompany(id: string) {
  const { data } = await sb().from("companies").select("*").eq("id", id).single();
  return data as Company | null;
}

export async function upsertCompany(c: Partial<Company>) {
  // Dedup by org_nr
  if (c.org_nr) {
    const { data: existing } = await sb().from("companies").select("id").eq("org_nr", c.org_nr).single();
    if (existing) {
      const { data } = await sb().from("companies").update({ ...c, last_updated_at: new Date().toISOString() }).eq("id", existing.id).select().single();
      return data as Company;
    }
  }
  const { data } = await sb().from("companies").insert(c).select().single();
  return data as Company;
}

// ─── Scores ───────────────────────────────────────────────────
export async function getScore(companyId: string) {
  const { data } = await sb().from("scores").select("*").eq("company_id", companyId).order("scored_at", { ascending: false }).limit(1).single();
  return data as Score | null;
}
export async function insertScore(s: Partial<Score>) {
  const { data } = await sb().from("scores").insert(s).select().single();
  return data as Score;
}

// ─── Signals ──────────────────────────────────────────────────
export async function getSignals(companyId: string) {
  const { data } = await sb().from("signals").select("*").eq("company_id", companyId).order("detected_at", { ascending: false });
  return (data ?? []) as Signal[];
}
export async function insertSignal(s: Partial<Signal>) {
  const { data } = await sb().from("signals").insert(s).select().single();
  return data as Signal;
}

// ─── Deal Briefs ──────────────────────────────────────────────
export async function getBrief(companyId: string) {
  const { data } = await sb().from("deal_briefs").select("*").eq("company_id", companyId).order("generated_at", { ascending: false }).limit(1).single();
  return data as DealBrief | null;
}
export async function insertBrief(b: Partial<DealBrief>) {
  const { data } = await sb().from("deal_briefs").insert(b).select().single();
  return data as DealBrief;
}

// ─── Pipeline ─────────────────────────────────────────────────
export async function getPipeline(companyId: string) {
  const { data } = await sb().from("pipeline").select("*").eq("company_id", companyId).single();
  return data as Pipeline | null;
}
export async function upsertPipeline(p: Partial<Pipeline>) {
  const { data } = await sb().from("pipeline").upsert(p, { onConflict: "company_id" }).select().single();
  return data as Pipeline;
}
export async function getPipelineCounts() {
  const { data } = await sb().from("pipeline").select("status");
  const counts: Record<string, number> = {};
  (data ?? []).forEach((p: { status: string }) => { counts[p.status] = (counts[p.status] || 0) + 1; });
  return counts;
}

// ─── Company with all relations ───────────────────────────────
export async function getCompanyFull(id: string): Promise<CompanyWithScore | null> {
  const company = await getCompany(id);
  if (!company) return null;
  const [score, pipeline, signals, brief] = await Promise.all([
    getScore(id), getPipeline(id), getSignals(id), getBrief(id),
  ]);
  const { count } = await sb().from("company_sources").select("*", { count: "exact", head: true }).eq("company_id", id);
  return { ...company, score: score ?? undefined, pipeline: pipeline ?? undefined, signals, brief: brief ?? undefined, source_count: count ?? 0 };
}

// ─── Dashboard ranked list ────────────────────────────────────
export async function getDashboardCompanies(limit = 20): Promise<CompanyWithScore[]> {
  const { data: scores } = await sb().from("scores").select("company_id, deal_priority").order("deal_priority", { ascending: false }).limit(limit);
  if (!scores?.length) {
    // Fallback: get latest companies if no scores yet
    const companies = await getCompanies({ limit });
    return companies.map(c => ({ ...c, source_count: 0 }));
  }
  const ids = scores.map(s => s.company_id);
  const results: CompanyWithScore[] = [];
  for (const id of ids) {
    const full = await getCompanyFull(id);
    if (full) results.push(full);
  }
  return results;
}

// ─── Crawl jobs ───────────────────────────────────────────────
export async function createCrawlJob(sourceId: string) {
  const { data } = await sb().from("crawl_jobs").insert({ source_id: sourceId, status: "running", started_at: new Date().toISOString() }).select().single();
  return data;
}
export async function completeCrawlJob(id: string, pagesFound: number, newItems: number, error?: string) {
  await sb().from("crawl_jobs").update({
    status: error ? "failed" : "completed",
    pages_found: pagesFound, new_items: newItems,
    error_message: error, completed_at: new Date().toISOString(),
  }).eq("id", id);
}

// ─── Raw content ──────────────────────────────────────────────
export async function upsertRawContent(sourceId: string, url: string, title: string, contentText: string, crawlJobId?: string) {
  const contentHash = simpleHash(contentText);
  const { data: existing } = await sb().from("raw_content").select("id, content_hash").eq("url_hash", simpleHash(url)).single();
  if (existing) {
    if (existing.content_hash === contentHash) return { id: existing.id, isNew: false };
    await sb().from("raw_content").update({ content_text: contentText, content_hash: contentHash, last_seen_at: new Date().toISOString() }).eq("id", existing.id);
    return { id: existing.id, isNew: false };
  }
  const { data } = await sb().from("raw_content").insert({
    source_id: sourceId, crawl_job_id: crawlJobId, url, title,
    content_text: contentText, content_hash: contentHash,
  }).select("id").single();
  return { id: data?.id, isNew: true };
}

// ─── Notifications ────────────────────────────────────────────
export async function getNotifications(limit = 20) {
  const { data } = await sb().from("notifications").select("*").order("created_at", { ascending: false }).limit(limit);
  return (data ?? []) as Notification[];
}
export async function createNotification(n: Partial<Notification>) {
  await sb().from("notifications").insert(n);
}

// ─── Stats ────────────────────────────────────────────────────
export async function getDashboardStats() {
  const [
    { count: totalCompanies },
    { count: newLast7 },
    { count: bankruptcies },
    { count: earlySignals },
  ] = await Promise.all([
    sb().from("companies").select("*", { count: "exact", head: true }).is("merged_into_id", null),
    sb().from("companies").select("*", { count: "exact", head: true }).gte("first_seen_at", new Date(Date.now() - 7 * 86400000).toISOString()),
    sb().from("companies").select("*", { count: "exact", head: true }).eq("sale_status", "bankruptcy"),
    sb().from("companies").select("*", { count: "exact", head: true }).eq("sale_status", "early_signal"),
  ]);
  const pipelineCounts = await getPipelineCounts();
  return { totalCompanies: totalCompanies ?? 0, newLast7: newLast7 ?? 0, bankruptcies: bankruptcies ?? 0, earlySignals: earlySignals ?? 0, pipelineCounts };
}

function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
  return hash.toString(36);
}
