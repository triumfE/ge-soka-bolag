import { BaseCrawler, type CrawlResult, type RawListing } from "./base";

export class CarlerCrawler extends BaseCrawler {
  constructor(sourceId: string) { super(sourceId, "https://www.carler.se"); }

  async crawl(): Promise<CrawlResult> {
    const listings: RawListing[] = [];
    const errors: string[] = [];
    let pagesCrawled = 0;

    const urls = [`${this.baseUrl}/aktuellt`, `${this.baseUrl}/till-salu`, `${this.baseUrl}/uppdrag`];
    for (const url of urls) {
      try {
        const html = await this.fetchPage(url);
        pagesCrawled++;
        const $ = this.parse(html);

        $("article, .case-card, .news-item, .post").each((_, el) => {
          const $el = $(el);
          const title = this.cleanText($el.find("h2, h3, .title").first().text());
          const link = $el.find("a").first().attr("href");
          const rawText = this.cleanText($el.text());
          if (!title) return;

          const distress = /konkurs|rekonstruktion|avveckl|obestånd|konkursbo|anbudsunderlag|försäljning|överlåtelse/i.test(rawText);
          if (!distress) return;

          listings.push({
            title, url: link ? (link.startsWith("http") ? link : `${this.baseUrl}${link}`) : url,
            description: this.cleanText($el.find("p, .excerpt").first().text()) || undefined,
            org_nr: this.extractOrgNr(rawText),
            status: distress ? "restructuring" : "for_sale",
            raw_text: rawText.slice(0, 2000),
          });
        });
      } catch (e) {
        errors.push(`Carler ${url}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    return { source_id: this.sourceId, listings, pages_crawled: pagesCrawled, errors };
  }
}
