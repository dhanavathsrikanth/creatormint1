import { ShieldCheck, Receipt, RefreshCcw, Headphones } from "lucide-react";

const BADGES = [
  { icon: ShieldCheck, label: "Secure Payments", sub: "256-bit SSL encryption" },
  { icon: Receipt, label: "GST Invoice", sub: "Included with every order" },
  { icon: RefreshCcw, label: "Refund Policy", sub: "7-day money-back guarantee" },
  { icon: Headphones, label: "Support", sub: "Help within 24 hours" },
];

export function TrustBadges() {
  return (
    <div className="flex flex-wrap justify-center gap-4 mt-4">
      {BADGES.map(({ icon: Icon, label, sub }) => (
        <div key={label} className="flex items-center gap-2 text-xs text-gray-500">
          <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <div className="font-semibold text-gray-700 text-xs">{label}</div>
            <div className="text-gray-400 text-[11px]">{sub}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
