import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Receipt, 
  AlertTriangle, 
  Calculator, 
  Boxes, 
  FileSpreadsheet, 
  Plus, 
  Info,
  Calendar
} from 'lucide-react';
import { api, formatInr } from '../services/api';
import { DashboardMetrics } from '../types';
import { useApp } from '../context/AppContext';

export const RetailerDashboardPage: React.FC = () => {
  const { currentUser, demoUsers, switchUser } = useApp();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'ALL' | '7D' | '30D'>('ALL');

  const fetchDashboard = async () => {
    if (currentUser && currentUser.role !== 'retailer' && currentUser.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      let startDate: string | undefined;
      const now = new Date();
      if (dateRange === '7D') {
        const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        startDate = d.toISOString();
      } else if (dateRange === '30D') {
        const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        startDate = d.toISOString();
      }

      const res = await api.getRetailerDashboard({ startDate });
      setMetrics(res.metrics);
    } catch (err) {
      console.error('Error loading retailer dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [dateRange, currentUser]);

  const isAuthorized = currentUser?.role === 'retailer' || currentUser?.role === 'admin';

  if (!isAuthorized) {
    const retailerUsers = demoUsers.filter(u => u.role === 'retailer');
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-md p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center mx-auto text-xl">
          🏪
        </div>
        <h2 className="text-xl font-black text-slate-900">Retailer Portal Access</h2>
        <p className="text-xs text-slate-500">
          You are currently viewing as <strong>{currentUser?.name} ({currentUser?.role})</strong>.
          Switch to one of the 5 Kirana Shopkeeper demo personas below to view store dashboards, inventory, and GST records:
        </p>
        <div className="grid grid-cols-1 gap-2 pt-2">
          {retailerUsers.map(u => (
            <button
              key={u.id}
              onClick={() => switchUser(u)}
              className="p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left transition flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">{u.name}</div>
                <div className="text-[11px] text-slate-500">{u.shop_name} • GSTIN: {u.shop_gstin}</div>
              </div>
              <span className="text-xs font-bold text-blue-600">Switch →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
              Retailer HQ
            </span>
            <span className="text-xs font-mono text-slate-500">
              Store ID: {currentUser?.shop_id || 'shp_1'} • {currentUser?.shop_name || 'Sharma Kirana Store'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Store Performance & Financial Overview
          </h1>
        </div>

        {/* Date Filter & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs">
            {(['ALL', '30D', '7D'] as const).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition ${
                  dateRange === range
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {range === 'ALL' ? 'All Time' : range === '30D' ? 'Last 30 Days' : 'Last 7 Days'}
              </button>
            ))}
          </div>

          <Link
            to="/retailer/purchases"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Inward Stock
          </Link>

          <Link
            to="/retailer/expenses"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <DollarSign className="w-3.5 h-3.5" />
            Record Expense
          </Link>
        </div>
      </div>

      {loading || !metrics ? (
        <div className="py-24 text-center text-slate-500 font-medium">
          Aggregating store ledger records, purchases, and estimated GST balances...
        </div>
      ) : (
        <div className="space-y-6">

          {/* Primary Financial Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Sales Revenue (Excl GST) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Gross Sales (Excl. Tax)</span>
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatInr(metrics.totalSalesRevenuePaise)}
              </div>
              <div className="text-[11px] text-slate-400">
                From {metrics.totalOrdersCount} completed / active customer orders
              </div>
            </div>

            {/* Estimated Gross Profit */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Est. Gross Profit</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-700 font-mono">
                {formatInr(metrics.totalGrossProfitPaise)}
              </div>
              <div className="text-[11px] text-slate-400">
                Sales Revenue minus recorded Cost of Goods Sold (COGS)
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-xs font-bold uppercase tracking-wider">Operating Expenses</span>
                <TrendingDown className="w-4 h-4 text-rose-500" />
              </div>
              <div className="text-2xl font-black text-rose-600 font-mono">
                {formatInr(metrics.totalOperatingExpensesPaise)}
              </div>
              <div className="text-[11px] text-slate-400">
                Rent, wages, electricity & packaging recorded
              </div>
            </div>

            {/* Estimated Net Profit */}
            <div className="bg-white p-5 rounded-xl border-2 border-emerald-500/30 bg-emerald-50/20 shadow-xs space-y-2">
              <div className="flex items-center justify-between text-emerald-800">
                <span className="text-xs font-bold uppercase tracking-wider">Est. Net Profit</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatInr(metrics.estimatedNetProfitPaise)}
              </div>
              <div className="text-[11px] text-emerald-700 font-medium">
                Gross Profit minus Operating Expenses
              </div>
            </div>

          </div>

          {/* GST Summary & Inventory Health Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* GST Position Card (2 Cols) */}
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Calculator className="w-4 h-4 text-blue-600" />
                    GST Prototype Liability & Position
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Output GST collected versus input tax paid on wholesale purchases
                  </p>
                </div>
                <Link
                  to="/retailer/gst"
                  className="text-xs font-bold text-blue-600 hover:text-blue-800"
                >
                  View Details & Registers →
                </Link>
              </div>

              {/* GST 3-Way Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                
                {/* Output Tax */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Output GST (Collected)
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-900">
                    {formatInr(metrics.gstOutputTaxPaise)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Collected on customer invoices (Liability, not revenue)
                  </div>
                </div>

                {/* Input Tax */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Input GST (Paid on Purchases)
                  </span>
                  <div className="text-xl font-bold font-mono text-blue-700">
                    {formatInr(metrics.gstInputTaxPaise)}
                  </div>
                  <div className="text-[10px] text-amber-700 font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600 flex-shrink-0" />
                    Status: Needs review
                  </div>
                </div>

                {/* Est Net Payable */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">
                    Est. Net Tax Payable
                  </span>
                  <div className="text-xl font-bold font-mono text-slate-900">
                    {formatInr(metrics.estimatedNetGstPayablePaise)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    Output Tax − Eligible ITC (Subject to 2B reconciliation)
                  </div>
                </div>

              </div>

              {/* Prototype GST Notice */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-3 text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  <strong>Prototype Accounting Rule:</strong> GST collected is held in fiduciary capacity as a tax liability and is never added to gross sales revenue or business profits. Purchase taxes require statutory verification and GSTR-2B matching before claiming Input Tax Credit.
                </span>
              </div>
            </div>

            {/* Inventory Valuation & Alerts Card */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-emerald-600" />
                    Inventory Valuation
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live valuation of active shop stock
                  </p>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Total Warehouse & Shelf Valuation
                  </div>
                  <div className="text-2xl font-black text-slate-900 font-mono">
                    {formatInr(metrics.totalInventoryValuationPaise)}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Calculated on cost basis of unsold inventory
                  </div>
                </div>

                {/* Low Stock Alert */}
                <div className={`p-4 rounded-xl border flex items-center justify-between ${
                  metrics.lowStockItemsCount > 0 
                    ? 'bg-amber-50 border-amber-300 text-amber-900' 
                    : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                }`}>
                  <div>
                    <div className="text-xs font-bold">
                      {metrics.lowStockItemsCount > 0 ? 'Low Stock Warning' : 'Healthy Inventory'}
                    </div>
                    <div className="text-[11px] opacity-80">
                      {metrics.lowStockItemsCount > 0 
                        ? `${metrics.lowStockItemsCount} items at or below minimum threshold`
                        : 'All items have sufficient stock'}
                    </div>
                  </div>
                  <Link
                    to="/retailer/inventory"
                    className="px-2.5 py-1 bg-white rounded-lg text-xs font-bold shadow-xs hover:bg-slate-50 transition"
                  >
                    Manage
                  </Link>
                </div>
              </div>

              <div className="border-t pt-3">
                <Link
                  to="/retailer/pnl"
                  className="w-full flex items-center justify-center gap-1.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                  View Complete P&L Statement
                </Link>
              </div>
            </div>

          </div>

          {/* Sales Trend Bar / Visual Representation */}
          {metrics.salesByDay && metrics.salesByDay.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Daily Sales & Estimated Gross Margin Trend
                  </h3>
                  <p className="text-xs text-slate-500">
                    Underlying completed customer orders by date
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 pt-2">
                {metrics.salesByDay.map(day => (
                  <div key={day.date} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center space-y-1">
                    <div className="text-[11px] font-bold text-slate-500">{day.date}</div>
                    <div className="text-xs font-black text-slate-900 font-mono">
                      {formatInr(day.salesPaise)}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold font-mono">
                      Margin: {formatInr(day.profitPaise)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};
