import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { classifyListing } from "@/lib/ai/classify";
import {
  crawlBolagsplatsenBrowser, crawlObjektvisionBrowser,
  crawlBolagsbronBrowser, crawlKonkurslistanBrowser, closeBrowser
} from "@/lib/crawler/browser";
import type { RawListing } from "@/lib/crawler/base";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function processListings(listings: RawListing[], sourceName: string) {
  const sb = getSupabase();
  let classified = 0;

  for (const listing of listings) {
    try {
      // Dedup check by URL
      const urlHash = listing.url.replace(/[^a-z0-9]/gi, "").slice(0, 50);
      const { data: existing } = await sb.from("raw_content").select("id").eq("url", listing.url).limit(1).single();
      if (existing) continue;

      // Store raw
      await sb.from("raw_content").insert({
        url: listing.url, title: listing.title,
        content_text: listing.raw_text, source_id: null,
      }).select("id").single().then(() => null, () => null);

      // AI classify
      const cls = await classifyListing(listing);
      if (!cls.is_relevant) continue;

      // Dedup by name + org_nr
      if (cls.org_nr) {
        const { data: dup } = await sb.from("companies").select("id").eq("org_nr", cls.org_nr).single();
        if (dup) continue;
      }
      const { data: nameDup } = await sb.from("companies").select("id").ilike("name", cls.name).single();
      if (nameDup) continue;

      const { data: company } = await sb.from("companies").insert({
        name: cls.name, org_nr: cls.org_nr, city: cls.city, county: cls.county,
        country: "Sweden", revenue_msek: cls.revenue_msek, employees: cls.employees,
        business_description: cls.business_description, industry_tags: cls.industry_tags,
        capabilities: cls.capabilities, owner_names: cls.owner_names,
        sale_status: cls.sale_status, transaction_type: cls.transaction_type,
      }).select("id").single();

      if (company) {
        const dp = Math.round(cls.strategic_fit * 0.3 + cls.transaction_probability * 0.25 + cls.improvement_potential * 0.2 + (100 - cls.risk_score) * 0.15 + 60 * 0.1);
        await sb.from("scores").insert({
          company_id: company.id, strategic_fit: cls.strategic_fit,
          transaction_probability: cls.transaction_probability,
          improvement_potential: cls.improvement_potential,
          risk_score: cls.risk_score, source_confidence: 70, deal_priority: dp,
          fit_reasons: cls.fit_reasons, risk_reasons: cls.risk_reasons,
          improvement_reasons: cls.improvement_reasons,
        });
        for (const sig of cls.signals) {
          await sb.from("signals").insert({
            company_id: company.id, signal_type: sig.type,
            description: sig.description, confidence: sig.confidence,
            source_url: listing.url,
          });
        }
        await sb.from("pipeline").upsert({ company_id: company.id, status: "new" }, { onConflict: "company_id" });
        classified++;
      }
    } catch { /* skip individual */ }
  }

  return classified;
}

export async function POST() {
  const results: { source: string; found: number; classified: number; error?: string }[] = [];

  // Run all browser crawlers
  const crawlers = [
    { name: "Bolagsplatsen (browser)", fn: crawlBolagsplatsenBrowser },
    { name: "Objektvision (browser)", fn: crawlObjektvisionBrowser },
    { name: "Bolagsbron (browser)", fn: crawlBolagsbronBrowser },
    { name: "Konkurslistan (browser)", fn: crawlKonkurslistanBrowser },
  ];

  for (const c of crawlers) {
    try {
      const listings = await c.fn();
      const classified = await processListings(listings, c.name);
      results.push({ source: c.name, found: listings.length, classified });
    } catch (e) {
      results.push({ source: c.name, found: 0, classified: 0, error: e instanceof Error ? e.message : String(e) });
    }
  }

  await closeBrowser();

  const total = results.reduce((n, r) => n + r.classified, 0);
  return NextResponse.json({ ok: true, total_classified: total, results });
}

// GET endpoint for cron jobs (Vercel Cron / external cron)
export async function GET(req: Request) {
  // Verify cron secret for security
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Delegate to POST
  return POST();
}
