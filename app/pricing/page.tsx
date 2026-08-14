import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { PRICING_TIERS } from "@/lib/pricing";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col font-sans text-foreground overflow-x-hidden">
      <nav className="w-full flex justify-between items-center p-4 md:p-6 border-b-[4px] border-foreground bg-white z-50">
        <Link href="/" className="text-3xl font-display font-black tracking-tighter flex items-center gap-2 hover:scale-105 transition-transform">
          <Mascot className="w-10 h-10" />
          WHAT'S UP!
        </Link>
      </nav>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12">
        <div className="text-center mb-16">
          <h1 className="text-6xl md:text-8xl font-display font-black mb-6">
            NO <span className="text-brand-pink">SUBSCRIPTIONS.</span>
          </h1>
          <p className="text-2xl font-bold text-gray-700 max-w-2xl mx-auto">
            Pay per event. Each pass lasts 7 days, giving you plenty of time to setup, test, and run your event.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PricingCard 
            tier={PRICING_TIERS.free} 
            color="bg-brand-cream" 
            ctaText="Get Started" 
            href="/admin/login" 
          />
          <PricingCard 
            tier={PRICING_TIERS.starter} 
            color="bg-brand-blue" 
            ctaText="Buy Starter Pass" 
            href="#" 
          />
          <PricingCard 
            tier={PRICING_TIERS.event} 
            color="bg-brand-pink" 
            ctaText="Buy Event Pass" 
            href="#" 
            highlight 
          />
          <PricingCard 
            tier={PRICING_TIERS.fest} 
            color="bg-brand-yellow" 
            ctaText="Buy Fest Pass" 
            href="#" 
          />
        </div>
        
        <div className="mt-16 bg-white border-[4px] border-foreground p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-brutal">
          <div>
            <h2 className="text-3xl font-display font-black mb-2">Need a custom enterprise plan?</h2>
            <p className="text-xl font-bold text-gray-600">For whole-campus deployments or massive 10,000+ attendee events.</p>
          </div>
          <Link href="/contact">
            <Button variant="default" size="lg" className="h-16 px-8 text-xl border-[4px] shadow-brutal hover:translate-y-1 hover:shadow-brutal-sm transition-all whitespace-nowrap">
              Contact Sales
            </Button>
          </Link>
        </div>
      </main>

      <footer className="bg-foreground text-brand-cream p-8 text-center mt-auto border-t-[4px] border-foreground">
        <p className="font-bold">© {new Date().getFullYear()} What's Up. Built for engagement.</p>
      </footer>
    </div>
  );
}

function PricingCard({ tier, color, ctaText, href, highlight = false }: any) {
  return (
    <div className={`bg-white border-[4px] border-foreground p-6 flex flex-col relative ${highlight ? 'shadow-brutal-lg -translate-y-2' : 'shadow-brutal'} hover:-translate-y-2 transition-transform`}>
      {highlight && (
        <div className="absolute -top-4 right-4 bg-brand-green text-foreground border-[3px] border-foreground font-black px-3 py-1 rotate-6 shadow-brutal-sm">
          MOST POPULAR
        </div>
      )}
      
      <div className={`w-full py-4 ${color} border-b-[4px] border-foreground font-black text-2xl uppercase tracking-wider mb-6 -mt-6 -mx-6 px-6 text-center`}>
        {tier.name}
      </div>
      
      <div className="text-center mb-8">
        <div className="text-5xl font-display font-black mb-2">₹{tier.priceInr}</div>
        <div className="text-gray-500 font-bold">per 7-day pass</div>
      </div>
      
      <div className="flex-1 flex flex-col gap-4 mb-8">
        <FeatureLine text={`Up to ${tier.participantCap} participants`} />
        {tier.id === 'free' || tier.id === 'starter' ? (
          <FeatureLine text="Standard support" />
        ) : (
          <FeatureLine text="Priority support" />
        )}
      </div>

      <Link href={href} className="mt-auto">
        <Button variant={highlight ? "primary" : "default"} className={`w-full h-16 text-xl border-[4px] ${highlight ? 'shadow-brutal hover:shadow-none hover:translate-y-1' : ''} transition-all`}>
          {ctaText}
        </Button>
      </Link>
    </div>
  );
}

function FeatureLine({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-6 h-6 bg-brand-green border-2 border-foreground rounded-full flex items-center justify-center shrink-0">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="w-4 h-4">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <span className="font-bold text-lg">{text}</span>
    </div>
  );
}
