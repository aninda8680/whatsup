import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-brand-yellow flex flex-col items-center justify-center p-8 relative overflow-hidden">
      {/* Decorative brutalist shapes */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-brand-blue border-[4px] border-black shadow-brutal rotate-12 z-0"></div>
      <div className="absolute bottom-20 right-10 w-48 h-48 bg-brand-pink border-[4px] border-black shadow-brutal -rotate-12 rounded-full z-0"></div>
      <div className="absolute top-40 right-40 w-24 h-24 bg-brand-green border-[4px] border-black shadow-brutal rotate-45 z-0"></div>

      <div className="bg-white border-[6px] border-black p-12 max-w-2xl w-full text-center shadow-brutal-lg z-10 relative">
        <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
          WHAT'S <br/>
          <span className="text-brand-blue" style={{ textShadow: '4px 4px 0px black' }}>UP?</span>
        </h1>
        <p className="text-2xl font-bold mb-12 text-gray-700">
          The ultimate live polling and interactive presentation tool for your classroom.
        </p>

        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link href="/join">
            <Button variant="primary" size="lg" className="w-full sm:w-auto text-2xl h-16 px-12 border-[4px]">
              Join a Session
            </Button>
          </Link>
          <Link href="/admin/login">
            <Button variant="default" size="lg" className="w-full sm:w-auto text-2xl h-16 px-12 border-[4px]">
              Host Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
