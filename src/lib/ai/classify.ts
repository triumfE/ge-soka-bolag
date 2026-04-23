import Anthropic from "@anthropic-ai/sdk";
import type { RawListing } from "../crawler";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ClassificationResult {
  is_relevant: boolean;
  name: string;
  org_nr?: string;
  city?: string;
  county?: string;
  revenue_msek?: number;
  employees?: number;
  business_description: string;
  industry_tags: string[];
  capabilities: string[];
  sale_status: string;
  transaction_type?: string;
  owner_names?: string[];
  signals: { type: string; description: string; confidence: number }[];
  strategic_fit: number;
  transaction_probability: number;
  improvement_potential: number;
  risk_score: number;
  fit_reasons: string[];
  risk_reasons: string[];
  improvement_reasons: string[];
}

export async function classifyListing(listing: RawListing): Promise<ClassificationResult> {
  const prompt = `You are an M&A analyst specializing in Swedish industrial company acquisitions.

Analyze this company listing and return a JSON classification.

LISTING:
Title: ${listing.title}
URL: ${listing.url}
Description: ${listing.description ?? "N/A"}
Location: ${listing.location ?? "N/A"}
Revenue: ${listing.revenue ?? "N/A"}
Employees: ${listing.employees ?? "N/A"}
Org.nr: ${listing.org_nr ?? "N/A"}
Status: ${listing.status ?? "N/A"}
Full text: ${listing.raw_text.slice(0, 1500)}

TARGET PROFILE: Industrial companies in Sweden — CNC machining, welding, sheet metal, laser, metal products, assembly, precision machining, subcontractors, contract manufacturing. Revenue 5–100 MSEK, 3–50 employees. Priority regions: Värmland, Västra Götaland, Halland, Småland, Örebro.

Return ONLY valid JSON (no markdown, no explanation):
{
  "is_relevant": boolean,
  "name": "company name",
  "org_nr": "if found",
  "city": "if found",
  "county": "Swedish län if determinable",
  "revenue_msek": number or null,
  "employees": number or null,
  "business_description": "2-3 sentence description of what the company does",
  "industry_tags": ["CNC", "Welding", etc],
  "capabilities": ["5-axis CNC", "TIG welding", etc],
  "sale_status": "for_sale|bankruptcy|restructuring|early_signal|off_market|unknown",
  "transaction_type": "share_sale|asset_sale|bid_process|unknown",
  "owner_names": ["if found"],
  "signals": [{"type":"owner_retirement|succession_issue|declining_financials|weak_digital|phrase_match","description":"...","confidence":0-100}],
  "strategic_fit": 0-100,
  "transaction_probability": 0-100,
  "improvement_potential": 0-100,
  "risk_score": 0-100,
  "fit_reasons": ["reason1", "reason2"],
  "risk_reasons": ["reason1"],
  "improvement_reasons": ["reason1"]
}`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in AI response");
  return JSON.parse(jsonMatch[0]) as ClassificationResult;
}
