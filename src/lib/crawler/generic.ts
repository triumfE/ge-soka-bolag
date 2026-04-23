import { BaseCrawler, type CrawlResult, type RawListing } from "./base";

// Generic crawler — works for any site by finding links and extracting text
export class GenericCrawler extends BaseCrawler {
  constructor(sourceId: string, baseUrl: string) {
    super(sourceId, baseUrl);
  }

  async crawl(): Promise<CrawlResult> {
    const listings: RawListing[] = [];
    const errors: string[] = [];
    let pagesCrawled = 0;

    // Try common paths for business sales / bankruptcy
    const paths = ["/", "/till-salu", "/foretag", "/aktuellt", "/nyheter", "/uppdrag", "/konkurs", "/foretag-till-salu", "/cases", "/sv/aktuellt"];
    const seen = new Set<string>();

    for (const path of paths) {
      const url = `${this.baseUrl}${path}`;
      try {
        const html = await this.fetchPage(url);
        pagesCrawled++;
        const $ = this.parse(html);

        $("article, .post, .listing, .card, .item, .case, .entry, .news-item, main a").each((_, el) => {
          const $el = $(el);
          const title = this.cleanText($el.find("h2, h3, h4, .title, .entry-title").first().text() || $el.text().slice(0, 100));
          const link = $el.is("a") ? $el.attr("href") : $el.find("a").first().attr("href");
          const rawText = this.cleanText($el.text());

          if (!title || title.length < 5 || !link) return;
          const fullUrl = link.startsWith("http") ? link : `${this.baseUrl}${link}`;
          if (seen.has(fullUrl)) return;
          seen.add(fullUrl);

          // Only include if it mentions sale/bankruptcy/company keywords
          const relevant = /konkurs|rekonstruktion|sälj|överlåt|till salu|anbuds|företag|bolag|industri|tillverk|verkstad/i.test(rawText);
          if (!relevant) return;

          listings.push({
            title: title.slice(0, 200),
            url: fullUrl,
            description: rawText.slice(0, 500),
            org_nr: this.extractOrgNr(rawText),
            status: /konkurs/i.test(rawText) ? "bankruptcy" : /rekonstruktion/i.test(rawText) ? "restructuring" : "for_sale",
            raw_text: rawText.slice(0, 2000),
          });
        });
      } catch {
        // Path not found — skip silently
      }
    }

    return { source_id: this.sourceId, listings, pages_crawled: pagesCrawled, errors };
  }
}
