import { NextResponse } from "next/server";
import * as cheerio from "cheerio";
import { getSupabase } from "@/lib/supabase";
import { classifyListing } from "@/lib/ai/classify";
import type { RawListing } from "@/lib/crawler/base";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Fetch page with error handling
async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120", "Accept-Language": "sv-SE,sv;q=0.9" },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    return res.text();
  } catch { return null; }
}

// Strategy 1: Bolagsplatsen direct search
async function searchBolagsplatsen(): Promise<RawListing[]> {
  const listings: RawListing[] = [];
  const terms = ["industri", "tillverkning", "verkstad", "cnc", "svets", "plåt", "montage", "bearbetning", "laser"];

  for (const term of terms) {
    for (const url of [
      `https://www.bolagsplatsen.se/foretag-till-salu?q=${term}`,
      `https://www.bolagsplatsen.se/till-salu?q=${term}`,
      `https://www.bolagsplatsen.se/search?q=${term}`,
      `https://bolagsplatsen.se/till-salu?bransch=industri`,
    ]) {
      const html = await fetchPage(url);
      if (!html) continue;
      const $ = cheerio.load(html);
      $("a").each((_, el) => {
        const href = $(el).attr("href") || "";
        const text = $(el).closest("div, article, li").text().replace(/\s+/g, " ").trim();
        const title = $(el).text().trim();
        if (title.length < 5 || text.length < 20) return;
        if (!/sälj|köp|överlåt|industri|tillverk|verkstad|företag till salu/i.test(text)) return;
        const fullUrl = href.startsWith("http") ? href : `https://www.bolagsplatsen.se${href}`;
        if (listings.some(l => l.url === fullUrl)) return;
        listings.push({ title: title.slice(0, 200), url: fullUrl, description: text.slice(0, 500), status: "for_sale", raw_text: text.slice(0, 2000) });
      });
    }
  }
  return listings;
}

// Strategy 2: Objektvision search
async function searchObjektvision(): Promise<RawListing[]> {
  const listings: RawListing[] = [];
  for (const url of [
    "https://objektvision.se/foretag-till-salu",
    "https://objektvision.se/företag-till-salu",
    "https://objektvision.se/till-salu/foretag",
    "https://www.objektvision.se/till-salu/foretag",
  ]) {
    const html = await fetchPage(url);
    if (!html) continue;
    const $ = cheerio.load(html);
    $("article, .listing, .object-card, .card, a[href*='foretag'], a[href*='företag']").each((_, el) => {
      const $el = $(el);
      const title = $el.find("h2, h3, .title").first().text().trim() || $el.text().trim().slice(0, 100);
      const link = $el.is("a") ? $el.attr("href") : $el.find("a").first().attr("href");
      if (!title || !link || title.length < 5) return;
      const rawText = $el.text().replace(/\s+/g, " ").trim();
      listings.push({ title, url: link.startsWith("http") ? link : `https://objektvision.se${link}`, description: rawText.slice(0, 500), status: "for_sale", raw_text: rawText.slice(0, 2000) });
    });
  }
  return listings;
}

// Strategy 3: Google-style search via DuckDuckGo HTML
async function searchDuckDuckGo(query: string): Promise<RawListing[]> {
  const listings: RawListing[] = [];
  const html = await fetchPage(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
  if (!html) return listings;
  const $ = cheerio.load(html);
  $(".result, .web-result").each((_, el) => {
    const $el = $(el);
    const title = $el.find(".result__title, .result__a, h2 a").first().text().trim();
    const link = $el.find("a").first().attr("href") || "";
    const snippet = $el.find(".result__snippet, .result__body").first().text().trim();
    if (!title || !link) return;
    listings.push({ title, url: link, description: snippet, status: "unknown", raw_text: `${title} ${snippet}`.slice(0, 2000) });
  });
  return listings;
}

export async function POST() {
  const sb = getSupabase();
  const allListings: RawListing[] = [];
  const sourceResults: { source: string; found: number }[] = [];

  // Run all search strategies
  const [bp, ov] = await Promise.all([searchBolagsplatsen(), searchObjektvision()]);
  sourceResults.push({ source: "Bolagsplatsen", found: bp.length });
  sourceResults.push({ source: "Objektvision", found: ov.length });
  allListings.push(...bp, ...ov);

  // DuckDuckGo searches for industrial companies for sale in Sweden
  const ddgQueries = [
    "företag till salu industri tillverkning Sverige 2026",
    "mekanisk verkstad till salu Sverige",
    "CNC företag säljes Sverige",
    "svetsföretag till salu Västra Götaland",
    "industriföretag konkurs Sverige 2026",
    "plåtföretag till salu Sverige",
    "underleverantör industri generationsskifte Sverige",
    "verkstadsföretag överlåtelse Värmland Halland",
  ];

  for (const q of ddgQueries) {
    const results = await searchDuckDuckGo(q);
    sourceResults.push({ source: `DDG: ${q.slice(0, 40)}`, found: results.length });
    allListings.push(...results);
  }

  // Dedup by URL
  const seen = new Set<string>();
  const unique = allListings.filter(l => { if (seen.has(l.url)) return false; seen.add(l.url); return true; });

  // Classify top results with AI
  let classified = 0;
  const maxClassify = 30; // Control API costs

  for (const listing of unique.slice(0, maxClassify)) {
    try {
      const cls = await classifyListing(listing);
      if (!cls.is_relevant) continue;

      // Check dedup
      if (cls.org_nr) {
        const { data: existing } = await sb.from("companies").select("id").eq("org_nr", cls.org_nr).single();
        if (existing) continue;
      }
      const { data: nameCheck } = await sb.from("companies").select("id").eq("name", cls.name).single();
      if (nameCheck) continue;

      const { data: company } = await sb.from("companies").insert({
        name: cls.name, org_nr: cls.org_nr, city: cls.city, county: cls.county,
        country: "Sweden", revenue_msek: cls.revenue_msek, employees: cls.employees,
        business_description: cls.business_description, industry_tags: cls.industry_tags,
        capabilities: cls.capabilities, owner_names: cls.owner_names,
        sale_status: cls.sale_status as string, transaction_type: cls.transaction_type,
      }).select("id").single();

      if (company) {
        const dp = Math.round(cls.strategic_fit * 0.3 + cls.transaction_probability * 0.25 + cls.improvement_potential * 0.2 + (100 - cls.risk_score) * 0.15 + 60 * 0.1);
        await sb.from("scores").insert({
          company_id: company.id, strategic_fit: cls.strategic_fit,
          transaction_probability: cls.transaction_probability,
          improvement_potential: cls.improvement_potential,
          risk_score: cls.risk_score, source_confidence: 50, deal_priority: dp,
          fit_reasons: cls.fit_reasons, risk_reasons: cls.risk_reasons,
          improvement_reasons: cls.improvement_reasons,
        });
        for (const sig of cls.signals) {
          await sb.from("signals").insert({ company_id: company.id, signal_type: sig.type, description: sig.description, confidence: sig.confidence, source_url: listing.url });
        }
        await sb.from("pipeline").upsert({ company_id: company.id, status: "new" }, { onConflict: "company_id" });
        classified++;
      }
    } catch { /* skip */ }
  }

  return NextResponse.json({
    ok: true,
    total_listings_found: unique.length,
    classified,
    sources: sourceResults.filter(s => s.found > 0),
  });
}
