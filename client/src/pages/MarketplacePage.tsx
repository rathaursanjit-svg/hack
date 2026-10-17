import React, { useState, useEffect } from 'react';
import { Search, Store, Filter, Plus, Check, AlertCircle, ShoppingBag, Info } from 'lucide-react';
import { api, formatInr } from '../services/api';
import { Product, Shop } from '../types';
import { useApp } from '../context/AppContext';

export const MarketplacePage: React.FC = () => {
  const { addToCart, selectedShopId, setSelectedShopId } = useApp();
  const [products, setProducts] = useState<Product[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');

  const categories = [
    'ALL',
    'Grocery',
    'Beverages',
    'Snacks',
    'Dairy',
    'Personal Care',
    'Household',
    'Stationery',
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, shopRes] = await Promise.all([
        api.getProducts({
          category,
          shopId: selectedShopId,
          search: search.trim() || undefined,
        }),
        api.getShops(),
      ]);
      setProducts(prodRes.products);
      setShops(shopRes.shops);
    } catch (err) {
      console.error('Error fetching marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [category, selectedShopId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const selectedShop = shops.find(s => s.id === selectedShopId) || shops[0];

  return (
    <div className="space-y-6">
      {/* Hero / Local Store Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-semibold">
            <Store className="w-3.5 h-3.5" />
            Verified Local Neighbourhood Kiranas
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            Order Daily Essentials with GST-Compliant Local Sourcing
          </h1>
          <p className="text-sm text-slate-300">
            Connecting consumers with trusted neighborhood retailers. Enjoy verified stock availability, clear tax calculations, and reliable store pickup or doorstep delivery.
          </p>

          {/* Shop Switcher */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-400 font-medium">Ordering from:</span>
            <div className="relative inline-block">
              <select
                value={selectedShopId}
                onChange={e => setSelectedShopId(e.target.value)}
                aria-label="Select Local Kirana Shop"
                className="bg-slate-800/90 hover:bg-slate-700 text-white border border-slate-700 rounded-lg text-xs font-semibold px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-emerald-400 cursor-pointer shadow-sm"
              >
                {shops.map(s => (
                  <option key={s.id} value={s.id}>
                    🏪 {s.name} ({s.state})
                  </option>
                ))}
              </select>
            </div>
            {selectedShop && (
              <span className="text-xs text-emerald-400 font-mono">
                GSTIN: {selectedShop.demo_gstin}
              </span>
            )}
          </div>
        </div>

        {/* Decorative corner accent */}
        <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                category === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search products or SKU..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2 pointer-events-none" />
        </form>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-500 font-medium">
          Loading catalog from local store inventory...
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs">
          <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No products found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or switching category filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {products.map(product => {
            const isOutOfStock = product.stock <= 0;
            const isLowStock = product.stock > 0 && product.stock <= product.min_stock_alert;

            return (
              <div
                key={product.id}
                className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
              >
                <div>
                  {/* Image container */}
                  <div className="relative h-44 bg-slate-100 overflow-hidden">
                    <img
                      src={product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    
                    {/* Category badge */}
                    <span className="absolute top-2.5 left-2.5 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                      {product.category}
                    </span>

                    {/* Stock Status Badge */}
                    <div className="absolute top-2.5 right-2.5">
                      {isOutOfStock ? (
                        <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-xs">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-xs animate-pulse">
                          Only {product.stock} left!
                        </span>
                      ) : (
                        <span className="bg-emerald-600 text-white text-[10px] font-semibold px-2 py-0.5 rounded shadow-xs">
                          {product.stock} in stock
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 space-y-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {product.name}
                      </h3>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono mt-0.5">
                        <span>SKU: {product.sku}</span>
                        <span>Unit: {product.unit}</span>
                      </div>
                    </div>

                    {/* Tax & Supplier info */}
                    <div className="flex items-center justify-between text-[10px] bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <span className="text-slate-600">
                        GST Rate: <strong className="text-slate-800">{product.tax_rate_percent}%</strong>
                        {product.price_includes_tax ? ' (Incl.)' : ' (Excl.)'}
                      </span>
                      <span className="text-slate-500 truncate max-w-[120px]" title={product.supplier_name}>
                        {product.supplier_name || 'Direct Wholesale'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Price & Action */}
                <div className="px-4 pb-4 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-base font-black text-slate-900">
                      {formatInr(product.price_paise)}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      per {product.unit}
                    </div>
                  </div>

                  <button
                    onClick={() => addToCart(product, 1)}
                    disabled={isOutOfStock}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-xs ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-95'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Prototype Tax Information Footer */}
      <div className="bg-slate-100/80 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 flex items-start gap-3">
        <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800">
            GST Transparency & Precision Architecture:
          </p>
          <p>
            Smart Retail India calculates line-item taxes in integer paise without IEEE 754 floating-point inaccuracies. Standard demo rates (0%, 5%, 12%, 18%, 28%) are used for simulated calculation. Intra-state retail purchases automatically partition GST into equal CGST and SGST shares on generated demo tax invoices.
          </p>
        </div>
      </div>
    </div>
  );
};
