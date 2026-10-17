import React from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export const DemoBanner: React.FC = () => {
  return (
    <div className="bg-amber-500 text-slate-900 border-b border-amber-600 px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-between no-print shadow-sm">
      <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
        <ShieldAlert className="w-4 h-4 flex-shrink-0 text-slate-950" />
        <span className="font-bold tracking-wide uppercase bg-amber-600 text-white px-2 py-0.5 rounded text-[11px]">
          Demo Mode — Sample Data
        </span>
        <span className="hidden sm:inline text-slate-950 font-normal">
          Working prototype only. Not an official GST portal, tax filing tool, or live payment gateway. All figures, GSTINs, and transactions are simulated.
        </span>
        <span className="sm:hidden text-slate-950">
          Prototype only. Simulated GST & payments.
        </span>
      </div>
    </div>
  );
};
