import React, { useEffect, useState } from 'react';
import { Receipt, Plus, FileSpreadsheet, AlertCircle, CheckCircle, X, Trash2 } from 'lucide-react';
import { api, formatInr, formatDate } from '../services/api';
import { Product } from '../types';
import { useApp } from '../context/AppContext';

export const RetailerPurchasesPage: React.FC = () => {
  const { showNotification } = useApp();
  const [purchases, setPurchases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Purchase Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState('sup_1');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [supplyType, setSupplyType] = useState<'INTRA_STATE' | 'INTER_STATE'>('INTRA_STATE');
  const [notes, setNotes] = useState('');
  
  const [purchaseLines, setPurchaseLines] = useState<Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitCostPaise: number;
    taxRatePercent: number;
  }>>([]);
  const [submitting, setSubmitting] = useState(false);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchases();
      setPurchases(res.purchases);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPurchases();
  }, []);

  const openNewPurchaseModal = async () => {
    try {
      const [prodRes] = await Promise.all([
        api.getProducts(),
      ]);
      setProducts(prodRes.products);

      // Define standard suppliers
      setSuppliers([
        { id: 'sup_1', name: 'Apex FMCG Distributors Pvt Ltd', gstin: '27AABCA1234F1Z1', state: 'Maharashtra' },
        { id: 'sup_2', name: 'Heritage Agro Commodities Corp', gstin: '03AABCH5678K1Z2', state: 'Punjab' },
        { id: 'sup_3', name: 'Bharat Office & Stationery Wholesale', gstin: '07AABCB9012M1Z3', state: 'Delhi' },
      ]);

      setInvoiceNo(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      
      if (prodRes.products.length > 0) {
        const first = prodRes.products[0];
        setPurchaseLines([
          {
            productId: first.id,
            productName: first.name,
            quantity: 20,
            unitCostPaise: first.cost_price_paise || Math.round(first.price_paise * 0.8),
            taxRatePercent: first.tax_rate_percent,
          }
        ]);
      }

      setModalOpen(true);
    } catch (err: any) {
      showNotification('Failed to initialize purchase form', 'error');
    }
  };

  const addLine = () => {
    if (products.length === 0) return;
    const prod = products[0];
    setPurchaseLines(prev => [
      ...prev,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: 10,
        unitCostPaise: prod.cost_price_paise || Math.round(prod.price_paise * 0.8),
        taxRatePercent: prod.tax_rate_percent,
      }
    ]);
  };

  const removeLine = (idx: number) => {
    setPurchaseLines(prev => prev.filter((_, i) => i !== idx));
  };

  const updateLineProduct = (idx: number, productId: string) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    setPurchaseLines(prev => prev.map((l, i) => {
      if (i === idx) {
        return {
          ...l,
          productId: prod.id,
          productName: prod.name,
          unitCostPaise: prod.cost_price_paise || Math.round(prod.price_paise * 0.8),
          taxRatePercent: prod.tax_rate_percent,
        };
      }
      return l;
    }));
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseLines.length === 0 || !invoiceNo) {
      showNotification('Please add at least one line item and an invoice reference number', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        supplierId: selectedSupplierId,
        invoiceNo,
        supplyType,
        lines: purchaseLines,
        notes,
      };

      await api.recordPurchase(payload);
      showNotification('Purchase received and inventory updated in ledger!', 'success');
      setModalOpen(false);
      loadPurchases();
    } catch (err: any) {
      showNotification(err.message || 'Failed to record purchase', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/retailer/reports/export-csv?type=purchases', '_blank');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inward Stock Purchases & Supplier Register
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Record supplier wholesale bills; automatically increases inventory and logs purchase input GST.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openNewPurchaseModal}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Record Inward Purchase
          </button>

          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Purchases Register Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Invoice No</th>
                <th className="py-3 px-4">Supplier & GSTIN</th>
                <th className="py-3 px-4">Supply Type</th>
                <th className="py-3 px-4 text-right">Taxable Subtotal (₹)</th>
                <th className="py-3 px-4 text-right">GST (₹)</th>
                <th className="py-3 px-4 text-right">Total (₹)</th>
                <th className="py-3 px-4 text-center">ITC Review Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                    Loading purchase records...
                  </td>
                </tr>
              ) : purchases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                    No purchase records found. Record your first wholesale stock delivery above.
                  </td>
                </tr>
              ) : (
                purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 text-slate-600 font-sans">
                      {p.date ? p.date.substring(0, 10) : '-'}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {p.invoice_no}
                    </td>
                    <td className="py-3 px-4 font-sans">
                      <div className="font-semibold text-slate-800">{p.supplier_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{p.supplier_gstin}</div>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-600">
                      {p.supply_type === 'INTRA_STATE' ? 'Intra-State (CGST+SGST)' : 'Inter-State (IGST)'}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {formatInr(p.taxable_subtotal_paise)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-blue-700">
                      {formatInr(p.total_tax_paise)}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-slate-900">
                      {formatInr(p.total_paise)}
                    </td>
                    <td className="py-3 px-4 text-center font-sans">
                      <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                        {p.itc_status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-lg text-slate-900">Record Inward Stock Purchase</h3>
                <p className="text-xs text-slate-500">
                  Records purchase invoice and increments shop stock in ledger
                </p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Wholesale Supplier
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.state})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Supplier Invoice / Bill No
                  </label>
                  <input
                    type="text"
                    required
                    value={invoiceNo}
                    onChange={e => setInvoiceNo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    GST Supply Type
                  </label>
                  <select
                    value={supplyType}
                    onChange={e => setSupplyType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="INTRA_STATE">Intra-State Supply (CGST 50% + SGST 50%)</option>
                    <option value="INTER_STATE">Inter-State Supply (100% IGST)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Remarks / Delivery Challan
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Delivered via tempo"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  />
                </div>
              </div>

              {/* Line Items */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">
                    Invoice Line Items ({purchaseLines.length})
                  </span>
                  <button
                    type="button"
                    onClick={addLine}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Item
                  </button>
                </div>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {purchaseLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex-1">
                        <select
                          value={line.productId}
                          onChange={e => updateLineProduct(idx, e.target.value)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} (GST {p.tax_rate_percent}%)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-20">
                        <label className="text-[10px] text-slate-400 block">Quantity</label>
                        <input
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setPurchaseLines(prev => prev.map((l, i) => i === idx ? { ...l, quantity: val } : l));
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono font-bold text-center"
                        />
                      </div>

                      <div className="w-24">
                        <label className="text-[10px] text-slate-400 block">Unit Cost (₹)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={(line.unitCostPaise / 100).toFixed(2)}
                          onChange={e => {
                            const paise = Math.round(Number(e.target.value) * 100);
                            setPurchaseLines(prev => prev.map((l, i) => i === idx ? { ...l, unitCostPaise: paise } : l));
                          }}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded font-mono text-right"
                        />
                      </div>

                      {purchaseLines.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLine(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1.5 mt-3"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 border-t pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || purchaseLines.length === 0}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold transition shadow-xs disabled:bg-slate-300"
                >
                  {submitting ? 'Recording & Receiving Stock...' : 'Save Purchase & Receive Stock'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
