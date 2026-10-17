import React, { useEffect, useState } from 'react';
import { 
  Boxes, 
  Search, 
  Plus, 
  Minus, 
  History, 
  AlertTriangle, 
  FileSpreadsheet, 
  CheckCircle,
  X,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { api, formatInr, formatDate } from '../services/api';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { RoleAccessRequired } from '../components/RoleAccessRequired';

export const RetailerInventoryPage: React.FC = () => {
  const { currentUser, showNotification } = useApp();
  const [activeTab, setActiveTab] = useState<'STOCK' | 'LEDGER' | 'REORDER'>('STOCK');
  const [inventory, setInventory] = useState<Product[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  // Adjustment Modal
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);
  const [adjustDelta, setAdjustDelta] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [submittingAdjust, setSubmittingAdjust] = useState(false);

  const loadStock = async () => {
    if (currentUser && currentUser.role !== 'retailer' && currentUser.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (activeTab === 'STOCK') {
        const res = await api.getRetailerInventory({
          category: category !== 'ALL' ? category : undefined,
          search: search.trim() || undefined,
        });
        setInventory(res.inventory);
      } else if (activeTab === 'LEDGER') {
        const res = await api.getStockMovements();
        setMovements(res.movements);
      } else if (activeTab === 'REORDER') {
        const res = await api.getReorderSuggestions();
        setSuggestions(res.suggestions);
      }
    } catch (err: any) {
      console.error('Error fetching inventory:', err);
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'retailer' || currentUser?.role === 'admin') {
      loadStock();
    } else {
      setLoading(false);
    }
  }, [activeTab, category, currentUser]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStock();
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct || adjustDelta === 0 || !adjustReason) {
      showNotification('Please enter a non-zero quantity change and a valid reason', 'error');
      return;
    }

    setSubmittingAdjust(true);
    try {
      await api.adjustInventory({
        productId: adjustModalProduct.id,
        quantityDelta: Number(adjustDelta),
        reason: adjustReason,
      });
      showNotification(`Stock adjusted for ${adjustModalProduct.name}`, 'success');
      setAdjustModalProduct(null);
      setAdjustDelta(0);
      setAdjustReason('');
      loadStock();
    } catch (err: any) {
      showNotification(err.message || 'Failed to adjust stock', 'error');
    } finally {
      setSubmittingAdjust(false);
    }
  };

  const handleExportCsv = () => {
    window.open('/api/retailer/reports/export-csv?type=inventory', '_blank');
  };

  if (currentUser && currentUser.role !== 'retailer' && currentUser.role !== 'admin') {
    return <RoleAccessRequired requiredRole="retailer" />;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Inventory & Stock Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock monitoring, audit movement ledger, and threshold reorder rules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('STOCK')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'STOCK'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Live Inventory ({inventory.length})
        </button>

        <button
          onClick={() => setActiveTab('LEDGER')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'LEDGER'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-4 h-4" />
          Stock Movement Ledger
        </button>

        <button
          onClick={() => setActiveTab('REORDER')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'REORDER'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          Reorder Suggestions
        </button>
      </div>

      {/* Tab 1: Live Stock Table */}
      {activeTab === 'STOCK' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
              <input
                type="text"
                placeholder="Search inventory items..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" />
            </form>

            <div className="flex items-center gap-2">
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                aria-label="Filter by Product Category"
                className="bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium px-3 py-1.5 cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                <option value="Grocery">Grocery</option>
                <option value="Beverages">Beverages</option>
                <option value="Snacks">Snacks</option>
                <option value="Dairy">Dairy</option>
                <option value="Personal Care">Personal Care</option>
                <option value="Household">Household</option>
                <option value="Stationery">Stationery</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
                  <tr>
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Cost Price (₹)</th>
                    <th className="py-3 px-4 text-right">Selling Price (₹)</th>
                    <th className="py-3 px-4 text-center">GST Rate</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Loading inventory records...
                      </td>
                    </tr>
                  ) : inventory.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No inventory matching active filters.
                      </td>
                    </tr>
                  ) : (
                    inventory.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.category}</td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-mono font-black text-sm text-slate-900">
                            {item.stock}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-1">{item.unit}</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.stock_status === 'OUT_OF_STOCK' ? (
                            <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              Out of Stock
                            </span>
                          ) : item.stock_status === 'LOW_STOCK' ? (
                            <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              Low (Min: {item.min_stock_alert})
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                              Healthy
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-slate-600">
                          {formatInr(item.cost_price_paise || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                          {formatInr(item.price_paise)}
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {item.tax_rate_percent}%
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setAdjustModalProduct(item);
                              setAdjustDelta(0);
                              setAdjustReason('');
                            }}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                          >
                            Adjust Stock
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stock Movement Ledger */}
      {activeTab === 'LEDGER' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Immutable Inventory Movement Ledger
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Tracks every stock delta with reason, actor, and reference ID to guarantee no double-deductions or phantom stock.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Product Name</th>
                  <th className="py-3 px-4">Movement Type</th>
                  <th className="py-3 px-4 text-center">Quantity Delta</th>
                  <th className="py-3 px-4">Reason / Reference</th>
                  <th className="py-3 px-4">Actor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                      Loading audit movements...
                    </td>
                  </tr>
                ) : movements.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 font-sans">
                      No stock movements recorded yet.
                    </td>
                  </tr>
                ) : (
                  movements.map(mov => {
                    const isPositive = mov.quantity_delta > 0;
                    return (
                      <tr key={mov.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 text-slate-500 font-sans">
                          {formatDate(mov.created_at)}
                        </td>
                        <td className="py-3 px-4 font-sans font-semibold text-slate-900">
                          {mov.product_name}
                        </td>
                        <td className="py-3 px-4 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            mov.movement_type === 'PURCHASE_RECEIPT'
                              ? 'bg-emerald-100 text-emerald-800'
                              : mov.movement_type === 'SALE_ORDER'
                              ? 'bg-blue-100 text-blue-800'
                              : mov.movement_type === 'ORDER_CANCELLED'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}>
                            {mov.movement_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                            {isPositive ? `+${mov.quantity_delta}` : mov.quantity_delta} {mov.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600 font-sans">
                          {mov.reason} {mov.reference_id && <span className="font-mono text-slate-400">({mov.reference_id})</span>}
                        </td>
                        <td className="py-3 px-4 text-slate-500 font-mono text-[10px]">
                          {mov.actor_id}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Reorder Suggestions */}
      {activeTab === 'REORDER' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Rule-Based Inventory Reorder Estimates:</strong>
              <div className="text-[11px] text-amber-800 mt-0.5">
                These suggestions are calculated using configured minimum stock threshold safety buffers (3x buffer minus current stock), not machine learning predictions.
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
                  <tr>
                    <th className="py-3 px-4">Product Name & SKU</th>
                    <th className="py-3 px-4">Preferred Supplier</th>
                    <th className="py-3 px-4 text-center">Current Stock</th>
                    <th className="py-3 px-4 text-center">Safety Threshold</th>
                    <th className="py-3 px-4 text-center">Suggested Reorder Qty</th>
                    <th className="py-3 px-4 text-right">Est. Reorder Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Evaluating stock levels...
                      </td>
                    </tr>
                  ) : suggestions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-emerald-600 font-medium">
                        ✓ All inventory items are currently above minimum safety thresholds.
                      </td>
                    </tr>
                  ) : (
                    suggestions.map(sug => {
                      const estCost = sug.suggested_reorder_qty * sug.cost_price_paise;
                      return (
                        <tr key={sug.product_id} className="hover:bg-slate-50/50">
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{sug.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{sug.sku}</div>
                          </td>
                          <td className="py-3 px-4 text-slate-700">
                            {sug.supplier_name || 'Standard Wholesale'}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-rose-600">
                            {sug.stock} {sug.unit}
                          </td>
                          <td className="py-3 px-4 text-center font-mono text-slate-600">
                            {sug.min_stock_alert} {sug.unit}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-black text-blue-700">
                            +{sug.suggested_reorder_qty} {sug.unit}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatInr(estCost)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustModalProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900">
                Adjust Physical Stock
              </h3>
              <button
                onClick={() => setAdjustModalProduct(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
              <div className="font-bold text-slate-800">{adjustModalProduct.name}</div>
              <div className="text-slate-500 font-mono mt-0.5">
                Current Recorded Stock: <strong className="text-slate-900">{adjustModalProduct.stock} {adjustModalProduct.unit}</strong>
              </div>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantity Delta (+ to increase, - to decrease)
                </label>
                <input
                  type="number"
                  required
                  value={adjustDelta}
                  onChange={e => setAdjustDelta(Number(e.target.value))}
                  placeholder="e.g. +5 or -2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm focus:bg-white"
                />
                <div className="text-[11px] text-slate-500 mt-1">
                  New stock will be: <strong className="text-slate-900">{adjustModalProduct.stock + adjustDelta} {adjustModalProduct.unit}</strong>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Audit Reason (Mandatory)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Broken container during restocking, physical audit count correction"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAdjustModalProduct(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdjust || adjustDelta === 0}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition disabled:bg-slate-300"
                >
                  {submittingAdjust ? 'Updating Ledger...' : 'Commit Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
