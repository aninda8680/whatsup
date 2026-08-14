"use client";

import { useState } from "react";
import Link from "next/link";
import { Mascot } from "@/components/mascot";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate form submission
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-brand-cream flex flex-col font-sans text-foreground overflow-x-hidden">
      <nav className="w-full flex justify-between items-center p-4 md:p-6 border-b-[4px] border-foreground bg-white z-50">
        <Link href="/" className="text-3xl font-display font-black tracking-tighter flex items-center gap-2 hover:scale-105 transition-transform">
          <Mascot className="w-10 h-10" />
          WHAT'S UP!
        </Link>
      </nav>

      <main className="flex-1 max-w-3xl w-full mx-auto p-6 md:p-12">
        <div className="bg-white border-[6px] border-foreground p-8 md:p-12 shadow-brutal-lg relative">
          
          <div className="absolute -top-12 -right-6 w-24 h-24">
            <Mascot emotion={success ? "wow" : "happy"} />
          </div>

          <h1 className="text-5xl md:text-7xl font-display font-black mb-4">
            SAY <span className="text-brand-pink">HELLO</span>
          </h1>
          <p className="text-xl font-bold mb-8 text-gray-700">
            Have a question, feature request, or just want to tell us how much you love the thick borders? Drop us a line.
          </p>

          {success ? (
            <div className="bg-brand-green border-[4px] border-foreground p-8 text-center shadow-brutal">
              <h2 className="text-3xl font-display font-black mb-2">Message Sent!</h2>
              <p className="font-bold text-lg">We'll get back to you faster than a live poll updates.</p>
              <Button onClick={() => setSuccess(false)} variant="default" className="mt-6 border-[3px]">
                Send Another
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              <div>
                <label className="font-black text-lg block mb-2">Name</label>
                <Input required placeholder="John Doe" className="text-lg h-14 border-[3px]" />
              </div>
              <div>
                <label className="font-black text-lg block mb-2">Email</label>
                <Input required type="email" placeholder="john@example.com" className="text-lg h-14 border-[3px]" />
              </div>
              <div>
                <label className="font-black text-lg block mb-2">Message</label>
                <textarea 
                  required 
                  placeholder="Your message here..." 
                  className="w-full text-lg p-4 border-[3px] border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-pink bg-white min-h-[150px] resize-y"
                />
              </div>
              <Button type="submit" variant="primary" disabled={loading} size="lg" className="h-16 text-2xl border-[4px] mt-4 shadow-brutal hover:shadow-none hover:translate-y-1 transition-all">
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          )}
        </div>
      </main>

      <footer className="bg-foreground text-brand-cream p-8 text-center mt-auto border-t-[4px] border-foreground">
        <p className="font-bold">© {new Date().getFullYear()} What's Up. Built for engagement.</p>
      </footer>
    </div>
  );
}
