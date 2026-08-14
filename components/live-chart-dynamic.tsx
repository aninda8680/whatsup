/**
 * components/live-chart-dynamic.tsx
 *
 * WHY this wrapper exists instead of using next/dynamic inline:
 * If every page that renders a chart writes its own `dynamic(() => import('./live-chart'), ...)`
 * call, they all create separate dynamic chunks with separate load states. A
 * wrapper module means there's a single entry point — bundle splitting is
 * consistent and consumers don't need to remember the ssr:false flag.
 *
 * Usage:
 *   import { LiveChart } from '@/components/live-chart-dynamic';
 *   // NOT from '@/components/live-chart' (that file is used only by this one)
 */

import dynamic from 'next/dynamic';
import type { ComponentProps } from 'react';
import type { LiveChart as LiveChartType } from './live-chart';

// ssr: false because recharts uses ResizeObserver and SVG measurement APIs that
// don't exist in the Node.js/RSC environment. Without this flag, the build fails
// with "ReferenceError: ResizeObserver is not defined".
const LiveChartNoSSR = dynamic(
  () => import('./live-chart').then((m) => ({ default: m.LiveChart })),
  {
    ssr: false,
    loading: () => (
      <div className="w-full flex items-center justify-center border-[3px] border-black bg-gray-50 font-bold text-gray-400" style={{ minHeight: 200 }}>
        Loading chart...
      </div>
    ),
  }
);

// Re-export with the same name so call sites only need to change the import path.
export const LiveChart = LiveChartNoSSR as typeof LiveChartType;
