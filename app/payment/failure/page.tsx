import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";

export default function PaymentFailurePage({
  searchParams,
}: {
  searchParams: { reason?: string };
}) {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col font-sans text-foreground overflow-x-hidden">
      <nav className="w-full flex justify-between items-center p-4 md:p-6 border-b-[4px] border-foreground bg-white z-50">
        <Link href="/" className="text-3xl font-display font-black tracking-tighter flex items-center gap-2 hover:scale-105 transition-transform">
          <Mascot className="w-10 h-10" />
          WHAT'S UP!
        </Link>
      </nav>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-brand-pink border-[4px] border-foreground rounded-full flex items-center justify-center mb-8 shadow-brutal">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" className="w-12 h-12 text-foreground">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-black mb-6">
          PAYMENT <span className="text-brand-pink">FAILED.</span>
        </h1>
        
        <p className="text-2xl font-bold text-gray-700 mb-4">
          Oops, something went wrong with your payment.
        </p>
        
        {searchParams.reason && (
          <p className="text-lg text-gray-500 mb-12">
            Reason: {searchParams.reason}
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-8">
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button variant="default" size="lg" className="w-full h-16 px-8 text-xl border-[4px] shadow-brutal hover:translate-y-1 hover:shadow-brutal-sm transition-all">
              Try Again
            </Button>
          </Link>
          <Link href="/contact" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full h-16 px-8 text-xl border-[4px] transition-all bg-transparent">
              Contact Support
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
