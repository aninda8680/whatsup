import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';
import { Slide, Tally, McqTally, RatingTally, WordcloudTally } from '@/lib/types';

interface LiveChartProps {
  slide: Slide;
  tally: Tally;
}

// Vibrant colors for the charts
const COLORS = ['#ffde59', '#5ce1e6', '#ff66c4', '#7ed957', '#ff914d', '#a388ff', '#ff3131'];

const TOOLTIP_STYLE = { border: '3px solid black', borderRadius: 0, boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' };

function McqChart({ slide, tally }: LiveChartProps) {
  if (!slide || !tally) return null;

  if (slide.type === 'mcq_single' || slide.type === 'mcq_multi') {
    const data = (slide.options || []).map((opt, index) => ({
      name: opt.label,
      shortName: String.fromCharCode(65 + index), // A, B, C, D...
      count: (tally as McqTally).counts[opt.id] || 0,
    }));

    return (
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
            <XAxis dataKey="shortName" tick={{ fill: 'black', fontWeight: 'bold' }} interval={0} />
            <YAxis allowDecimals={false} tick={{ fill: 'black', fontWeight: 'bold' }} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.05)' }}
              contentStyle={TOOLTIP_STYLE}
            />
            <Bar dataKey="count" radius={[4, 4, 0, 0]} stroke="black" strokeWidth={3}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }
  return null;
}

function WordcloudChart({ tally }: { tally: WordcloudTally }) {
  const words = Object.entries(tally.words)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value);

  if (words.length === 0) {
    return (
      <div className="text-center text-gray-500 italic p-10 font-bold border-[3px] border-black bg-gray-50">
        Waiting for responses...
      </div>
    );
  }

  const maxCount = Math.max(...words.map((w) => w.value));

  return (
    <div
      className="flex flex-wrap justify-center items-center gap-4 p-8 border-[3px] border-black shadow-brutal bg-white min-h-[200px]"
      role="img"
      aria-label="Word cloud of participant responses"
    >
      {words.map((word, i) => (
        <span
          key={word.text}
          style={{
            fontSize: `${Math.max(1.25, (word.value / maxCount) * 4)}rem`,
            color: COLORS[i % COLORS.length],
            textShadow: '2px 2px 0px black',
            fontWeight: 900,
          }}
          className="transition-all duration-300 ease-in-out"
        >
          {word.text}
        </span>
      ))}
    </div>
  );
}

function RatingChart({ tally }: { tally: RatingTally }) {
  const counts = [1, 2, 3, 4, 5].map((rating) => ({
    name: `${rating} Star${rating > 1 ? 's' : ''}`,
    count: tally.counts[rating.toString()] ?? 0,
  }));

  const average = tally.n > 0 ? (tally.sum / tally.n).toFixed(1) : '0.0';

  return (
    <div className="w-full flex flex-col items-center">
      <div className="text-5xl font-black mb-8 p-4 bg-brand-yellow border-[3px] border-black shadow-brutal">
        {average} <span className="text-2xl">avg</span>
      </div>
      <div className="w-full" style={{ aspectRatio: '16/7', minHeight: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={counts}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            layout="vertical"
            role="img"
            aria-label={`Rating distribution bar chart. Average: ${average}`}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} />
            <XAxis type="number" allowDecimals={false} />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: 'black', fontWeight: 'bold' }}
              width={80}
            />
            <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={TOOLTIP_STYLE} />
            <Bar dataKey="count" fill="#5ce1e6" stroke="black" strokeWidth={3} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export function LiveChart({ slide, tally }: LiveChartProps) {
  if (!slide || !tally) return null;

  if (tally.type === 'mcq') {
    return <McqChart slide={slide} tally={tally} />;
  }

  if (tally.type === 'wordcloud') {
    return <WordcloudChart tally={tally} />;
  }

  if (tally.type === 'rating') {
    return <RatingChart tally={tally} />;
  }

  return (
    <div className="p-8 border-[3px] border-dashed border-gray-400 text-center font-bold text-gray-500 bg-gray-50">
      Visualization for &apos;{slide.type}&apos; not yet implemented.
    </div>
  );
}
