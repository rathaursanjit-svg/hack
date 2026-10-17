import React, { useEffect, useState } from 'react';
import { Package, Clock, CheckCircle2, XCircle, FileText, ArrowRight } from 'lucide-react';
import { api, formatInr, formatDate } from '../services/api';
import { Order } from '../types';
import { useApp } from '../context/AppContext';

export const ConsumerOrdersPage: React.FC = () => {
  const { openInvoicePreview, currentUser } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders();
      setOrders(res.orders);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [currentUser]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PLACED':
        return <span className="bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded text-[10px] font-bold">Placed</span>;
      case 'ACCEPTED':
        return <span className="bg-blue-100 text-blue-800 border border-blue-300 px-2 py-0.5 rounded text-[10px] font-bold">Accepted by Shop</span>;
      case 'READY':
        return <span className="bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded text-[10px] font-bold">Ready for Pickup/Delivery</span>;
      case 'COMPLETED':
        return <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded text-[10px] font-bold">Completed</span>;
      case 'CANCELLED':
        return <span className="bg-rose-100 text-rose-800 border border-rose-300 px-2 py-0.5 rounded text-[10px] font-bold">Cancelled</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Order History</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Logged in as: <strong className="text-slate-800">{currentUser?.name}</strong> • Active Consumer Orders
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500 font-medium">
          Loading your past orders...
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-slate-200 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-xs text-slate-500 mt-1">
            Browse our neighborhood stores and place your first demo order.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <div
              key={order.id}
              className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 hover:border-slate-300 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {order.order_number}
                  </span>
                  {getStatusBadge(order.status)}
                  <span className="text-[11px] text-slate-500 font-mono">
                    {formatDate(order.date)}
                  </span>
                </div>

                <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                  <span>🏪 Store: <strong className="text-slate-800">{order.shop_name}</strong></span>
                  <span>📦 Mode: <strong className="text-slate-800">{order.fulfillment_type}</strong></span>
                  <span>💳 Payment: <strong className="text-slate-800">{order.payment_status}</strong></span>
                </div>

                <div className="text-[11px] text-slate-500">
                  Tax Breakdown: Taxable {formatInr(order.taxable_subtotal_paise)} + GST {formatInr(order.total_tax_paise)} ({order.supply_type})
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                <div className="text-right">
                  <div className="text-xs text-slate-400">Total Amount</div>
                  <div className="text-base font-black text-slate-900 font-mono">
                    {formatInr(order.total_paise)}
                  </div>
                </div>

                <button
                  onClick={() => openInvoicePreview(order.invoice_id || order.id)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  View Invoice
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
