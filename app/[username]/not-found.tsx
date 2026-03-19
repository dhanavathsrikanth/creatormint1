import Link from "next/link";
import { ShoppingBag } from "lucide-react";

// Custom 404 shown when a store slug does not exist
export default function StoreNotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-6 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-5">
        <ShoppingBag className="w-8 h-8 text-gray-300" />
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Store not found</h1>
      <p className="text-gray-500 mb-6 max-w-sm">
        This store doesn&apos;t exist or hasn&apos;t been set up yet. Double-check the URL and try again.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-full hover:bg-gray-700 transition-colors"
      >
        Go to CreatorMint
      </Link>
    </div>
  );
}
