import { Fraunces } from "next/font/google";
import Link from "next/link";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-fraunces",
});

export default function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${fraunces.variable} min-h-screen bg-white text-gray-900`}>
      {children}
      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 text-center">
        <p className="text-xs text-gray-400">
          Powered by{" "}
          <Link href="/" className="font-semibold text-gray-600 hover:text-indigo-600 transition-colors">
            CreatorMint
          </Link>{" "}
          · Sell digital products in India
        </p>
      </footer>
    </div>
  );
}
