"use client";

import { motion, useAnimation } from "framer-motion";
import { useEffect, useState } from "react";

export function LivePollDemo() {
  const [clicked, setClicked] = useState(false);
  const cursorControls = useAnimation();
  const barControls = useAnimation();

  useEffect(() => {
    // Respect reduced motion
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setClicked(true);
      return;
    }

    let isMounted = true;

    const sequence = async () => {
      while (isMounted) {
        // Reset state
        setClicked(false);
        cursorControls.set({ x: 100, y: 150, opacity: 0 });
        barControls.set({ width: 0 });

        // Wait a beat before starting
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (!isMounted) break;

        // Cursor glides in
        await cursorControls.start({
          x: 0,
          y: 0,
          opacity: 1,
          transition: { type: "spring", stiffness: 50, damping: 20 }
        });

        // Small pause
        await new Promise(resolve => setTimeout(resolve, 300));
        if (!isMounted) break;

        // Click!
        setClicked(true);
        await cursorControls.start({ scale: 0.9, transition: { duration: 0.1 } });
        await cursorControls.start({ scale: 1, transition: { duration: 0.1 } });

        // Bar fills up smoothly
        barControls.start({
          width: "85%",
          transition: { type: "spring", stiffness: 40, damping: 15 }
        });

        // Wait on the final state before looping
        await new Promise(resolve => setTimeout(resolve, 3000));
        if (!isMounted) break;

        // Cursor leaves
        await cursorControls.start({
          opacity: 0,
          y: 50,
          transition: { duration: 0.4 }
        });
      }
    };

    sequence();

    return () => {
      isMounted = false;
    };
  }, [cursorControls, barControls]);

  return (
    <div className="relative w-full max-w-lg bg-white border-[4px] border-brand-ink p-8 shadow-brutal-lg">
      <h3 className="text-3xl font-display font-black mb-8 uppercase tracking-tight text-brand-ink">
        Which framework?
      </h3>

      <div className="flex flex-col gap-6">
        {/* Option A: The one that gets clicked */}
        <div className="relative w-full">
          <div className="flex justify-between font-bold mb-3 text-lg text-brand-ink">
            <span>Next.js</span>
            <span className="tabular-nums">{clicked ? "85%" : "0%"}</span>
          </div>
          <div className="w-full h-12 bg-brand-base border-[3px] border-brand-ink relative overflow-hidden">
            <motion.div 
              animate={barControls}
              className="h-full bg-brand-primary border-r-[3px] border-brand-ink"
            />
          </div>

          {/* The Cursor */}
          <motion.div
            animate={cursorControls}
            initial={{ opacity: 0, x: 100, y: 150 }}
            className="absolute -right-4 top-1/2 z-50 origin-top-left drop-shadow-[2px_2px_0px_rgba(10,10,10,1)]"
          >
            <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2.37346 1.83155L29.3512 12.012C31.5796 12.8526 31.849 15.9388 29.8052 17.1994L20.8037 22.7501C20.4072 22.9947 20.0886 23.3421 19.8785 23.7583L14.9351 33.5471C13.8214 35.7533 10.6013 35.6323 9.6806 33.3452L2.09172 14.4952L0.264177 5.61744C-0.347517 2.6433 2.37346 1.83155 2.37346 1.83155Z" fill="white" stroke="#0A0A0A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </motion.div>
        </div>

        {/* Option B: Static */}
        <div className="relative w-full">
          <div className="flex justify-between font-bold mb-3 text-lg text-brand-ink">
            <span>Remix</span>
            <span className="tabular-nums">{clicked ? "15%" : "0%"}</span>
          </div>
          <div className="w-full h-12 bg-brand-base border-[3px] border-brand-ink relative overflow-hidden">
            <motion.div 
              animate={{ width: clicked ? "15%" : "0%" }}
              transition={{ type: "spring", stiffness: 40, damping: 15 }}
              className="h-full bg-brand-secondary border-r-[3px] border-brand-ink"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
