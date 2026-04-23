import { chromium, type Browser, type Page } from "playwright-core";
import * as cheerio from "cheerio";
import type { RawListing } from "./base";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
];

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!_browser || !_browser.isConnected()) {
    _browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-blink-features=AutomationControlled"],
    });
  }
  return _browser;
}

async function delay(min: number, max: number) {
  await new Promise(r => setTimeout(r, min + Math.random() * (max - min)));
}

async function stealthPage(browser: Browser): Promise<Page> {
  const ctx = await browser.newContext({
    userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    locale: "sv-SE",
    viewport: { width: 1920, height: 1080 },
    javaScriptEnabled: true,
  });
  const page = await ctx.newPage();
  // Override navigator.webdriver
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });
  return page;
}

export async function browserFetch(url: string, waitSelector?: string): Promise<string> {
  const browser = await getBrowser();
  const page = await stealthPage(browser);
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
    if (waitSelector) await page.waitForSelector(waitSelector, { timeout: 8000 }).catch(() => {});
    await delay(1000, 3000);
    return await page.content();
  } finally {
    await page.close();
  }
}

// ─── Bolagsplatsen (JS-rendered) ──────────────────────
export async function crawlBolagsplatsenBrowser(): Promise<RawListing[]> {
  const listings: RawListing[] = [];
  const browser = await getBrowser();
  const terms = ["industri", "tillverkning", "verkstad", "cnc", "svets", "plåt", "montage", "bearbetning", "metall", "laser"];
  const seen = new Set<string>();

  for (const term of terms) {
    const page = await stealthPage(browser);
    try {
      await page.goto(`https://www.bolagsplatsen.se/foretag-till-salu?q=${term}`, { waitUntil: "networkidle", timeout: 20000 });
      await delay(2000, 4000);
      const html = await page.content();
      const $ = cheerio.load(html);

      // Try multiple selector patterns
      $("a[href*='/annons'], a[href*='/foretag'], article a, .ad-card a, .listing a, .search-result a").each((_, el) => {
        const href = $(el).attr("href") || "";
        if (!href || href === "#" || href === "/") return;
        const fullUrl = href.startsWith("http") ? href : `https://www.bolagsplatsen.se${href}`;
        if (seen.has(fullUrl)) return;
        seen.add(fullUrl);

        const parent = $(el).closest("article, .card, .listing, div").first();
        const title = $(el).text().trim() || parent.find("h2, h3").first().text().trim();
        const rawText = parent.text().replace(/\s+/g, " ").trim();

        if (title.length < 5 || rawText.length < 20) return;

        listings.push({
          title: title.slice(0, 200), url: fullUrl,
          description: rawText.slice(0, 500), status: "for_sale",
          raw_text: rawText.slice(0, 2000),
          revenue: rawText.match(/([\d\s,]+)\s*(MSEK|mkr|tkr|kkr|omsättning)/i)?.[0],
          employees: rawText.match(/(\d+)\s*(anställda|medarbetare)/i)?.[1],
          location: rawText.match(/(Värmland|Västra Götaland|Halland|Örebro|Stockholm|Skåne|Småland|Dalarna|Göteborg|Karlstad|Borås|Halmstad|Jönköping)/i)?.[1],
        });
      });
    } catch { /* skip term */ }
    await page.close();
    await delay(1500, 3000); // Delay between searches
  }
  return listings;
}

