import React from 'react';
import { Slide } from '@/hooks/useSession';

interface SlideRendererProps {
  slide: Slide;
  showCorrectAnswer?: boolean;
}

export function SlideRenderer({ slide, showCorrectAnswer = false }: SlideRendererProps) {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-4xl mx-auto py-8 px-4">
      <h2 className="text-4xl md:text-5xl font-black text-center mb-8 bg-white border-[4px] border-black p-6 shadow-brutal-lg leading-tight w-full">
        {slide.prompt}
      </h2>
      
      {/* Render options for MCQ */}
      {(slide.type === 'mcq_single' || slide.type === 'mcq_multi') && slide.options && (
        <div className="w-full flex flex-col gap-4">
          {slide.options.map((opt, idx) => {
            const isCorrect = showCorrectAnswer && opt.id === slide.correctOptionId;
            return (
              <div 
                key={opt.id} 
                className={`p-4 border-[4px] border-black font-bold text-2xl flex items-center gap-6 ${isCorrect ? 'bg-brand-green shadow-brutal-lg transform -rotate-1 scale-105 z-10' : 'bg-white shadow-brutal'}`}
              >
                <span className={`w-12 h-12 flex items-center justify-center rounded-full shrink-0 border-[3px] border-black text-2xl ${isCorrect ? 'bg-black text-white' : 'bg-gray-100'}`}>
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="flex-1">{opt.label}</span>
                {isCorrect && <span className="text-4xl">✅</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* For info slides */}
      {slide.type === 'info' && slide.options?.[0]?.label && (
        <div className="mt-8 text-2xl font-bold bg-brand-blue border-[3px] border-black p-8 shadow-brutal w-full">
          {slide.options[0].label}
        </div>
      )}
    </div>
  );
}
