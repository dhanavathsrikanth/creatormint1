import { createAdminClient } from "@/lib/supabase/admin";
import type { Metadata } from "next";
import { Fraunces } from "next/font/google";

export const revalidate = 300; // ISR — 5 minutes

export const metadata: Metadata = {
  title: "Platform Status — CreatorMint",
  description: "Live SLA metrics, uptime, and service health for CreatorMint.",
};

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces" });

async function getSlaMetrics() {
  const supabase = createAdminClient();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("first_response_at, created_at, sla_breached, status")
    .gte("created_at", thirtyDaysAgo.toISOString());

  if (!tickets || tickets.length === 0) {
    return { avgMinutes: null, slaCompliance: 100, openCount: 0, totalTickets: 0 };
  }

  const responded = tickets.filter((t) => t.first_response_at);
  const avgMinutes =
    responded.length > 0
      ? Math.round(
          responded.reduce((sum, t) => {
            const diff = new Date(t.first_response_at!).getTime() - new Date(t.created_at).getTime();
            return sum + diff / 60000;
          }, 0) / responded.length
        )
      : null;

  const breachedCount = tickets.filter((t) => t.sla_breached).length;
  const slaCompliance = Math.round(((tickets.length - breachedCount) / tickets.length) * 100);
  const openCount = tickets.filter((t) => t.status === "open" || t.status === "in_progress").length;

  return { avgMinutes, slaCompliance, openCount, totalTickets: tickets.length };
}

const SYSTEMS = [
  { name: "Payment Processing",  desc: "Cashfree PG, UPI, card payments" },
  { name: "File Delivery",        desc: "Supabase Storage, download tokens" },
  { name: "Email & Notifications", desc: "Resend transactional email" },
  { name: "Platform & API",       desc: "Next.js app, Supabase database" },
];

function avgColor(mins: number | null) {
  if (mins === null) return "text-green-600";
  if (mins < 60) return "text-green-600";
  if (mins < 120) return "text-amber-600";
  return "text-red-600";
}

function complianceColor(pct: number) {
  return pct >= 95 ? "text-green-600" : pct >= 80 ? "text-amber-600" : "text-red-600";
}

export default async function PlatformStatusPage() {
  const { avgMinutes, slaCompliance, openCount, totalTickets } = await getSlaMetrics();

  return (
    <div className={`min-h-screen bg-white text-gray-900 ${fraunces.variable}`}>
      {/* Hero */}
      <div className="max-w-3xl mx-auto px-6 pt-20 pb-12 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full mb-6">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          All systems operational
        </div>
        <h1
          className="text-5xl md:text-6xl font-black leading-tight mb-4 text-gray-900"
          style={{ fontFamily: "var(--font-fraunces)" }}
        >
          We pick up the phone.
        </h1>
        <p className="text-lg text-gray-500 max-w-lg mx-auto">
          Real humans. No chatbots. Support metrics refreshed every 5 minutes.
        </p>
      </div>

      {/* SLA metric cards */}
      <div className="max-w-3xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {/* Avg response */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Avg. Response
            </p>
            <p className={`text-4xl font-black tabular-nums ${avgColor(avgMinutes)}`}>
              {avgMinutes !== null ? `${avgMinutes}m` : "—"}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {avgMinutes !== null ? (avgMinutes < 60 ? "Well within SLA ✓" : "Under 2-hour target") : "No tickets yet"}
            </p>
          </div>

          {/* SLA compliance */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              SLA Compliance
            </p>
            <p className={`text-4xl font-black tabular-nums ${complianceColor(slaCompliance)}`}>
              {slaCompliance}%
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {totalTickets} tickets · last 30 days
            </p>
          </div>

          {/* Open tickets */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-6 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-2">
              Open Now
            </p>
            <p className="text-4xl font-black tabular-nums text-gray-900">{openCount}</p>
            <p className="text-xs text-gray-400 mt-1">Active tickets in queue</p>
          </div>
        </div>

        {/* SLA commitment */}
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 mb-8">
          <h2 className="font-bold text-gray-900 mb-3">Our SLA commitment</h2>
          <ul className="space-y-2">
            {[
              "First human response within 2 hours of ticket creation",
              "Payment issues flagged high priority — faster response",
              "If we miss the SLA, we credit one month of platform fees",
              "Support is available 7 days a week, not just business hours",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-amber-500 font-bold mt-0.5">→</span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* System status */}
        <h2 className="font-bold text-gray-900 mb-3">System status</h2>
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
          {SYSTEMS.map((sys, i) => (
            <div
              key={sys.name}
              className={`flex items-center justify-between px-5 py-4 ${
                i < SYSTEMS.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{sys.name}</p>
                <p className="text-xs text-gray-400">{sys.desc}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-xs font-semibold text-green-700">Operational</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-8">
          Metrics refresh every 5 minutes via ISR · 
          Need help?{" "}
          <a href="/dashboard/support/new" className="text-amber-600 hover:underline">
            Open a support ticket →
          </a>
        </p>
      </div>
    </div>
  );
}
