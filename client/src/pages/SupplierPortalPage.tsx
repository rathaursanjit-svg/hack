import React, { useEffect, useState } from 'react';
import { Building2, Plus, Edit2, ToggleLeft, ToggleRight, Receipt, Package, Check, X } from 'lucide-react';
import { api, formatInr, formatDate } from '../services/api';
import { Product } from '../types';
import { useApp } from '../context/AppContext';

export const SupplierPortalPage: React.FC = () => {
  const { currentUser, demoUsers, switchUser, showNotification } = useApp();
  const [activeTab, setActiveTab] = useState<'PRODUCTS' | 'ORDERS'>('PRODUCTS');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Product Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Grocery');
  const [unit, setUnit] = useState('pack');
  const [priceRupees, setPriceRupees] = useState('');
  const [costRupees, setCostRupees] = useState('');
  const [taxRate, setTaxRate] = useState(5.0);
  const [priceIncludesTax, setPriceIncludesTax] = useState(true);
  const [stock, setStock] = useState(50);
  const [minStockAlert, setMinStockAlert] = useState(10);
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    if (currentUser && currentUser.role !== 'supplier' && currentUser.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      if (activeTab === 'PRODUCTS') {
        const res = await api.getSupplierProducts();
        setProducts(res.products);
      } else {
        const res = await api.getSupplierOrders();
        setOrders(res.orders);
      }
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, currentUser]);

  const isAuthorized = currentUser?.role === 'supplier' || currentUser?.role === 'admin';

  if (!isAuthorized) {
    const supplierUsers = demoUsers.filter(u => u.role === 'supplier');
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-md p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-purple-100 text-purple-700 rounded-full flex items-center justify-center mx-auto text-xl">
          🏭
        </div>
        <h2 className="text-xl font-black text-slate-900">Wholesale Supplier Portal</h2>
        <p className="text-xs text-slate-500">
          You are currently viewing as <strong>{currentUser?.name} ({currentUser?.role})</strong>.
          Switch to one of the 3 distributor demo personas below to manage product listings and view incoming retailer purchase orders:
        </p>
        <div className="grid grid-cols-1 gap-2 pt-2">
          {supplierUsers.map(u => (
            <button
              key={u.id}
              onClick={() => switchUser(u)}
              className="p-3 bg-slate-50 hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-left transition flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-900">{u.name}</div>
                <div className="text-[11px] text-slate-500">{u.supplier_name} • GSTIN: {u.supplier_gstin}</div>
              </div>
              <span className="text-xs font-bold text-purple-600">Switch →</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku(`SUP-${Math.floor(1000 + Math.random() * 9000)}`);
    setCategory('Grocery');
    setUnit('pack');
    setPriceRupees('150.00');
    setCostRupees('120.00');
    setTaxRate(5.0);
    setPriceIncludesTax(true);
    setStock(100);
    setMinStockAlert(15);
    setImageUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80');
    setModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setSku(p.sku);
    setCategory(p.category);
    setUnit(p.unit);
    setPriceRupees((p.price_paise / 100).toFixed(2));
    setCostRupees(((p.cost_price_paise || 0) / 100).toFixed(2));
    setTaxRate(p.tax_rate_percent);
    setPriceIncludesTax(Boolean(p.price_includes_tax));
    setStock(p.stock);
    setMinStockAlert(p.min_stock_alert);
    setImageUrl(p.image_url || '');
    setModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        sku,
        category,
        unit,
        pricePaise: Math.round(Number(priceRupees) * 100),
        costPricePaise: Math.round(Number(costRupees) * 100),
        taxRatePercent: Number(taxRate),
        priceIncludesTax,
        stock: Number(stock),
        minStockAlert: Number(minStockAlert),
        imageUrl,
      };

      if (editingProduct) {
        await api.updateSupplierProduct(editingProduct.id, payload);
        showNotification('Product listing updated', 'success');
      } else {
        await api.createSupplierProduct(payload);
        showNotification('New product added to catalogue', 'success');
      }

      setModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Failed to save product', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (productId: string) => {
    try {
      const res = await api.toggleProductActive(productId);
      showNotification(`Product is now ${res.active ? 'active' : 'inactive'}`, 'info');
      loadData();
    } catch (err: any) {
      showNotification(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-purple-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
              Distributor Portal
            </span>
            <span className="text-xs font-mono text-slate-500">
              {currentUser?.supplier_name || 'Apex FMCG Distributors Pvt Ltd'} • GSTIN: {currentUser?.supplier_gstin || '27AABCA1234F1Z1'}
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            Supplier Product Catalogue & Fulfillment
          </h1>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Add New Product
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('PRODUCTS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'PRODUCTS'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          My Product Listings ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('ORDERS')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
            activeTab === 'ORDERS'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Receipt className="w-4 h-4" />
          Incoming Retailer Inward Orders
        </button>
      </div>

      {/* Tab 1: Products */}
      {activeTab === 'PRODUCTS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
                <tr>
                  <th className="py-3 px-4">Item & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4 text-center">Warehouse Stock</th>
                  <th className="py-3 px-4 text-right">Wholesale Rate (₹)</th>
                  <th className="py-3 px-4 text-center">Tax Rate</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      Loading supplier products...
                    </td>
                  </tr>
                ) : products.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      No products listed yet. Click "Add New Product" to create one.
                    </td>
                  </tr>
                ) : (
                  products.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">SKU: {p.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">{p.category}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">
                        {p.stock} {p.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-purple-700">
                        {formatInr(p.price_paise)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        {p.tax_rate_percent}% {p.price_includes_tax ? '(Incl)' : '(Excl)'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          p.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {p.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(p.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                        >
                          {p.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Retailer Inward Orders */}
      {activeTab === 'ORDERS' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Retail Kirana Store</th>
                  <th className="py-3 px-4">Supply Type</th>
                  <th className="py-3 px-4 text-right">Taxable (₹)</th>
                  <th className="py-3 px-4 text-right">GST (₹)</th>
                  <th className="py-3 px-4 text-right">Total Invoice (₹)</th>
                  <th className="py-3 px-4 text-center">Fulfillment Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      Loading retailer orders...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                      No incoming retailer purchase orders.
                    </td>
                  </tr>
                ) : (
                  orders.map(ord => (
                    <tr key={ord.id} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 text-slate-500 font-sans">{ord.date ? ord.date.substring(0, 10) : '-'}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{ord.invoice_no}</td>
                      <td className="py-3 px-4 font-sans">
                        <div className="font-semibold text-slate-900">{ord.shop_name}</div>
                        <div className="text-[10px] text-slate-400">{ord.shop_address}</div>
                      </td>
                      <td className="py-3 px-4 font-sans text-slate-600">{ord.supply_type}</td>
                      <td className="py-3 px-4 text-right text-slate-700">{formatInr(ord.taxable_subtotal_paise)}</td>
                      <td className="py-3 px-4 text-right text-blue-700 font-bold">{formatInr(ord.total_tax_paise)}</td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">{formatInr(ord.total_paise)}</td>
                      <td className="py-3 px-4 text-center font-sans">
                        <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">
                          {ord.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-black text-base text-slate-900">
                {editingProduct ? 'Edit Product Listing' : 'Create New Product Listing'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU</label>
                  <input
                    type="text"
                    required
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  >
                    <option value="Grocery">Grocery</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Snacks">Snacks</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Personal Care">Personal Care</option>
                    <option value="Household">Household</option>
                    <option value="Stationery">Stationery</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={priceRupees}
                    onChange={e => setPriceRupees(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wholesale Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={costRupees}
                    onChange={e => setCostRupees(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Configurable GST Rate (%)</label>
                  <select
                    value={taxRate}
                    onChange={e => setTaxRate(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Essential Food / Oil)</option>
                    <option value={12}>12% (Processed Food / Dairy)</option>
                    <option value={18}>18% (Personal Care / Soap)</option>
                    <option value={28}>28% (Aerated Drinks)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit of Measurement</label>
                  <input
                    type="text"
                    required
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Current Warehouse Stock</label>
                  <input
                    type="number"
                    required
                    value={stock}
                    onChange={e => setStock(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Low Stock Alert Level</label>
                  <input
                    type="number"
                    required
                    value={minStockAlert}
                    onChange={e => setMinStockAlert(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="taxInc"
                  checked={priceIncludesTax}
                  onChange={e => setPriceIncludesTax(e.target.checked)}
                  className="rounded text-purple-600 cursor-pointer"
                />
                <label htmlFor="taxInc" className="text-slate-700 font-medium cursor-pointer">
                  Price is GST Inclusive
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold transition shadow-xs"
                >
                  {submitting ? 'Saving...' : 'Save Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
