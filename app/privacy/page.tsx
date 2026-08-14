import Link from "next/link";
import { Mascot } from "@/components/mascot";

export default function PrivacyPage() {
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
          <h1 className="text-5xl font-display font-black mb-8 uppercase">Privacy Policy</h1>
          <p className="font-bold text-xl mb-8 border-l-[4px] border-brand-pink pl-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>
          
          <h2 className="text-3xl font-display font-black mt-8 mb-4">1. What we collect</h2>
          <p className="font-bold">
            If you're a participant, we collect the display name you provide when joining a session. We don't require accounts or passwords for participants. 
            If you're a host, we collect your email address and authentication data via Firebase Auth.
          </p>

          <h2 className="text-3xl font-display font-black mt-8 mb-4">2. Where it goes</h2>
          <p className="font-bold">
            Your data is stored securely in Google Cloud (Firebase Firestore & Realtime Database). Poll responses are stored alongside your session but can be cleared at any time by the host. 
            Payments are processed securely via Razorpay; we do not store your credit card information.
          </p>

          <h2 className="text-3xl font-display font-black mt-8 mb-4">3. We don't sell your data</h2>
          <p className="font-bold">
            We build polling software, not ad networks. We do not sell your personal data or your audience's data to third parties. Period.
          </p>
        </div>
      </main>

      <footer className="bg-foreground text-brand-cream p-8 text-center mt-auto border-t-[4px] border-foreground">
        <p className="font-bold">© {new Date().getFullYear()} What's Up. Built for engagement.</p>
      </footer>
    </div>
  );
}
