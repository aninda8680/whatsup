import React, { useState } from 'react';
import { Slide } from '@/hooks/useSession';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface ResponseInputProps {
  slide: Slide;
  onSubmit: (value: any) => Promise<void>;
  isSubmitting?: boolean;
}

export function ResponseInput({ slide, onSubmit, isSubmitting = false }: ResponseInputProps) {
  const [value, setValue] = useState<any>(
    slide.type === 'mcq_multi' ? [] : 
    slide.type === 'rating' ? 3 : 
    ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value === '' || (Array.isArray(value) && value.length === 0)) return;
    onSubmit(value);
  };

  if (slide.type === 'mcq_single') {
    return (
      <div className="flex flex-col gap-4">
        {slide.options?.map((opt) => (
          <button
            key={opt.id}
            type="button"
            disabled={isSubmitting}
            onClick={() => {
              if (isSubmitting) return;
              setValue(opt.id);
              onSubmit(opt.id);
            }}
            className={`p-4 text-left border-[3px] border-black transition-all font-bold text-lg ${
              value === opt.id 
                ? 'bg-brand-yellow shadow-brutal-active translate-y-1 translate-x-1' 
                : 'bg-white shadow-brutal hover:-translate-y-0.5 hover:shadow-brutal-lg'
            } ${isSubmitting && value !== opt.id ? 'opacity-50' : ''}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  if (slide.type === 'mcq_multi') {
    const toggleOption = (id: string) => {
      setValue((prev: string[]) => 
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
    };

    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {slide.options?.map((opt) => {
          const isSelected = value.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggleOption(opt.id)}
              className={`p-4 text-left border-[3px] border-black transition-all font-bold text-lg flex items-center gap-3 ${
                isSelected 
                  ? 'bg-brand-blue shadow-brutal-active translate-y-1 translate-x-1' 
                  : 'bg-white shadow-brutal hover:-translate-y-0.5 hover:shadow-brutal-lg'
              }`}
            >
              <div className={`w-6 h-6 border-[3px] border-black flex items-center justify-center ${isSelected ? 'bg-black text-white' : 'bg-white'}`}>
                {isSelected && <span>✓</span>}
              </div>
              {opt.label}
            </button>
          );
        })}
        <Button 
          type="submit" 
          variant="primary" 
          size="lg" 
          className="mt-4"
          disabled={value.length === 0 || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    );
  }

  if (slide.type === 'wordcloud' || slide.type === 'open_text') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={slide.type === 'wordcloud' ? "Enter a word or short phrase..." : "Type your answer..."}
          className="h-16 text-lg p-4"
          maxLength={slide.type === 'wordcloud' ? 40 : 300}
        />
        <Button 
          type="submit" 
          variant="primary" 
          size="lg"
          disabled={!value.trim() || isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </form>
    );
  }

  if (slide.type === 'rating') {
    return (
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        <div className="flex justify-between items-center bg-white border-[3px] border-black p-6 shadow-brutal">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => setValue(rating)}
              className={`w-14 h-14 rounded-full border-[3px] border-black text-2xl font-black transition-all flex items-center justify-center ${
                value >= rating ? 'bg-brand-pink text-black' : 'bg-gray-100 text-gray-400'
              } ${value === rating ? 'scale-125 shadow-brutal' : ''}`}
            >
              {rating}
            </button>
          ))}
        </div>
        <Button 
          type="submit" 
          variant="primary" 
          size="lg"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Rating'}
        </Button>
      </form>
    );
  }
  
  if (slide.type === 'info') {
    return (
      <div className="p-8 border-[3px] border-black bg-brand-green shadow-brutal text-center font-bold text-xl">
        Look at the presentation display.
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-100 border-[3px] border-black font-bold">
      Unsupported slide type for input: {slide.type}
    </div>
  );
}
