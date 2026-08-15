"use client";

import Link from "next/link";
import Script from "next/script";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { PRICING_TIERS } from "@/lib/pricing";
import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Tier, Entitlement } from "@/lib/types";

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Payment confirmation state
  const [confirmingPayment, setConfirmingPayment] = useState(false);
  const [paymentTimeout, setPaymentTimeout] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);

  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Listen for entitlement updates if we are confirming a payment
  useEffect(() => {
    if (!confirmingPayment || !user) return;

    let timeoutId: NodeJS.Timeout;
    
    const unsub = onSnapshot(doc(db, "entitlements", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const entitlement = docSnap.data() as Entitlement;
        if (entitlement.status === 'active' && (currentPaymentId ? entitlement.lastPaymentId === currentPaymentId : true)) {
          // Webhook processed it!
          clearTimeout(timeoutId);
          router.push(`/payment/success?paymentId=${currentPaymentId}`);
        }
      }
    });

    // 15 seconds timeout
    timeoutId = setTimeout(() => {
      setPaymentTimeout(true);
    }, 15000);

    return () => {
      unsub();
      clearTimeout(timeoutId);
    };
  }, [confirmingPayment, user, currentPaymentId, router]);

  const handleCheckout = async (tierId: Tier) => {
    if (!user) {
      router.push("/admin/login?redirect=/pricing");
      return;
    }

    if (tierId === 'free') {
      router.push("/admin/dashboard");
      return;
    }

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hostId: user.uid, tierId }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        alert(data.error || "Checkout failed");
        return;
      }

      const options = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: "WHAT'S UP!",
        description: `${PRICING_TIERS[tierId].name} Pass`,
        order_id: data.orderId,
        handler: function (response: any) {
          // DO NOT REDIRECT YET
          setCurrentPaymentId(response.razorpay_payment_id);
          setConfirmingPayment(true);
          setPaymentTimeout(false);
        },
        prefill: {
          email: user.email || "",
        },
        theme: {
          color: "#000000",
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (response: any) {
        router.push(`/payment/failure?reason=${encodeURIComponent(response.error.description)}`);
      });
      rzp.open();
    } catch (e) {
      console.error(e);
      alert("Something went wrong with the payment gateway.");
    }
  };


  return (
    <div className="min-h-screen bg-brand-ink bg-[url('/bg.png')] bg-cover bg-center text-brand-ink selection:bg-brand-primary selection:text-white flex flex-col gap-8 px-12 md:px-24 lg:px-32 xl:px-48 pb-12 pt-7 font-sans relative">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      {/* Payment Confirmation Overlay */}
      {confirmingPayment && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center backdrop-blur-sm p-4">
          <div className="bg-white p-8 md:p-12 border-[4px] border-brand-ink shadow-brutal-lg max-w-md w-full text-center flex flex-col items-center">
            <Mascot className="w-16 h-16 animate-bounce mb-6" />
            
            {!paymentTimeout ? (
              <>
                <h3 className="font-display font-black text-3xl tracking-tight mb-2">Confirming Payment</h3>
                <p className="text-gray-600 font-medium">Please wait while we securely verify your payment with Razorpay...</p>
                
                <div className="mt-8 flex gap-2 justify-center">
                  <div className="w-3 h-3 bg-brand-pink rounded-full animate-ping delay-75"></div>
                  <div className="w-3 h-3 bg-brand-primary rounded-full animate-ping delay-150"></div>
                  <div className="w-3 h-3 bg-[#FFE600] rounded-full animate-ping delay-300"></div>
                </div>
              </>
            ) : (
              <>
                <h3 className="font-display font-black text-3xl tracking-tight mb-4">Taking a bit longer...</h3>
                <p className="text-gray-600 font-medium mb-8">
                  We're still confirming your payment. This can take a minute. We'll email you once it's active.
                </p>
                <div className="flex flex-col gap-4 w-full">
                  <Button 
                    onClick={() => router.push(`/payment/success?paymentId=${currentPaymentId}&pending=true`)}
                    className="h-14 font-bold uppercase tracking-widest text-lg border-[3px] shadow-brutal"
                  >
                    Check Status / Continue
                  </Button>
                  <Button 
                    onClick={() => setConfirmingPayment(false)}
                    variant="outline"
                    className="h-14 font-bold uppercase tracking-widest border-[3px]"
                  >
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <nav className="w-full flex justify-between items-center py-3 px-6 md:py-4 md:px-10 bg-brand-base rounded-full border-[2px] border-brand-ink z-50 sticky top-7 shadow-brutal">

        <Link href="/" className="text-3xl font-display font-black tracking-tight flex items-center gap-3 group">
          <Mascot className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
          WHAT'S UP!
        </Link>
        <div className="flex gap-4 items-center">
          <div className="hidden md:flex gap-6 mr-4 text-sm font-bold uppercase tracking-widest">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <Link href="/contact" className="hover:text-brand-primary transition-colors">Contact</Link>
          </div>
          {user ? (
            <Link href="/admin/dashboard">
              <Button variant="default" className="text-sm md:text-base font-bold uppercase tracking-widest border-[3px] rounded-full px-8 h-12 shadow-brutal hover:shadow-brutal-active hover:translate-y-[2px] transition-all bg-brand-secondary hover:bg-brand-primary hover:text-white">
                Dashboard
              </Button>
            </Link>
          ) : (
            <Link href="/admin/login">
              <Button variant="default" className="text-sm md:text-base font-bold uppercase tracking-widest border-[3px] rounded-full px-8 h-12 shadow-brutal hover:shadow-brutal-active hover:translate-y-[2px] transition-all bg-brand-secondary hover:bg-brand-primary hover:text-white">
                Host Login
              </Button>
            </Link>
          )}
        </div>
      </nav>

      <main className="w-full px-6 md:px-16 xl:px-32 2xl:px-48 py-24 md:py-32 flex flex-col items-center gap-16 bg-brand-secondary rounded-[2.5rem] md:rounded-[3rem] border-[2px] border-brand-ink relative overflow-hidden">
        <div className="text-center">
          <h1 className="text-6xl md:text-8xl font-display font-black mb-6 tracking-tight">
            NO <span className="text-brand-pink">SUBSCRIPTIONS.</span>
          </h1>
          <p className="text-xl md:text-2xl font-medium text-gray-800 max-w-2xl mx-auto leading-relaxed">
            Pay per event. Each pass lasts 7 days, giving you plenty of time to setup, test, and run your event.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full z-10">
          <PricingCard 
            tier={PRICING_TIERS.free} 
            color="bg-[#E2F1E7]" 
            ctaText="Get Started" 
            onAction={() => handleCheckout('free')} 
          />
          <PricingCard 
            tier={PRICING_TIERS.starter} 
            color="bg-brand-base" 
            ctaText="Buy Starter Pass" 
            onAction={() => handleCheckout('starter')} 
          />
          <PricingCard 
            tier={PRICING_TIERS.event} 
            color="bg-brand-pink" 
            ctaText="Buy Event Pass" 
            onAction={() => handleCheckout('event')} 
            highlight 
          />
          <PricingCard 
            tier={PRICING_TIERS.fest} 
            color="bg-[#FFE600]" 
            ctaText="Buy Fest Pass" 
            onAction={() => handleCheckout('fest')} 
          />
        </div>
      </main>

      {/* ── Final CTA ── */}
      <section className="w-full bg-brand-base bg-[radial-gradient(rgba(10,10,10,0.15)_2px,transparent_2px)] [background-size:24px_24px] py-32 md:py-40 px-6 border-[2px] border-brand-ink rounded-[2.5rem] md:rounded-[3rem] relative overflow-hidden">
        <div className="max-w-4xl mx-auto bg-white p-12 md:p-20 text-center border-[2px] border-brand-ink shadow-brutal-lg rounded-3xl flex flex-col md:flex-row items-center justify-between gap-8 relative">
          <div className="text-left">
            <h2 className="text-4xl md:text-5xl font-display font-black mb-4 tracking-tight">Enterprise?</h2>
            <p className="text-xl font-medium text-gray-800">For whole-campus deployments or massive 10,000+ attendee events.</p>
          </div>
          <Link href="/contact" className="shrink-0">
            <Button className="h-20 px-12 text-xl md:text-2xl font-bold uppercase tracking-widest bg-brand-ink text-white border-[2px] border-brand-ink rounded-2xl shadow-brutal hover:shadow-brutal-active hover:translate-y-[2px] transition-all whitespace-nowrap">
              Contact Sales
            </Button>
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="w-full bg-brand-ink text-brand-base p-8 md:p-12 border-[2px] border-brand-ink rounded-t-[2.5rem] md:rounded-[3rem] flex flex-col md:flex-row justify-between items-center gap-12 md:gap-4 relative overflow-hidden">
        
        {/* Left: Aninda */}
        <div className="flex flex-col items-center md:items-start z-10 w-full md:w-1/4">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Built by</p>
          <span className="font-display font-bold text-xl mb-1">Aninda Debta</span>
          <span className="text-[10px] uppercase tracking-widest text-brand-primary hover:text-white cursor-pointer transition-colors">[ Socials TBA ]</span>
        </div>

        {/* Center: Main Footer Content */}
        <div className="flex flex-col items-center z-10 w-full md:w-2/4">
          <div className="text-3xl font-display font-black mb-6 flex items-center justify-center gap-3">
            WHAT'S UP!
          </div>
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 mb-6 text-xs font-bold uppercase tracking-widest">
            <Link href="/" className="hover:text-brand-primary transition-colors">Home</Link>
            <Link href="/about" className="hover:text-brand-primary transition-colors">About</Link>
            <Link href="/contact" className="hover:text-brand-primary transition-colors">Contact</Link>
            <Link href="/terms" className="hover:text-brand-primary transition-colors">Terms</Link>
            <Link href="/privacy" className="hover:text-brand-primary transition-colors">Privacy</Link>
          </div>
          <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">© {new Date().getFullYear()} What's Up. Built for engagement.</p>
        </div>

        {/* Right: Atanu */}
        <div className="flex flex-col items-center md:items-end z-10 w-full md:w-1/4">
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Built by</p>
          <span className="font-display font-bold text-xl mb-1">Atanu Saha</span>
          <span className="text-[10px] uppercase tracking-widest text-brand-secondary hover:text-white cursor-pointer transition-colors">[ Socials TBA ]</span>
        </div>
      </footer>
    </div>
  );
}

function PricingCard({ tier, color, ctaText, onAction, highlight = false }: any) {
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

      <div className="mt-auto">
        <Button onClick={onAction} variant={highlight ? "primary" : "default"} className={`w-full h-16 text-xl border-[4px] ${highlight ? 'shadow-brutal hover:shadow-none hover:translate-y-1' : ''} transition-all`}>
          {ctaText}
        </Button>
      </div>
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
