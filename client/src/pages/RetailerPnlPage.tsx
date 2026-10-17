import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, ArrowRight, TrendingUp, TrendingDown, Info, AlertTriangle } from 'lucide-react';
import { api, formatInr } from '../services/api';
import { DashboardMetrics } from '../types';
import { useApp } from '../context/AppContext';

export const RetailerPnlPage: React.FC = () => {
  const { showNotification } = useApp();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPnl = async () => {
      setLoading(true);
      try {
        const res = await api.getRetailerDashboard();
        setMetrics(res.metrics);
      } catch (err: any) {
        showNotification(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchPnl();
  }, []);

  if (loading || !metrics) {
    return (
      <div className="py-24 text-center text-slate-500 font-medium">
        Generating profit and loss financial statements...
      </div>
    );
  }

  const cogsPaise = metrics.totalSalesRevenuePaise - metrics.totalGrossProfitPaise;
  const grossMarginPercent = metrics.totalSalesRevenuePaise > 0
    ? ((metrics.totalGrossProfitPaise / metrics.totalSalesRevenuePaise) * 100).toFixed(1)
    : '0.0';
  const netMarginPercent = metrics.totalSalesRevenuePaise > 0
    ? ((metrics.estimatedNetProfitPaise / metrics.totalSalesRevenuePaise) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Income Statement
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Estimated Profit & Loss Statement (P&L)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Internal managerial performance accounting with separate fiduciary GST reporting
          </p>
        </div>
      </div>

      {/* Main P&L Statement Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        
        {/* Table Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold tracking-tight">Statement of Operations</h2>
            <p className="text-xs text-slate-400">All amounts in Indian Rupees (₹) stored in integer paise</p>
          </div>
          <div className="text-right">
            <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-md text-emerald-400 font-mono font-bold">
              Gross Margin: {grossMarginPercent}%
            </span>
          </div>
        </div>

        {/* Statement Line Rows */}
        <div className="p-6 space-y-4 text-xs font-sans">
          
          {/* Revenue Section */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-900 pb-1 border-b">
              <span>Gross Sales Revenue (Excluding GST)</span>
              <span className="font-mono">{formatInr(metrics.totalSalesRevenuePaise)}</span>
            </div>
            <p className="text-[11px] text-slate-500 italic pl-2">
              Note: GST of {formatInr(metrics.gstOutputTaxPaise)} collected is excluded from revenue.
            </p>
          </div>

          {/* Cost of Goods Sold Section */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-slate-700 font-semibold">
              <span className="flex items-center gap-2">
                <span className="text-slate-400">Less:</span> Cost of Goods Sold (COGS)
              </span>
              <span className="font-mono text-rose-600">({formatInr(cogsPaise)})</span>
            </div>
            <p className="text-[11px] text-slate-500 italic pl-2">
              Cost basis of items actually sold to customers during the period.
            </p>
          </div>

          {/* Gross Profit Subtotal */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex justify-between items-center font-bold text-slate-900">
            <div>
              <span>Estimated Gross Profit</span>
              <div className="text-[10px] text-slate-500 font-normal">Revenue minus Cost of Goods Sold</div>
            </div>
            <span className="font-mono text-base font-black text-emerald-700">
              {formatInr(metrics.totalGrossProfitPaise)}
            </span>
          </div>

          {/* Operating Expenses Section */}
          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-slate-700 font-semibold">
              <span className="flex items-center gap-2">
                <span className="text-slate-400">Less:</span> Operating Store Expenses
              </span>
              <span className="font-mono text-rose-600">({formatInr(metrics.totalOperatingExpensesPaise)})</span>
            </div>
            <p className="text-[11px] text-slate-500 italic pl-2">
              Rent, electricity, helper wages, packaging materials, and freight.
            </p>
          </div>

          {/* Final Net Profit */}
          <div className="bg-emerald-50 p-4 rounded-xl border-2 border-emerald-300 flex justify-between items-center font-black text-slate-900">
            <div>
              <span className="text-sm">Estimated Net Profit Before Tax</span>
              <div className="text-[11px] text-emerald-800 font-normal">
                Net Margin: <strong className="font-mono">{netMarginPercent}%</strong> on sales
              </div>
            </div>
            <span className="font-mono text-xl text-emerald-800">
              {formatInr(metrics.estimatedNetProfitPaise)}
            </span>
          </div>

        </div>

      </div>

      {/* Accounting Disclosures Banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-2 text-xs text-slate-600">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-600" />
          Prototype Accounting Assumptions & Compliance Declarations
        </h3>
        <ul className="list-disc pl-5 space-y-1 text-[11px]">
          <li><strong>GST is Not Revenue:</strong> Under Indian GST regulations, tax collected on outward supplies is a pass-through statutory obligation and is excluded from both business revenue and profitability calculations.</li>
          <li><strong>Inventory Purchases vs Expenses:</strong> Wholesale inventory purchases ({formatInr(metrics.totalPurchasesCount)} invoices) are capitalized as stock assets. Only the purchase cost of units actually sold is expensed as Cost of Goods Sold.</li>
          <li><strong>Unsold Stock Asset:</strong> Current unsold inventory in shop is valued at <strong className="font-mono text-slate-800">{formatInr(metrics.totalInventoryValuationPaise)}</strong> at cost basis.</li>
          <li><strong>Prototype Status:</strong> Figures are derived from demo records for startup prototyping and require independent CPA / tax auditor verification before statutory tax filings.</li>
        </ul>
      </div>

    </div>
  );
};
