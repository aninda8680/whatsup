"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { LivePollDemo } from "@/components/live-poll-demo";
import { Mascot } from "@/components/mascot";

// Premium, restrained fade-up animation variant
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Home() {
  const router = useRouter();
  const [code, setCode] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      router.push(`/join?code=${code.trim().toUpperCase()}`);
    }
  };

  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="min-h-screen bg-brand-ink bg-[url('/bg.png')] bg-cover bg-center text-brand-ink selection:bg-brand-primary selection:text-white flex flex-col gap-8 px-12 md:px-24 lg:px-32 xl:px-48 pb-12 pt-7 font-sans">
      
      {/* ── Navigation ── */}
      <nav className="w-full flex justify-between items-center py-3 px-6 md:py-4 md:px-10 bg-brand-base rounded-full border-[2px] border-brand-ink z-50 sticky top-7 shadow-brutal">
        <Link href="/" onClick={() => setIsFlipped(false)} className="text-3xl font-display font-black tracking-tight flex items-center gap-3 group">
          <Mascot className="w-8 h-8 group-hover:rotate-12 transition-transform duration-300" />
          WHAT'S UP!
        </Link>
        <div className="flex gap-4 items-center">
          <div className="hidden md:flex gap-6 mr-4 text-sm font-bold uppercase tracking-widest">
            <button onClick={() => setIsFlipped(true)} className="hover:text-brand-primary transition-colors uppercase font-bold tracking-widest">Pricing</button>
            <Link href="/contact" className="hover:text-brand-primary transition-colors">Contact</Link>
          </div>
          <Link href="/admin/login">
            <Button variant="default" className="text-sm md:text-base font-bold uppercase tracking-widest border-[3px] rounded-full px-8 h-12 shadow-brutal hover:shadow-brutal-active hover:translate-y-[2px] transition-all bg-brand-secondary hover:bg-brand-primary hover:text-white">
              Host Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* ── Hero Section (Flippable) ── */}
      <div className="w-full relative [perspective:2000px] z-20">
        <motion.div 
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.8, type: "spring", stiffness: 45, damping: 15 }}
          className="w-full relative [transform-style:preserve-3d]"
        >
          
          {/* Front Face */}
          <main className="w-full px-6 md:px-16 xl:px-32 2xl:px-48 py-24 md:py-40 flex flex-col lg:flex-row items-center justify-between gap-20 bg-brand-secondary rounded-[2.5rem] md:rounded-[3rem] border-[2px] border-brand-ink relative overflow-hidden [backface-visibility:hidden]">
            
            {/* Left: Copy & CTA */}
            <div className="w-full lg:w-[55%] flex flex-col items-start text-left z-20">
              <motion.h1 
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                className="text-7xl md:text-8xl lg:text-9xl font-display font-black tracking-tighter mb-8 leading-[0.9]"
              >
                WAKE UP <br/> YOUR ROOM.
              </motion.h1>

              <motion.p 
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                className="text-xl md:text-2xl font-medium mb-12 text-gray-800 max-w-lg leading-relaxed"
              >
                Turn silent classrooms and dead events into fierce, interactive live games and polls in seconds.
              </motion.p>
            </div>

            {/* Right: Interactive Demo & Join Card */}
            <div className="w-full lg:w-[45%] flex flex-col items-center justify-center lg:justify-end z-20 lg:mt-16 xl:mt-24 relative pt-16 lg:pt-0">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="lg:absolute lg:-top-48 lg:-right-4 xl:-right-12 z-30 w-full max-w-md lg:w-[320px] bg-white p-6 md:p-8 border-[2px] border-brand-ink rounded-3xl shadow-brutal flex flex-col gap-4 lg:rotate-[12deg] mb-12 lg:mb-0 origin-bottom-left"
              >
                <h2 className="text-sm font-bold uppercase tracking-widest text-brand-ink">Joining a session?</h2>
                <form onSubmit={handleJoin} className="flex gap-3 lg:gap-2">
                  <Input 
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="CODE" 
                    className="flex-1 text-2xl lg:text-xl h-16 lg:h-14 font-display font-black uppercase tracking-widest border-[3px] border-brand-ink rounded-xl text-center focus-visible:ring-offset-0 focus-visible:ring-brand-primary"
                    maxLength={6}
                  />
                  <Button type="submit" className="h-16 lg:h-14 px-8 lg:px-6 text-lg lg:text-base font-bold uppercase tracking-widest bg-brand-primary text-white border-[3px] border-brand-ink rounded-xl shadow-brutal hover:shadow-brutal-active hover:translate-y-[2px] transition-all shrink-0">
                    Join
                  </Button>
                </form>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-lg"
              >
                <LivePollDemo />
              </motion.div>
            </div>
          </main>

          {/* Back Face (Pricing) */}
          <main className="w-full absolute inset-0 px-6 py-12 md:py-20 flex flex-col items-center bg-[#FFE600] rounded-[2.5rem] md:rounded-[3rem] border-[2px] border-brand-ink [backface-visibility:hidden] [transform:rotateY(180deg)] overflow-y-auto">
             <div className="w-full max-w-7xl flex justify-between items-center mb-8 px-4 md:px-8">
               <h2 className="text-4xl md:text-7xl font-display font-black tracking-tight">PRICING</h2>
               <Button 
                 onClick={() => setIsFlipped(false)} 
                 variant="outline" 
                 className="h-12 px-6 border-[3px] shadow-brutal font-bold uppercase flex items-center gap-2 bg-white"
               >
                 <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                   <path d="M15 18l-6-6 6-6" />
                 </svg>
                 Back
               </Button>
             </div>
             
             <p className="text-xl md:text-2xl font-bold mb-10 text-center max-w-2xl px-4">
               Pay per event. Each pass lasts 7 days.
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full max-w-7xl px-4 md:px-8 pb-12">
               {/* Minimal Mini Pricing Cards */}
               <MiniPricingCard 
                  name="FREE" price="₹0" cap="25 participants" color="bg-[#E2F1E7]" 
                  onClick={() => router.push('/pricing')}
               />
               <MiniPricingCard 
                  name="STARTER" price="₹99" cap="50 participants" color="bg-brand-base" 
                  onClick={() => router.push('/pricing')}
               />
               <MiniPricingCard 
                  name="EVENT" price="₹199" cap="200 participants" color="bg-brand-pink" highlight 
                  onClick={() => router.push('/pricing')}
               />
               <MiniPricingCard 
                  name="FEST" price="₹399" cap="500+ participants" color="bg-white" 
                  onClick={() => router.push('/pricing')}
               />
             </div>
             
             <div className="mt-auto pt-4">
               <Button onClick={() => router.push('/pricing')} className="h-16 px-12 text-xl font-bold uppercase tracking-widest bg-brand-ink text-white border-[3px] border-brand-ink rounded-full shadow-brutal hover:shadow-brutal-active hover:-translate-y-1 transition-all">
                 Go to Full Pricing Page
               </Button>
             </div>
          </main>

        </motion.div>
      </div>


      {/* ── How It Works ── */}
      <section className="w-full bg-[#93C5FD] border-[2px] border-brand-ink rounded-[2.5rem] md:rounded-[3rem] py-24 px-6 md:px-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="text-5xl md:text-6xl font-display font-black mb-24 text-center tracking-tight text-brand-ink"
          >
            FROM ZERO TO LIVE
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-4">
            <StepCard num="1" title="Create" desc="Host creates a quick session with MCQs or word clouds." />
            <StepCard num="2" title="Share" desc="Flash the 4-digit room code on your projector." />
            <StepCard num="3" title="Join" desc="Audience joins instantly via phone. No app required." />
            <StepCard num="4" title="Watch" desc="Votes pour in and results update live on screen." />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 z-10">
        <FeatureCard 
          icon={<BarChartIcon />} 
          title="Real-Time Polling" 
          desc="Watch the bars fill up instantly as hundreds vote. No refreshing required." 
          color="bg-[#FFE600]"
        />
        <FeatureCard 
          icon={<TrophyIcon />} 
          title="Live Leaderboards" 
          desc="Gamify your classroom. Award points for speed and accuracy." 
          color="bg-[#FF99C2]"
        />
        <FeatureCard 
          icon={<CloudIcon />} 
          title="Word Clouds" 
          desc="Visualize audience sentiment dynamically. Popular words grow massive." 
          color="bg-white"
        />
      </section>

      {/* ── Final CTA ── */}
      <section className="w-full bg-brand-base bg-[radial-gradient(rgba(10,10,10,0.15)_2px,transparent_2px)] [background-size:24px_24px] py-32 md:py-40 px-6 border-[2px] border-brand-ink rounded-[2.5rem] md:rounded-[3rem] relative overflow-hidden">
        <div className="max-w-4xl mx-auto bg-white p-12 md:p-20 text-center border-[2px] border-brand-ink shadow-brutal-lg rounded-3xl relative">
          <motion.h2 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            className="text-5xl md:text-7xl font-display font-black mb-6 tracking-tight"
          >
            READY TO HOST?
          </motion.h2>
          <motion.p 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: 0.1 } } }}
            className="text-xl md:text-2xl font-medium mb-12 text-gray-800"
          >
            Create your first interactive presentation in minutes.
          </motion.p>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { delay: 0.2 } } }}
          >
            <Link href="/admin/login">
              <Button className="h-20 px-12 text-xl md:text-2xl font-bold uppercase tracking-widest bg-brand-secondary text-brand-ink border-[2px] border-brand-ink rounded-2xl shadow-brutal hover:shadow-brutal-active hover:translate-y-[2px] transition-all">
                Start Polling Free
              </Button>
            </Link>
          </motion.div>
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
            <Link href="/pricing" className="hover:text-brand-primary transition-colors">Pricing</Link>
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

