"use client";

import type { Profile } from "@/types/database";

interface LaunchReadinessProps {
  profile: Profile;
  hasPublishedProduct: boolean;
}

const RING_R = 45;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R;

function progressOffset(percent: number) {
  return RING_CIRCUMFERENCE - (percent / 100) * RING_CIRCUMFERENCE;
}

export function LaunchReadiness({ profile, hasPublishedProduct }: LaunchReadinessProps) {
  const checks = [
    {
      label: "Store identity set",
      done: Boolean(profile.store_name && profile.store_name.length > 0),
      emoji: "🏪",
    },
    {
      label: "First product published",
      done: hasPublishedProduct,
      emoji: "📦",
    },
    {
      label: "Payout method configured",
      done: Boolean(profile.upi_id),
      emoji: "💳",
    },
    {
      label: "KYC verified",
      done: profile.kyc_status === "verified",
      emoji: "✅",
    },
  ];

  const doneCount = checks.filter((c) => c.done).length;
  const percent = Math.round((doneCount / checks.length) * 100);

  // Hide when fully complete
  if (percent === 100) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="font-semibold text-foreground mb-4">Launch readiness</h3>
      <div className="flex items-center gap-6">
        {/* SVG ring */}
        <div className="relative shrink-0 w-24 h-24">
          <svg viewBox="0 0 100 100" className="w-24 h-24 -rotate-90">
            {/* Track */}
            <circle
              cx="50" cy="50" r={RING_R}
              fill="none"
              stroke="var(--border)"
              strokeWidth="8"
            />
            {/* Progress */}
            <circle
              cx="50" cy="50" r={RING_R}
              fill="none"
              stroke="#f59e0b"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={RING_CIRCUMFERENCE}
              strokeDashoffset={progressOffset(percent)}
              style={{ transition: "stroke-dashoffset 600ms ease" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-foreground">{percent}%</span>
            <span className="text-[10px] text-muted-foreground">ready</span>
          </div>
        </div>

        {/* Checklist */}
        <div className="flex-1 space-y-2">
          {checks.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[10px] ${
                  item.done
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground border border-border"
                }`}
              >
                {item.done ? "✓" : ""}
              </div>
              <span
                className={`text-sm ${
                  item.done ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {item.emoji} {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
