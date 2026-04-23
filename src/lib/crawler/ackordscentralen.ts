import { BaseCrawler, type CrawlResult, type RawListing } from "./base";

// Ackordscentralen.se — insolvency and restructuring cases
export class AckordscentralenCrawler extends BaseCrawler {
  constructor(sourceId: string) {
    super(sourceId, "https://www.ackordscentralen.se");
  }

  async crawl(): Promise<CrawlResult> {
    const listings: RawListing[] = [];
    const errors: string[] = [];
    let pagesCrawled = 0;

    const urls = [
      `${this.baseUrl}/till-salu`,
      `${this.baseUrl}/aktuella-arenden`,
      `${this.baseUrl}/konkursbo-till-salu`,
    ];

    for (const url of urls) {
      try {
        const html = await this.fetchPage(url);
        pagesCrawled++;
        const $ = this.parse(html);

        $("article, .case-item, .listing, .sale-item, .post-item").each((_, el) => {
          const $el = $(el);
          const title = this.cleanText($el.find("h2, h3, .title, .entry-title").first().text());
          const link = $el.find("a").first().attr("href");
          const rawText = this.cleanText($el.text());
          const desc = this.cleanText($el.find(".excerpt, .description, p").first().text());

          const industrialKeywords = /industri|tillverk|mekanis|cnc|svets|plåt|metall|verkstad|bearbet|produktion|maskin|montage|laser/i;
          if (!title) return;

          const isIndustrial = industrialKeywords.test(rawText);
          const isDistress = /konkurs|rekonstruktion|likvidation|avveckl/i.test(rawText);

          if (isIndustrial || isDistress) {
            listings.push({
              title,
              url: link ? (link.startsWith("http") ? link : `${this.baseUrl}${link}`) : url,
              description: desc || undefined,
              location: this.extractLocation(rawText),
              org_nr: this.extractOrgNr(rawText),
              status: isDistress ? "bankruptcy" : "for_sale",
              raw_text: rawText.slice(0, 2000),
            });
          }
        });
      } catch (e) {
        errors.push(`Ackordscentralen ${url}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    return { source_id: this.sourceId, listings, pages_crawled: pagesCrawled, errors };
  }

  private extractLocation(text: string): string | undefined {
    const cities = ["Stockholm","Göteborg","Malmö","Karlstad","Borås","Halmstad","Trollhättan","Skövde","Örebro","Jönköping","Växjö","Linköping"];
    for (const c of cities) { if (text.includes(c)) return c; }
    return undefined;
  }
}
