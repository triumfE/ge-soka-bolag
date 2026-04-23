import { BaseCrawler, type CrawlResult, type RawListing } from "./base";

// Objektvision.se — business & property sales
export class ObjektvisionCrawler extends BaseCrawler {
  constructor(sourceId: string) {
    super(sourceId, "https://www.objektvision.se");
  }

  async crawl(): Promise<CrawlResult> {
    const listings: RawListing[] = [];
    const errors: string[] = [];
    let pagesCrawled = 0;

    const urls = [
      `${this.baseUrl}/foretag-till-salu`,
      `${this.baseUrl}/foretag-till-salu?kategori=industri`,
      `${this.baseUrl}/foretag-till-salu?kategori=tillverkning`,
    ];

    for (const url of urls) {
      try {
        const html = await this.fetchPage(url);
        pagesCrawled++;
        const $ = this.parse(html);

        $(".object-card, .listing, article, .search-result").each((_, el) => {
          const $el = $(el);
          const title = this.cleanText($el.find("h2, h3, .title").first().text());
          const link = $el.find("a").first().attr("href");
          const desc = this.cleanText($el.find(".description, .text, p").first().text());
          const location = this.cleanText($el.find(".location, .area").first().text());
          const price = this.cleanText($el.find(".price, .pris").first().text());
          const rawText = this.cleanText($el.text());

          if (title && link) {
            listings.push({
              title,
              url: link.startsWith("http") ? link : `${this.baseUrl}${link}`,
              description: desc || undefined,
              location: location || undefined,
              asking_price: price || undefined,
              revenue: this.extractRevenue(rawText),
              employees: this.extractEmployees(rawText),
              org_nr: this.extractOrgNr(rawText),
              status: "for_sale",
              raw_text: rawText.slice(0, 2000),
            });
          }
        });
      } catch (e) {
        errors.push(`Objektvision ${url}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    const seen = new Set<string>();
    return { source_id: this.sourceId, listings: listings.filter(l => { if (seen.has(l.url)) return false; seen.add(l.url); return true; }), pages_crawled: pagesCrawled, errors };
  }
}