// ─── Objektvision (JS-rendered) ───────────────────────
export async function crawlObjektvisionBrowser(): Promise<RawListing[]> {
  const listings: RawListing[] = [];
  const browser = await getBrowser();
  const seen = new Set<string>();
  const urls = [
    "https://objektvision.se/foretag-till-salu",
    "https://www.objektvision.se/foretag-till-salu",
    "https://objektvision.se/till-salu/foretag",
  ];

  for (const url of urls) {
    const page = await stealthPage(browser);
    try {
      await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });
      await delay(2000, 4000);
      // Scroll to load lazy content
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await delay(1500, 2500);
      const html = await page.content();
      const $ = cheerio.load(html);

      $("a[href*='foretag'], a[href*='företag'], article, .card, .listing, .object").each((_, el) => {
        const $el = $(el);
        const link = $el.is("a") ? $el.attr("href") : $el.find("a").first().attr("href");
        if (!link) return;
        const fullUrl = link.startsWith("http") ? link : `https://objektvision.se${link}`;
        if (seen.has(fullUrl)) return;
        seen.add(fullUrl);

        const title = $el.find("h2, h3, .title").first().text().trim() || $el.text().trim().slice(0, 100);
        const rawText = $el.text().replace(/\s+/g, " ").trim();
        if (title.length < 5) return;

        listings.push({
          title: title.slice(0, 200), url: fullUrl,
          description: rawText.slice(0, 500), status: "for_sale",
          raw_text: rawText.slice(0, 2000),
        });
      });
    } catch { /* skip url */ }
    await page.close();
    await delay(1500, 3000);
  }
  return listings;
}

// ─── Bolagsbron (JS-rendered) ─────────────────────────
export async function crawlBolagsbronBrowser(): Promise<RawListing[]> {
  const listings: RawListing[] = [];
  const browser = await getBrowser();
  const page = await stealthPage(browser);
  const seen = new Set<string>();

  try {
    await page.goto("https://www.bolagsbron.se/foretag-till-salu", { waitUntil: "networkidle", timeout: 20000 });
    await delay(2000, 4000);
    const html = await page.content();
    const $ = cheerio.load(html);

    $("a, article, .listing, .card").each((_, el) => {
      const $el = $(el);
      const link = $el.is("a") ? $el.attr("href") : $el.find("a").first().attr("href");
      if (!link) return;
      const fullUrl = link.startsWith("http") ? link : `https://www.bolagsbron.se${link}`;
      if (seen.has(fullUrl)) return;
      seen.add(fullUrl);

      const title = $el.find("h2, h3").first().text().trim() || $el.text().trim().slice(0, 100);
      const rawText = $el.text().replace(/\s+/g, " ").trim();
      if (title.length < 5 || !/sälj|köp|överlåt|företag|industri|verkstad|bolag/i.test(rawText)) return;

      listings.push({
        title: title.slice(0, 200), url: fullUrl,
        description: rawText.slice(0, 500), status: "for_sale",
        raw_text: rawText.slice(0, 2000),
      });
    });
  } catch { /* skip */ }
  await page.close();
  return listings;
}

// ─── Konkurslistan (JS-rendered) ──────────────────────
export async function crawlKonkurslistanBrowser(): Promise<RawListing[]> {
  const listings: RawListing[] = [];
  const browser = await getBrowser();
  const page = await stealthPage(browser);

  try {
    await page.goto("https://www.konkurslistan.se/alla-konkurser", { waitUntil: "networkidle", timeout: 20000 });
    await delay(2000, 4000);
    const html = await page.content();
    const $ = cheerio.load(html);

    $("tr, .bankruptcy-item, article, .list-item, .entry").each((_, el) => {
      const rawText = $(el).text().replace(/\s+/g, " ").trim();
      if (!/industri|tillverk|mekanis|cnc|svets|plåt|metall|verkstad|bearbet|produktion|maskin|montage|laser/i.test(rawText)) return;

      const title = $(el).find("td:first-child, h3, h2, .name").first().text().trim() || rawText.slice(0, 100);
      const link = $(el).find("a").first().attr("href");

      listings.push({
        title, url: link ? (link.startsWith("http") ? link : `https://www.konkurslistan.se${link}`) : "https://www.konkurslistan.se",
        description: rawText.slice(0, 500), status: "bankruptcy",
        org_nr: rawText.match(/(\d{6}-\d{4})/)?.[1],
        raw_text: rawText.slice(0, 2000),
      });
    });
  } catch { /* skip */ }
  await page.close();
  return listings;
}

export async function closeBrowser() {
  if (_browser) { await _browser.close(); _browser = null; }
}
