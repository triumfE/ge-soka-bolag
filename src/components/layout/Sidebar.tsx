"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, GitPullRequest, Globe, Building2, Bell, Settings, Search } from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pipeline", label: "Pipeline", icon: GitPullRequest },
  { href: "/sources", label: "Sources", icon: Globe },
  { href: "/company", label: "Companies", icon: Building2 },
];

export default function Sidebar() {
  const path = usePathname();
  return (
    <aside style={{ width: 220, background: "#0c1829", minHeight: "100vh", padding: "20px 0", display: "flex", flexDirection: "column" }}>
      <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 24px", textDecoration: "none" }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: "#0070f3", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Search size={16} style={{ color: "white" }} />
        </div>
        <div>
          <div style={{ color: "white", fontWeight: 700, fontSize: 14, lineHeight: 1 }}>GE Söka Bolag</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 10 }}>Deal Sourcing</div>
        </div>
      </Link>

      <nav style={{ flex: 1 }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href);
          return (
            <Link key={href} href={href} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "10px 20px",
              color: active ? "white" : "rgba(255,255,255,0.5)", textDecoration: "none",
              background: active ? "rgba(255,255,255,0.08)" : "transparent",
              borderLeft: active ? "3px solid #0070f3" : "3px solid transparent",
              fontSize: 13, fontWeight: active ? 600 : 400,
            }}>
              <Icon size={16} /> {label}
            </Link>
          );
        })}
      </nav>

      <div style={{ padding: "0 20px" }}>
        <Link href="/dashboard" style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 12, padding: "8px 0" }}>
          <Settings size={14} /> Settings
        </Link>
      </div>
    </aside>
  );
}
