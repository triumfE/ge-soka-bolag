import { BaseCrawler, type CrawlResult, type RawListing } from "./base";

export class BolagsbronCrawler extends BaseCrawler {
  constructor(sourceId: string) { super(sourceId, "https://www.bolagsbron.se"); }

  async crawl(): Promise<CrawlResult> {
    const listings: RawListing[] = [];
    const errors: string[] = [];
    let pagesCrawled = 0;

    try {
      const html = await this.fetchPage(`${this.baseUrl}/foretag-till-salu`);
      pagesCrawled++;
      const $ = this.parse(html);

      $("article, .listing-card, .ad-item, .company-card, .search-result").each((_, el) => {
        const $el = $(el);
        const title = this.cleanText($el.find("h2, h3, .title").first().text());
        const link = $el.find("a").first().attr("href");
        const rawText = this.cleanText($el.text());
        if (!title || !link) return;

        listings.push({
          title, url: link.startsWith("http") ? link : `${this.baseUrl}${link}`,
          description: this.cleanText($el.find("p, .desc").first().text()) || undefined,
          location: this.cleanText($el.find(".location, .region").first().text()) || undefined,
          revenue: this.extractRevenue(rawText), employees: this.extractEmployees(rawText),
          org_nr: this.extractOrgNr(rawText), status: "for_sale",
          raw_text: rawText.slice(0, 2000),
        });
      });
    } catch (e) {
      errors.push(`Bolagsbron: ${e instanceof Error ? e.message : String(e)}`);
    }
    return { source_id: this.sourceId, listings, pages_crawled: pagesCrawled, errors };
  }
}
