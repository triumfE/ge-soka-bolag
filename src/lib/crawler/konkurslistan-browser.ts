import { chromium } from "playwright-core";
import type { RawListing } from "./base";

// Parse Konkurslistan.se/alla-konkurser with Playwright
// Extracts: org_nr, name, city, county, SNI, revenue, employees, assets
export async function crawlKonkurslistanFull(): Promise<RawListing[]> {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage({
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124",
    locale: "sv-SE",
  });

  const listings: RawListing[] = [];

  try {
    await page.goto("https://www.konkurslistan.se/alla-konkurser", { waitUntil: "networkidle", timeout: 30000 });
    await page.waitForTimeout(5000);

    // Scroll down to load more entries
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(2000);
    }

    // Extract structured data from each entry
    const entries = await page.evaluate(() => {
      const text = document.body.innerText;
      const results: { org_nr: string; name: string; city: string; county: string; sni: string; assets: string; revenue: string; employees: string; description: string }[] = [];

      // Pattern: org_nr\nName\nCity, Län\nVerksamhet (SNI)\ncode description\nTillgångar\namount\nOmsättning\namount\nAnställda\ncount
      const orgPattern = /(\d{6}-\d{4})\s*\n\s*([^\n]+)\s*\n\s*([^\n]*),\s*\n?\s*([^\n]*län)/g;
      let match;

      while ((match = orgPattern.exec(text)) !== null) {
        const startIdx = match.index;
        const chunk = text.slice(startIdx, startIdx + 500);

        const sniMatch = chunk.match(/(\d{5})\s+([^\n]+)/);
        const assetsMatch = chunk.match(/Tillgångar\s*\n?\s*([\d\s]+)/);
        const revenueMatch = chunk.match(/Omsättning\s*\n?\s*([\d\s]+)/);
        const employeesMatch = chunk.match(/Anställda\s*\n?\s*(\d+)/);
        const descMatch = chunk.match(/skall bedriva ([^\n.]+)/i);

        results.push({
          org_nr: match[1],
          name: match[2].trim(),
          city: match[3].trim(),
          county: match[4].trim(),
          sni: sniMatch ? `${sniMatch[1]} ${sniMatch[2]}` : "",
          assets: assetsMatch ? assetsMatch[1].trim() : "",
          revenue: revenueMatch ? revenueMatch[1].trim() : "",
          employees: employeesMatch ? employeesMatch[1] : "",
          description: descMatch ? descMatch[1].trim() : "",
        });
      }

      return results;
    });

    // Filter for industrial companies using SNI codes and keywords
    const industrialSNI = [
      "25", // Tillverkning av metallvaror
      "28", // Tillverkning av maskiner
      "24", // Stål- och metallframställning
      "22", // Tillverkning av gummi- och plastvaror
      "27", // Tillverkning av elapparatur
      "29", // Tillverkning av motorfordon
      "30", // Tillverkning av andra transportmedel
      "33", // Reparation och installation av maskiner
      "26", // Tillverkning av datorer och elektronik
      "31", // Tillverkning av möbler
      "32", // Annan tillverkning
      "23", // Tillverkning av andra icke-metalliska mineraliska produkter
    ];
    const industrialKeywords = /industri|tillverk|mekanis|cnc|svets|plåt|metall|verkstad|bearbet|produktion|maskin|montage|laser|slipning|fräs|dreh|gjut|smed|ytbehandl|pulver|konstruktion|komponent/i;

    for (const e of entries) {
      const sniCode = e.sni.slice(0, 2);
      const isIndustrial = industrialSNI.includes(sniCode) || industrialKeywords.test(e.name + " " + e.sni + " " + e.description);

      if (isIndustrial) {
        const revNum = parseInt(e.revenue.replace(/\s/g, "")) || 0;
        listings.push({
          title: e.name,
          url: `https://www.konkurslistan.se/alla-konkurser?q=${e.org_nr}`,
          description: `${e.sni}. ${e.description || e.name}. Tillgångar: ${e.assets} SEK, Omsättning: ${e.revenue} SEK${e.employees ? `, ${e.employees} anställda` : ""}.`,
          org_nr: e.org_nr,
          location: `${e.city}, ${e.county}`,
          revenue: revNum > 0 ? `${(revNum / 1000000).toFixed(1)} MSEK` : undefined,
          employees: e.employees || undefined,
          status: "bankruptcy",
          raw_text: `${e.org_nr} ${e.name} ${e.city} ${e.county} ${e.sni} Tillgångar: ${e.assets} Omsättning: ${e.revenue} Anställda: ${e.employees} ${e.description}`,
        });
      }
    }
  } catch (err) {
    console.error("Konkurslistan crawl error:", err);
  } finally {
    await browser.close();
  }

  return listings;
}
