import Link from "next/link";
import { Mascot } from "@/components/mascot";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-brand-cream flex flex-col font-sans text-foreground overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className="w-full flex justify-between items-center p-4 md:p-6 border-b-[4px] border-foreground bg-white z-50">
        <Link href="/" className="text-3xl font-display font-black tracking-tighter flex items-center gap-2 hover:scale-105 transition-transform">
          <Mascot className="w-10 h-10" />
          WHAT'S UP!
        </Link>
      </nav>

      {/* ── Content ── */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-6 md:p-12">
        <div className="bg-white border-[6px] border-foreground p-8 md:p-12 shadow-brutal-lg">
          <div className="inline-block bg-brand-pink text-white px-4 py-2 border-[3px] border-foreground font-black uppercase tracking-widest mb-8 -rotate-2 shadow-brutal-sm">
            Behind the Scenes
          </div>
          
          <h1 className="text-5xl md:text-7xl font-display font-black mb-8 leading-none">
            MEET THE <br/> <span className="text-brand-blue" style={{ textShadow: '3px 3px 0px #111827' }}>TEAM</span>
          </h1>

          <p className="text-2xl font-bold mb-12 text-gray-800 leading-relaxed">
            We built What's Up! because we were tired of falling asleep during 8 AM lectures and boring corporate town halls. We wanted a tool that was fast, loud, and actually fun to use.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TeamCard 
              name="Alex" 
              role="Code Monkey" 
              desc="Drinks too much coffee. Spends most of his time trying to center divs and writing strictly typed Firebase rules."
              color="bg-brand-yellow"
            />
            <TeamCard 
              name="Sam" 
              role="Design Goblin" 
              desc="Refuses to use anything other than primary colors. Insisted on making the borders 4px thick."
              color="bg-brand-green"
            />
          </div>
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-foreground text-brand-cream p-8 text-center mt-auto border-t-[4px] border-foreground">
        <p className="font-bold">© {new Date().getFullYear()} What's Up. Built for engagement.</p>
      </footer>
    </div>
  );
}

function TeamCard({ name, role, desc, color }: any) {
  return (
    <div className="bg-white border-[4px] border-foreground flex flex-col shadow-brutal group hover:-translate-y-2 transition-transform">
      <div className={`h-48 ${color} border-b-[4px] border-foreground flex items-center justify-center`}>
        <Mascot emotion="happy" className="w-24 h-24 drop-shadow-[2px_2px_0px_rgba(17,24,39,1)] group-hover:scale-110 transition-transform" />
      </div>
      <div className="p-6">
        <h3 className="text-3xl font-display font-black mb-1">{name}</h3>
        <div className="text-brand-pink font-black uppercase tracking-widest text-sm mb-4">{role}</div>
        <p className="text-lg font-bold text-gray-700">{desc}</p>
        
        <div className="flex gap-4 mt-6">
          <Link href="#" className="font-bold underline hover:text-brand-blue">GitHub</Link>
          <Link href="#" className="font-bold underline hover:text-brand-blue">LinkedIn</Link>
        </div>
      </div>
    </div>
  );
}
