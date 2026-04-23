import { BaseCrawler, type CrawlResult, type RawListing } from "./base";

// Konkurslistan.se — Swedish bankruptcy listings
export class KonkurslistanCrawler extends BaseCrawler {
  constructor(sourceId: string) {
    super(sourceId, "https://www.konkurslistan.se");
  }

  async crawl(): Promise<CrawlResult> {
    const listings: RawListing[] = [];
    const errors: string[] = [];
    let pagesCrawled = 0;

    try {
      const html = await this.fetchPage(`${this.baseUrl}/alla-konkurser`);
      pagesCrawled++;
      const $ = this.parse(html);

      $("table tbody tr, .bankruptcy-item, .listing-row, article").each((_, el) => {
        const $el = $(el);
        const rawText = this.cleanText($el.text());
        const title = this.cleanText($el.find("td:first-child, .company-name, h3, h2").first().text());
        const link = $el.find("a").first().attr("href");

        // Filter for industrial companies
        const industrialKeywords = /industri|tillverk|mekanis|cnc|svets|plåt|metall|verkstad|bearbet|laser|montage|produktion|maskin/i;
        if (!title || !industrialKeywords.test(rawText)) return;

        listings.push({
          title,
          url: link ? (link.startsWith("http") ? link : `${this.baseUrl}${link}`) : `${this.baseUrl}/konkurser`,
          description: rawText.slice(0, 500),
          location: this.extractLocation(rawText),
          org_nr: this.extractOrgNr(rawText),
          status: "bankruptcy",
          raw_text: rawText.slice(0, 2000),
        });
      });
    } catch (e) {
      errors.push(`Konkurslistan: ${e instanceof Error ? e.message : String(e)}`);
    }

    return { source_id: this.sourceId, listings, pages_crawled: pagesCrawled, errors };
  }

  private extractLocation(text: string): string | undefined {
    const counties = ["Värmland", "Västra Götaland", "Halland", "Småland", "Örebro", "Skåne", "Stockholm", "Dalarna", "Gävleborg"];
    for (const c of counties) { if (text.includes(c)) return c; }
    return undefined;
  }
}
