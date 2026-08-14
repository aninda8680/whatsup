import Link from "next/link";
import { Mascot } from "@/components/mascot";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col font-sans text-foreground overflow-x-hidden">
      <nav className="w-full flex justify-between items-center p-4 md:p-6 border-b-[4px] border-foreground bg-white z-50">
        <Link href="/" className="text-3xl font-display font-black tracking-tighter flex items-center gap-2 hover:scale-105 transition-transform">
          <Mascot className="w-10 h-10" />
          WHAT'S UP!
        </Link>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
        <div className="bg-white border-[6px] border-foreground p-8 md:p-12 shadow-brutal-lg prose prose-lg max-w-none">
          <h1 className="text-5xl font-display font-black mb-8 uppercase">Terms of Service</h1>
          <p className="font-bold text-xl mb-8 border-l-[4px] border-brand-green pl-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <h2 className="text-3xl font-display font-black mt-8 mb-4">1. Acceptance of Terms</h2>
          <p className="font-bold">
            By accessing or using What's Up, you agree to be bound by these terms. If you disagree with any part of the terms, you may not access the service.
          </p>

          <h2 className="text-3xl font-display font-black mt-8 mb-4">2. Acceptable Use</h2>
          <p className="font-bold">
            You agree not to use What's Up to host illegal content, harass individuals, or launch denial-of-service attacks against our real-time database infrastructure. 
            Keep it fun, keep it engaging.
          </p>

          <h2 className="text-3xl font-display font-black mt-8 mb-4">3. Refunds</h2>
          <p className="font-bold">
            Event passes (Starter, Event, Fest) are one-time purchases valid for 7 days. If the platform experiences catastrophic failure during your event, contact us for a full refund.
          </p>
        </div>
      </main>

      <footer className="bg-foreground text-brand-cream p-8 text-center mt-auto border-t-[4px] border-foreground">
        <p className="font-bold">© {new Date().getFullYear()} What's Up. Built for engagement.</p>
      </footer>
    </div>
  );
}
