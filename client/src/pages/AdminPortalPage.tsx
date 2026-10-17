import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  RefreshCw, 
  Users, 
  Store, 
  Building2, 
  Package, 
  ShoppingCart, 
  AlertTriangle, 
  CheckCircle, 
  Database,
  History,
  FileText
} from 'lucide-react';
import { api, formatDate, formatInr } from '../services/api';
import { useApp } from '../context/AppContext';

export const AdminPortalPage: React.FC = () => {
  const { currentUser, demoUsers, switchUser, showNotification, refreshUserData } = useApp();
  const [systemStats, setSystemStats] = useState<any>(null);
  const [shops, setShops] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'SHOPS' | 'SUPPLIERS' | 'ORDERS'>('AUDIT');
  const [loading, setLoading] = useState(true);

  // Reset confirmation modal state
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  const loadAdminData = async () => {
    if (currentUser && currentUser.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getAdminSystemStatus();
      setSystemStats(res.system);
      setShops(res.shops || []);
      setSuppliers(res.suppliers || []);
      setRecentOrders(res.recentOrders || []);
      setAuditEvents(res.auditEvents || []);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [currentUser]);

  const isAuthorized = currentUser?.role === 'admin';

  if (!isAuthorized) {
    const adminUser = demoUsers.find(u => u.role === 'admin') || demoUsers[0];
    return (
      <div className="max-w-xl mx-auto my-12 bg-white rounded-2xl border border-slate-200 shadow-md p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto text-xl">
          🛡️
        </div>
        <h2 className="text-xl font-black text-slate-900">Platform Admin Hub Access</h2>
        <p className="text-xs text-slate-500">
          You are currently viewing as <strong>{currentUser?.name} ({currentUser?.role})</strong>.
          Switch to the Root Administrator persona below to inspect platform-wide health, view all shops/suppliers, and manage audit logs:
        </p>
        <div className="pt-2">
          {adminUser && (
            <button
              onClick={() => switchUser(adminUser)}
              className="w-full p-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-left transition flex items-center justify-between shadow-md"
            >
              <div>
                <div className="text-xs font-bold">{adminUser.name}</div>
                <div className="text-[11px] text-slate-400">{adminUser.email} • Root Platform Admin</div>
              </div>
              <span className="text-xs font-bold text-rose-400">Switch to Admin →</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const handleResetData = async () => {
    setResetting(true);
    try {
      await api.resetDemoData();
      showNotification('Demo database reset to clean seed state!', 'success');
      setConfirmModalOpen(false);
      await refreshUserData();
      await loadAdminData();
    } catch (err: any) {
      showNotification(err.message || 'Reset failed', 'error');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-rose-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded">
              Platform Administration
            </span>
            <span className="text-xs font-mono text-slate-500">
              Security Level: Root Admin (Rajesh Sharma)
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
            System Status & Multi-Role Demo Operations
          </h1>
        </div>

        <button
          onClick={() => setConfirmModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Reset Seed Demo Data
        </button>
      </div>

      {/* System Stats Cards */}
      {loading || !systemStats ? (
        <div className="py-20 text-center text-slate-400">Loading system status...</div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-600" /> Users
              </span>
              <div className="text-xl font-black font-mono text-slate-900">
                {systemStats.usersCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Store className="w-3 h-3 text-emerald-600" /> Shops
              </span>
              <div className="text-xl font-black font-mono text-slate-900">
                {systemStats.shopsCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Building2 className="w-3 h-3 text-purple-600" /> Suppliers
              </span>
              <div className="text-xl font-black font-mono text-slate-900">
                {systemStats.suppliersCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Package className="w-3 h-3 text-amber-600" /> Products
              </span>
              <div className="text-xl font-black font-mono text-slate-900">
                {systemStats.productsCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <ShoppingCart className="w-3 h-3 text-blue-600" /> Orders
              </span>
              <div className="text-xl font-black font-mono text-slate-900">
                {systemStats.ordersCount}
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                <Database className="w-3 h-3 text-slate-600" /> Purchases
              </span>
              <div className="text-xl font-black font-mono text-slate-900">
                {systemStats.purchasesCount}
              </div>
            </div>

          </div>

          {/* Prototype System Info */}
          <div className="bg-slate-900 text-white rounded-xl p-5 shadow-md border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-bold text-sm tracking-wide">Prototype Runtime Architecture</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-300">
              <div>
                <span className="text-slate-500 block">Database Storage:</span>
                <span className="font-mono text-white">SQLite (Persistent local database file)</span>
              </div>
              <div>
                <span className="text-slate-500 block">Currency Precision:</span>
                <span className="font-mono text-white">Integer Paise (₹1.00 = 100 paise)</span>
              </div>
              <div>
                <span className="text-slate-500 block">GST Compliance Mode:</span>
                <span className="font-mono text-amber-400">Prototype Demo (No live GSTN link)</span>
              </div>
            </div>
          </div>

          {/* Admin Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
                activeTab === 'AUDIT'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Platform Audit Events ({auditEvents.length})
            </button>

            <button
              onClick={() => setActiveTab('SHOPS')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
                activeTab === 'SHOPS'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              Participating Shops ({shops.length})
            </button>

            <button
              onClick={() => setActiveTab('SUPPLIERS')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
                activeTab === 'SUPPLIERS'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Wholesale Suppliers ({suppliers.length})
            </button>

            <button
              onClick={() => setActiveTab('ORDERS')}
              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold border-b-2 transition -mb-px ${
                activeTab === 'ORDERS'
                  ? 'border-rose-600 text-rose-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Recent Platform Orders ({recentOrders.length})
            </button>
          </div>

          {/* Tab 1: Audit Log */}
          {activeTab === 'AUDIT' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Platform Audit Events Log
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Tracks administrative actions, supplier catalogue publishes, stock intakes, and tax configurations
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
                    <tr>
                      <th className="py-2.5 px-4">Timestamp</th>
                      <th className="py-2.5 px-4">Actor</th>
                      <th className="py-2.5 px-4">Entity</th>
                      <th className="py-2.5 px-4">Action</th>
                      <th className="py-2.5 px-4">Reason / Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {auditEvents.map(evt => (
                      <tr key={evt.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 text-slate-500 font-sans">{formatDate(evt.timestamp)}</td>
                        <td className="py-2.5 px-4 text-slate-700 font-sans">{evt.actor_role} ({evt.actor_id})</td>
                        <td className="py-2.5 px-4 text-slate-600">{evt.entity_type}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{evt.action}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-sans">{evt.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 2: Shops */}
          {activeTab === 'SHOPS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
                    <tr>
                      <th className="py-3 px-4">Shop Name</th>
                      <th className="py-3 px-4">Owner / Persona</th>
                      <th className="py-3 px-4">State & Service Area</th>
                      <th className="py-3 px-4 font-mono">Demo GSTIN</th>
                      <th className="py-3 px-4 text-center">Orders</th>
                      <th className="py-3 px-4 text-right">Recorded Sales (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shops.map(s => (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{s.name}</td>
                        <td className="py-3 px-4 text-slate-700">{s.owner_name} ({s.owner_email})</td>
                        <td className="py-3 px-4 text-slate-600">{s.state} • {s.service_area}</td>
                        <td className="py-3 px-4 font-mono font-bold text-blue-700">{s.demo_gstin}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold">{s.order_count}</td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-900">
                          {formatInr(s.total_sales_paise)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 3: Suppliers */}
          {activeTab === 'SUPPLIERS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
                    <tr>
                      <th className="py-3 px-4">Wholesale Supplier Name</th>
                      <th className="py-3 px-4">State</th>
                      <th className="py-3 px-4 font-mono">Demo GSTIN</th>
                      <th className="py-3 px-4">Contact Phone</th>
                      <th className="py-3 px-4 text-center">Active Products</th>
                      <th className="py-3 px-4 text-center">Retailer Orders</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {suppliers.map(sp => (
                      <tr key={sp.id} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-900">{sp.business_name}</td>
                        <td className="py-3 px-4 text-slate-600">{sp.state}</td>
                        <td className="py-3 px-4 font-mono font-bold text-purple-700">{sp.demo_gstin}</td>
                        <td className="py-3 px-4 text-slate-600">{sp.contact_phone}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-900">{sp.product_count}</td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-blue-700">{sp.incoming_orders_count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: All Orders */}
          {activeTab === 'ORDERS' && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Order Number</th>
                      <th className="py-3 px-4">Fulfilling Store</th>
                      <th className="py-3 px-4">Customer</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Taxable (₹)</th>
                      <th className="py-3 px-4 text-right">GST (₹)</th>
                      <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {recentOrders.map(o => (
                      <tr key={o.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-4 text-slate-500 font-sans">{o.date ? o.date.substring(0, 10) : '-'}</td>
                        <td className="py-2.5 px-4 font-bold text-slate-900">{o.order_number}</td>
                        <td className="py-2.5 px-4 font-sans text-slate-700">{o.shop_name}</td>
                        <td className="py-2.5 px-4 font-sans text-slate-800">{o.customer_name}</td>
                        <td className="py-2.5 px-4 font-sans">
                          <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold">
                            {o.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right text-slate-700">{formatInr(o.taxable_subtotal_paise)}</td>
                        <td className="py-2.5 px-4 text-right text-blue-700 font-bold">{formatInr(o.total_tax_paise)}</td>
                        <td className="py-2.5 px-4 text-right font-black text-slate-900">{formatInr(o.total_paise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-black text-lg text-slate-900">Confirm Reset of Seed Data</h3>
              <p className="text-xs text-slate-500">
                Are you sure you want to reset all test orders, stock movements, and purchases back to the initial seed state?
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-[11px] text-rose-800">
              <strong>Warning:</strong> All orders and purchases created during the demo session will be replaced by the default multi-shop, multi-supplier dataset.
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetData}
                disabled={resetting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition shadow-xs disabled:bg-slate-300"
              >
                {resetting ? 'Resetting Database...' : 'Yes, Reset Demo Data'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
