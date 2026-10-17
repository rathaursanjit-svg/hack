import React, { useEffect, useState } from 'react';
import { 
  Calculator, 
  FileSpreadsheet, 
  AlertTriangle, 
  Info, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  FileText 
} from 'lucide-react';
import { api, formatInr, formatDate } from '../services/api';
import { useApp } from '../context/AppContext';

export const RetailerGstPage: React.FC = () => {
  const { showNotification } = useApp();
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'SALES' | 'PURCHASES'>('SUMMARY');
  const [metrics, setMetrics] = useState<any>(null);
  const [salesRegister, setSalesRegister] = useState<any[]>([]);
  const [purchaseRegister, setPurchaseRegister] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadGstData = async () => {
    setLoading(true);
    try {
      const [dashRes, salesRes, purRes] = await Promise.all([
        api.getRetailerDashboard(),
        api.getSalesRegister(),
        api.getPurchases(),
      ]);
      setMetrics(dashRes.metrics);
      setSalesRegister(salesRes.register);
      setPurchaseRegister(purRes.purchases);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGstData();
  }, []);

  const handleExportCsv = (type: 'sales' | 'purchases') => {
    window.open(`/api/retailer/reports/export-csv?type=${type}`, '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
            Prototype Tax Accounting Engine
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            GST Registers & Estimated Tax Liability
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Outward sales register, inward purchase register, and sample net tax calculation.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportCsv('sales')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
            Export Sales Register CSV
          </button>
          <button
            onClick={() => handleExportCsv('purchases')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export Purchase Register CSV
          </button>
        </div>
      </div>

      {/* Mandatory Prototype Tax Disclaimer */}
      <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-4 text-xs text-amber-950 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-amber-900">
          <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
          PROTOTYPE TAX SUMMARY — NOT AN OFFICIAL STATUTORY RETURN
        </div>
        <p className="text-[11px] text-amber-900">
          This system provides simulated mathematical estimates based on recorded demo transactions. It does not file official GSTR-1, GSTR-3B, or GSTR-2B returns with GSTN / government servers. Input Tax Credit (ITC) eligibility requires statutory reconciliation, physical tax invoice matching, and verification of supplier filing status under GST laws.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('SUMMARY')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'SUMMARY'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Estimated Tax Position
        </button>

        <button
          onClick={() => setActiveTab('SALES')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'SALES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-blue-600" />
          Outward Sales Register ({salesRegister.length})
        </button>

        <button
          onClick={() => setActiveTab('PURCHASES')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'PURCHASES'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          Inward Purchase Register ({purchaseRegister.length})
        </button>
      </div>

      {/* Tab 1: Estimated Tax Position Cards */}
      {activeTab === 'SUMMARY' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* Output Tax Collected */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                1. Output GST Collected (Sales)
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatInr(metrics.gstOutputTaxPaise)}
              </div>
              <div className="text-[11px] text-slate-500">
                Sum of CGST, SGST & IGST collected on outgoing sales invoices.
              </div>
            </div>

            {/* Input Tax Credit (Subject to Review) */}
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  2. Input GST Paid (Purchases)
                </span>
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                  Needs Review
                </span>
              </div>
              <div className="text-2xl font-black text-blue-700 font-mono">
                {formatInr(metrics.gstInputTaxPaise)}
              </div>
              <div className="text-[11px] text-amber-700 font-medium">
                Potential Input Tax Credit (ITC). Requires GSTR-2B matching before setoff.
              </div>
            </div>

            {/* Net Estimated Tax Payable */}
            <div className="bg-white p-5 rounded-xl border-2 border-slate-900 shadow-xs space-y-2">
              <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                3. Estimated Net GST Payable
              </span>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatInr(metrics.estimatedNetGstPayablePaise)}
              </div>
              <div className="text-[11px] text-slate-500">
                Formula: Max(0, Output GST − Claimable Input Tax Credit)
              </div>
            </div>

          </div>

          {/* Breakdown Explanation Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Sample GST Computation Methodology
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-200 rounded-lg">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b">
                  <tr>
                    <th className="py-2.5 px-3">Tax Parameter</th>
                    <th className="py-2.5 px-3">Calculation Basis</th>
                    <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold">Total Taxable Sales (Outward)</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">Customer transactions excluding GST</td>
                    <td className="py-2.5 px-3 text-right font-bold">{formatInr(metrics.totalSalesRevenuePaise)}</td>
                    <td className="py-2.5 px-3 text-center font-sans text-emerald-600 font-bold">Recorded</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold">Gross GST Output Liability</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">Line item rate applications (0%, 5%, 12%, 18%, 28%)</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatInr(metrics.gstOutputTaxPaise)}</td>
                    <td className="py-2.5 px-3 text-center font-sans text-blue-600 font-bold">Liability</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 px-3 font-sans font-semibold">Potential Input Tax Credit (ITC)</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">Taxes recorded on wholesale supplier inward bills</td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-700">{formatInr(metrics.gstInputTaxPaise)}</td>
                    <td className="py-2.5 px-3 text-center font-sans text-amber-700 font-bold">Needs Review</td>
                  </tr>
                  <tr className="bg-slate-50 font-bold font-sans">
                    <td className="py-2.5 px-3 text-slate-900">Estimated Net Cash Payable</td>
                    <td className="py-2.5 px-3 text-slate-500 font-normal">Pending reconciliation and adjustments</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-900">{formatInr(metrics.estimatedNetGstPayablePaise)}</td>
                    <td className="py-2.5 px-3 text-center text-slate-700">Estimate Only</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Outward Sales Register */}
      {activeTab === 'SALES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Invoice / Order</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Supply Type</th>
                  <th className="py-3 px-3 text-right">Taxable Val (₹)</th>
                  <th className="py-3 px-3 text-right">CGST (₹)</th>
                  <th className="py-3 px-3 text-right">SGST (₹)</th>
                  <th className="py-3 px-3 text-right">IGST (₹)</th>
                  <th className="py-3 px-3 text-right">Total Tax (₹)</th>
                  <th className="py-3 px-3 text-right">Invoice Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {salesRegister.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-500 font-sans">{row.date?.substring(0, 10)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.invoice_number || row.order_number}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">{row.customer_name}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">{row.supply_type}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{formatInr(row.taxable_subtotal_paise)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatInr(row.cgst_paise)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatInr(row.sgst_paise)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatInr(row.igst_paise)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-700">{formatInr(row.total_tax_paise)}</td>
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">{formatInr(row.total_paise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Inward Purchase Register */}
      {activeTab === 'PURCHASES' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Invoice No</th>
                  <th className="py-3 px-3">Supplier & GSTIN</th>
                  <th className="py-3 px-3">Supply Type</th>
                  <th className="py-3 px-3 text-right">Taxable (₹)</th>
                  <th className="py-3 px-3 text-right">CGST (₹)</th>
                  <th className="py-3 px-3 text-right">SGST (₹)</th>
                  <th className="py-3 px-3 text-right">IGST (₹)</th>
                  <th className="py-3 px-3 text-right">Total Tax (₹)</th>
                  <th className="py-3 px-3 text-center">ITC Review Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {purchaseRegister.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 text-slate-500 font-sans">{row.date?.substring(0, 10)}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{row.invoice_no}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-slate-800">{row.supplier_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{row.supplier_gstin}</div>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-500">{row.supply_type}</td>
                    <td className="py-2.5 px-3 text-right text-slate-700">{formatInr(row.taxable_subtotal_paise)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatInr(row.cgst_paise)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatInr(row.sgst_paise)}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{formatInr(row.igst_paise)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-blue-700">{formatInr(row.total_tax_paise)}</td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        {row.itc_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};
