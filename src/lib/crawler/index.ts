import { BaseCrawler, type CrawlResult, type RawListing } from "./base";
import { BolagsplatsenCrawler } from "./bolagsplatsen";
import { KonkurslistanCrawler } from "./konkurslistan";
import { ObjektvisionCrawler } from "./objektvision";
import { AckordscentralenCrawler } from "./ackordscentralen";
import { BolagsbronCrawler } from "./bolagsbron";
import { CarlerCrawler } from "./carler";
import { GenericCrawler } from "./generic";

const crawlerMap: Record<string, new (sourceId: string) => BaseCrawler> = {
  "bolagsplatsen.se": BolagsplatsenCrawler,
  "konkurslistan.se": KonkurslistanCrawler,
  "objektvision.se": ObjektvisionCrawler,
  "ackordscentralen.se": AckordscentralenCrawler,
  "bolagsbron.se": BolagsbronCrawler,
  "carler.se": CarlerCrawler,
};

export function getCrawler(sourceId: string, domain: string, baseUrl?: string): BaseCrawler {
  const key = Object.keys(crawlerMap).find(k => domain.includes(k));
  if (key) return new crawlerMap[key](sourceId);
  // Fallback to generic crawler
  return new GenericCrawler(sourceId, baseUrl || `https://${domain}`);
}

export type { CrawlResult, RawListing };
