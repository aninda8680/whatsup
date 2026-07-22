import React from 'react';
import { Slide } from '@/hooks/useSession';

interface SlideRendererProps {
  slide: Slide;
}

export function SlideRenderer({ slide }: SlideRendererProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto py-12 px-4">
      <h2 className="text-4xl md:text-5xl font-black text-center mb-8 bg-white border-[4px] border-black p-6 shadow-brutal-lg leading-tight w-full">
        {slide.prompt}
      </h2>
      
      {/* For info slides, we might render additional static content here if we add that to the Slide model */}
      {slide.type === 'info' && slide.options?.[0]?.label && (
        <div className="mt-8 text-2xl font-bold bg-brand-blue border-[3px] border-black p-8 shadow-brutal w-full">
          {slide.options[0].label}
        </div>
      )}
    </div>
  );
}
