import * as cheerio from "cheerio";

export interface RawListing {
  title: string;
  url: string;
  description?: string;
  location?: string;
  revenue?: string;
  employees?: string;
  asking_price?: string;
  industry?: string;
  status?: string; // for_sale | bankruptcy | restructuring
  org_nr?: string;
  raw_text: string;
}

export interface CrawlResult {
  source_id: string;
  listings: RawListing[];
  pages_crawled: number;
  errors: string[];
}

export abstract class BaseCrawler {
  constructor(public sourceId: string, public baseUrl: string) {}

  abstract crawl(): Promise<CrawlResult>;

  protected async fetchPage(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "sv-SE,sv;q=0.9,en;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  }

  protected parse(html: string) {
    return cheerio.load(html);
  }

  protected extractOrgNr(text: string): string | undefined {
    const match = text.match(/\b(\d{6}[-–]?\d{4})\b/);
    return match ? match[1].replace("–", "-") : undefined;
  }

  protected extractRevenue(text: string): string | undefined {
    const match = text.match(/(\d[\d\s,\.]*)\s*(MSEK|KSEK|mkr|tkr|miljoner)/i);
    return match ? match[0] : undefined;
  }

  protected extractEmployees(text: string): string | undefined {
    const match = text.match(/(\d+)\s*(anställda|medarbetare|employees|pers)/i);
    return match ? match[1] : undefined;
  }

  protected cleanText(text: string): string {
    return text.replace(/\s+/g, " ").trim();
  }
}
