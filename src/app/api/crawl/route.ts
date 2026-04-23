import { NextRequest, NextResponse } from "next/server";
import { getSources, getSource, createCrawlJob, completeCrawlJob, upsertRawContent, upsertCompany } from "@/lib/db";
import { getCrawler } from "@/lib/crawler";
import { classifyListing } from "@/lib/ai/classify";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// POST /api/crawl — run crawl for a source or all enabled sources
// Body: { source_id?: string } — omit for all
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const results: { source: string; listings: number; newCompanies: number; errors: string[] }[] = [];

  let sources;
  if (body.source_id) {
    const s = await getSource(body.source_id);
    sources = s ? [s] : [];
  } else {
    sources = (await getSources()).filter(s => s.enabled);
  }

  for (const source of sources) {
    const domain = source.domain || new URL(source.url).hostname;
    const crawler = getCrawler(source.id, domain);
    if (!crawler) {
      results.push({ source: source.name, listings: 0, newCompanies: 0, errors: [`No crawler adapter for ${domain}`] });
      continue;
    }

    const job = await createCrawlJob(source.id);
    let newCompanies = 0;

    try {
      const crawlResult = await crawler.crawl();

      for (const listing of crawlResult.listings) {
        // Store raw content
        const raw = await upsertRawContent(source.id, listing.url, listing.title, listing.raw_text, job.id);

        if (raw.isNew) {
          try {
            // AI classification
            const cls = await classifyListing(listing);
            if (!cls.is_relevant) continue;

            // Upsert company
            const company = await upsertCompany({
              name: cls.name,
              org_nr: cls.org_nr || listing.org_nr,
              city: cls.city || listing.location,
              county: cls.county,
              country: "Sweden",
              revenue_msek: cls.revenue_msek,
              employees: cls.employees,
              business_description: cls.business_description,
              industry_tags: cls.industry_tags,
              capabilities: cls.capabilities,
              owner_names: cls.owner_names,
              sale_status: cls.sale_status as "for_sale" | "bankruptcy" | "restructuring" | "early_signal" | "off_market" | "unknown",
              transaction_type: cls.transaction_type,
            });

            // Link company to source
            await getSupabase().from("company_sources").insert({
              company_id: company.id, source_id: source.id,
              raw_content_id: raw.id, source_url: listing.url,
            });

            // Insert score
            const dealPriority = Math.round((cls.strategic_fit * 0.3 + cls.transaction_probability * 0.25 + cls.improvement_potential * 0.2 + (100 - cls.risk_score) * 0.15 + 70 * 0.1));
            await getSupabase().from("scores").insert({
              company_id: company.id,
              strategic_fit: cls.strategic_fit,
              transaction_probability: cls.transaction_probability,
              improvement_potential: cls.improvement_potential,
              risk_score: cls.risk_score,
              source_confidence: source.trust_level * 20,
              deal_priority: dealPriority,
              fit_reasons: cls.fit_reasons,
              risk_reasons: cls.risk_reasons,
              improvement_reasons: cls.improvement_reasons,
            });

            // Insert signals
            for (const sig of cls.signals) {
              await getSupabase().from("signals").insert({
                company_id: company.id,
                signal_type: sig.type,
                description: sig.description,
                confidence: sig.confidence,
                source_url: listing.url,
              });
            }

            // Create pipeline entry
            await getSupabase().from("pipeline").upsert({
              company_id: company.id, status: "new",
            }, { onConflict: "company_id" });

            newCompanies++;
          } catch (aiErr) {
            crawlResult.errors.push(`AI classify error for "${listing.title}": ${aiErr instanceof Error ? aiErr.message : String(aiErr)}`);
          }
        }
      }

      await completeCrawlJob(job.id, crawlResult.pages_crawled, newCompanies);
      // Update source last_crawled_at
      await getSupabase().from("sources").update({ last_crawled_at: new Date().toISOString() }).eq("id", source.id);

      results.push({ source: source.name, listings: crawlResult.listings.length, newCompanies, errors: crawlResult.errors });
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e);
      await completeCrawlJob(job.id, 0, 0, errMsg);
      results.push({ source: source.name, listings: 0, newCompanies: 0, errors: [errMsg] });
    }
  }

  return NextResponse.json({ ok: true, results });
}
