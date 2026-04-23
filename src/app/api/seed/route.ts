import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// POST /api/seed — seed initial sources into the database
export async function POST() {
  const sources = [
    { name: "Bolagsplatsen", url: "https://www.bolagsplatsen.se", domain: "bolagsplatsen.se", category: "broker", trust_level: 4, priority: 5, crawl_frequency: "daily", keywords: ["industri", "tillverkning", "mekanisk", "cnc", "svets"], enabled: true },
    { name: "Konkurslistan", url: "https://www.konkurslistan.se", domain: "konkurslistan.se", category: "distress", trust_level: 5, priority: 5, crawl_frequency: "daily", enabled: true },
    { name: "Objektvision", url: "https://www.objektvision.se", domain: "objektvision.se", category: "broker", trust_level: 3, priority: 4, crawl_frequency: "daily", keywords: ["industri", "tillverkning"], enabled: true },
    { name: "Bolagsbron", url: "https://www.bolagsbron.se", domain: "bolagsbron.se", category: "broker", trust_level: 4, priority: 4, crawl_frequency: "daily", enabled: true },
    { name: "Ackordscentralen", url: "https://www.ackordscentralen.se", domain: "ackordscentralen.se", category: "legal", trust_level: 5, priority: 5, crawl_frequency: "daily", enabled: true },
    { name: "Carler", url: "https://www.carler.se", domain: "carler.se", category: "legal", trust_level: 4, priority: 4, crawl_frequency: "daily", enabled: true },
    { name: "Exitpartner", url: "https://exitpartner.se", domain: "exitpartner.se", category: "broker", trust_level: 4, priority: 3, crawl_frequency: "daily", keywords: ["överlåtelse", "försäljning"], enabled: true },
    { name: "Allabolag", url: "https://www.allabolag.se", domain: "allabolag.se", category: "data", trust_level: 5, priority: 2, crawl_frequency: "weekly", enabled: false },
  ];

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  await supabase.from("sources").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  const { data, error } = await supabase.from("sources").insert(sources).select();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, sources_seeded: data?.length ?? 0 });
}
