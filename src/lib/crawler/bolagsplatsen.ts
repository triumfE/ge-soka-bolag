import { BaseCrawler, type CrawlResult, type RawListing } from "./base";

// Bolagsplatsen.se — Swedish business-for-sale marketplace
export class BolagsplatsenCrawler extends BaseCrawler {
  constructor(sourceId: string) {
    super(sourceId, "https://www.bolagsplatsen.se");
  }

  async crawl(): Promise<CrawlResult> {
    const listings: RawListing[] = [];
    const errors: string[] = [];
    let pagesCrawled = 0;

    // Industry-relevant search terms
    const searchTerms = ["industri", "tillverkning", "mekanisk", "cnc", "svets", "plåt", "verkstad"];

    for (const term of searchTerms) {
      try {
        const url = `${this.baseUrl}/foretag-till-salu?q=${encodeURIComponent(term)}`;
        const html = await this.fetchPage(url);
        pagesCrawled++;
        const $ = this.parse(html);

        // Extract listing cards — adapt selectors to actual site structure
        $(".listing-card, .ad-card, .search-result-item, article, .company-listing").each((_, el) => {
          const $el = $(el);
          const title = this.cleanText($el.find("h2, h3, .title, .listing-title").first().text());
          const link = $el.find("a").first().attr("href");
          const desc = this.cleanText($el.find(".description, .excerpt, p").first().text());
          const location = this.cleanText($el.find(".location, .region, .city").first().text());
          const rawText = this.cleanText($el.text());

          if (title && link) {
            listings.push({
              title,
              url: link.startsWith("http") ? link : `${this.baseUrl}${link}`,
              description: desc || undefined,
              location: location || undefined,
              revenue: this.extractRevenue(rawText),
              employees: this.extractEmployees(rawText),
              org_nr: this.extractOrgNr(rawText),
              status: "for_sale",
              raw_text: rawText.slice(0, 2000),
            });
          }
        });
      } catch (e) {
        errors.push(`Bolagsplatsen search "${term}": ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return { source_id: this.sourceId, listings: this.dedup(listings), pages_crawled: pagesCrawled, errors };
  }

  private dedup(listings: RawListing[]): RawListing[] {
    const seen = new Set<string>();
    return listings.filter(l => { if (seen.has(l.url)) return false; seen.add(l.url); return true; });
  }
}
