import Anthropic from "@anthropic-ai/sdk";
import type { Company, Score } from "../types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface BriefResult {
  summary: string;
  why_match: string;
  why_available: string;
  strengths: string[];
  risks: string[];
  suggested_next_step: string;
}

export async function generateBrief(company: Company, score: Score): Promise<BriefResult> {
  const prompt = `You are an M&A analyst. Generate a concise deal brief for this industrial acquisition target.

COMPANY:
Name: ${company.name}
Location: ${company.city}, ${company.county}
Revenue: ${company.revenue_msek} MSEK
Employees: ${company.employees}
Description: ${company.business_description}
Industry: ${company.industry_tags?.join(", ")}
Capabilities: ${company.capabilities?.join(", ")}
Owners: ${company.owner_names?.join(", ") ?? "Unknown"}
Sale status: ${company.sale_status}
Revenue trend: ${company.revenue_trend}

SCORES:
Strategic Fit: ${score.strategic_fit}/100
Transaction Probability: ${score.transaction_probability}/100
Improvement Potential: ${score.improvement_potential}/100
Risk: ${score.risk_score}/100

Return ONLY valid JSON:
{
  "summary": "2-3 sentence executive summary",
  "why_match": "Why this matches the industrial acquisition thesis",
  "why_available": "Why this might become available / is available",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "risks": ["risk 1", "risk 2"],
  "suggested_next_step": "Concrete recommended action"
}`;

  const msg = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  const text = msg.content[0].type === "text" ? msg.content[0].text : "";
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in AI response");
  return JSON.parse(jsonMatch[0]) as BriefResult;
}