// ── Strict UI Components ──

function StepCard({ num, title, desc }: any) {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeUp}
      className="flex flex-col gap-4 text-center md:text-left bg-white p-6 border-[2px] border-brand-ink rounded-3xl shadow-brutal"
    >
      <div className="w-12 h-12 bg-brand-base border-[3px] border-brand-ink rounded-full flex items-center justify-center font-display font-black text-2xl mx-auto md:mx-0 shadow-brutal-sm">
        {num}
      </div>
      <h3 className="text-2xl md:text-3xl font-display font-black tracking-tight">{title}</h3>
      <p className="text-lg font-medium text-gray-700 leading-relaxed">{desc}</p>
    </motion.div>
  );
}

function FeatureCard({ icon, title, desc, color }: any) {
  return (
    <motion.div 
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={fadeUp}
      className={`flex flex-col gap-6 items-start p-8 md:p-10 border-[2px] border-brand-ink rounded-[2.5rem] shadow-brutal ${color}`}
    >
      <div className="w-20 h-20 shrink-0 bg-white border-[2px] border-brand-ink rounded-2xl flex items-center justify-center shadow-brutal-sm">
        {icon}
      </div>
      <div>
        <h3 className="text-3xl md:text-4xl font-display font-black tracking-tight mb-4 text-brand-ink">{title}</h3>
        <p className="text-xl font-medium text-brand-ink/80 leading-relaxed">{desc}</p>
      </div>
    </motion.div>
  );
}

// ── Custom minimalist SVGs for features ──

function BarChartIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M18 20V10" />
      <path d="M12 20V4" />
      <path d="M6 20V14" />
    </svg>
  );
}

function TrophyIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <path d="M18 2H6v7c0 6 6 7 6 7s6-1 6-7V2Z" />
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#0A0A0A" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}

function MiniPricingCard({ name, price, cap, color, highlight, onClick }: any) {
  return (
    <div onClick={onClick} className={`flex flex-col items-center justify-center p-6 border-[3px] border-brand-ink rounded-[2rem] shadow-brutal hover:shadow-brutal-active hover:-translate-y-1 transition-all cursor-pointer ${color} ${highlight ? 'ring-4 ring-brand-ink' : ''}`}>
      <h3 className="text-xl font-display font-black tracking-tight mb-2">{name}</h3>
      <div className="text-3xl font-black tracking-tighter mb-2">{price}</div>
      <div className="text-sm font-bold uppercase tracking-widest text-center opacity-80">{cap}</div>
    </div>
  );
}

