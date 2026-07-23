import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';
import { Slide } from '@/hooks/useSession';

interface LiveChartProps {
  slide: Slide;
  tally: Record<string, any>;
}

// Vibrant colors for the charts
const COLORS = ['#ffde59', '#5ce1e6', '#ff66c4', '#7ed957', '#ff914d', '#a388ff', '#ff3131'];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white border-[2px] border-black px-4 py-2 shadow-brutal text-center rounded-sm">
        <p className="font-black text-xl">Count: {data.count}</p>
      </div>
    );
  }
  return null;
};

export function LiveChart({ slide, tally }: LiveChartProps) {
  const [activeIndex, setActiveIndex] = useState(-1);

  if (!slide || !tally) return null;

  if (slide.type === 'mcq_single' || slide.type === 'mcq_multi') {
    const data = (slide.options || []).map((opt, index) => {
      const tallyData = tally[opt.id];
      let namesArray: string[] = [];
      let count = 0;
      if (Array.isArray(tallyData)) {
        namesArray = tallyData;
        count = namesArray.length;
      } else if (typeof tallyData === 'number') {
        count = tallyData;
      }

      return {
        id: opt.id,
        name: opt.label.replace(/^[A-D]\.\s*/, ''),
        shortName: String.fromCharCode(65 + index), // A, B, C, D...
        count: count,
        names: namesArray,
      };
    });

    return (
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
            <XAxis dataKey="shortName" tick={{ fill: 'black', fontWeight: 'bold' }} interval={0} />
            <YAxis allowDecimals={false} tick={{ fill: 'black', fontWeight: 'bold' }} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.05)' }} offset={50} />
            <Bar 
              dataKey="count" 
              radius={[4, 4, 0, 0]} 
              stroke="black" 
              strokeWidth={3}
              label={(props: any) => {
                const { x, y, width, height, index } = props;
                if (index !== activeIndex) return null;
                const names = data[index]?.names || [];
                if (!names.length) return null;

                const cx = x + width / 2;
                return (
                  <text 
                    x={cx} 
                    y={Math.max(y + 12, 16)} 
                    fill="black" 
                    textAnchor="middle" 
                    dominantBaseline="hanging"
                    className="font-black text-sm md:text-base z-10"
                    style={{ pointerEvents: 'none' }}
                  >
                    {names.map((name: string, i: number) => (
                      <tspan x={cx} dy={i === 0 ? 0 : 20} key={i}>
                        {name}
                      </tspan>
                    ))}
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]} 
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(-1)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (slide.type === 'wordcloud') {
    // Simple custom word cloud layout
    const words = Object.keys(tally).map(word => ({
      text: word,
      value: tally[word] as number,
    })).sort((a, b) => b.value - a.value);
    
    if (words.length === 0) return <div className="text-center text-gray-500 italic p-10 font-bold border-[3px] border-black bg-gray-50">Waiting for responses...</div>;

    const maxCount = Math.max(...words.map(w => w.value));

    return (
      <div className="flex flex-wrap justify-center items-center gap-4 p-8 border-[3px] border-black shadow-brutal bg-white min-h-[300px]">
        {words.map((word, i) => (
          <span
            key={word.text}
            style={{
              fontSize: `${Math.max(1.5, (word.value / maxCount) * 4)}rem`,
              color: COLORS[i % COLORS.length],
              textShadow: '2px 2px 0px black',
              fontWeight: 900
            }}
            className="transition-all duration-300 ease-in-out"
          >
            {word.text}
          </span>
        ))}
      </div>
    );
  }

  if (slide.type === 'rating') {
    // Rating tally shape: { '1': count, '2': count, ..., sum: number, n: number }
    const counts = [1, 2, 3, 4, 5].map(rating => ({
      name: `${rating} Star${rating > 1 ? 's' : ''}`,
      count: tally[rating.toString()] || 0
    }));
    
    const sum = tally.sum || 0;
    const n = tally.n || 0;
    const average = n > 0 ? (sum / n).toFixed(1) : '0.0';

    return (
      <div className="w-full flex flex-col items-center">
        <div className="text-5xl font-black mb-8 p-4 bg-brand-yellow border-[3px] border-black shadow-brutal">
          {average} <span className="text-2xl">avg</span>
        </div>
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={counts} margin={{ top: 20, right: 30, left: 20, bottom: 5 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} />
              <YAxis dataKey="name" type="category" tick={{ fill: 'black', fontWeight: 'bold' }} width={80} />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                contentStyle={{ border: '3px solid black', borderRadius: 0, boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)' }}
              />
              <Bar dataKey="count" fill="#5ce1e6" stroke="black" strokeWidth={3} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 border-[3px] border-dashed border-gray-400 text-center font-bold text-gray-500 bg-gray-50">
      Visualization for '{slide.type}' not yet implemented.
    </div>
  );
}
