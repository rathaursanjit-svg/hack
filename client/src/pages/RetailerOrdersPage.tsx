import React, { useEffect, useState } from 'react';
import { Package, Check, X, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { api, formatInr, formatDate } from '../services/api';
import { Order } from '../types';
import { useApp } from '../context/AppContext';

export const RetailerOrdersPage: React.FC = () => {
  const { openInvoicePreview, showNotification } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders();
      setOrders(res.orders);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      showNotification(`Order status updated to ${newStatus}`, 'success');
      fetchOrders();
    } catch (err: any) {
      showNotification(err.message || 'Failed to update order status', 'error');
    }
  };

  const filteredOrders = filterStatus === 'ALL'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Store Customer Orders Queue
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accept incoming orders, manage fulfillment pipeline, and generate customer tax invoices
          </p>
        </div>

        {/* Status Filter */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-xs overflow-x-auto scrollbar-none">
          {['ALL', 'PLACED', 'ACCEPTED', 'READY', 'COMPLETED', 'CANCELLED'].map(st => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1 text-xs font-semibold rounded-md whitespace-nowrap transition ${
                filterStatus === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              Loading store orders queue...
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              No orders found with status "{filterStatus}".
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                
                {/* Order Information */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-sm text-slate-900">
                      {order.order_number}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      order.status === 'PLACED' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                      order.status === 'ACCEPTED' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                      order.status === 'READY' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                      order.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}>
                      {order.status}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDate(order.date)}
                    </span>
                  </div>

                  <div className="text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Customer: <strong className="text-slate-900">{order.customer_name}</strong></span>
                    <span>Contact: {order.customer_phone}</span>
                    <span>Mode: <strong className="text-slate-800">{order.fulfillment_type}</strong></span>
                    <span>Payment: <strong className="text-slate-800">{order.payment_status}</strong></span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono">
                    Taxable {formatInr(order.taxable_subtotal_paise)} + GST {formatInr(order.total_tax_paise)} ({order.supply_type})
                  </div>
                </div>

                {/* Amount & Lifecycle Transitions */}
                <div className="flex flex-wrap items-center justify-between lg:justify-end gap-3 border-t lg:border-t-0 pt-3 lg:pt-0">
                  <div className="text-right mr-2">
                    <div className="text-[10px] text-slate-400">Total Invoice</div>
                    <div className="text-base font-black text-slate-900 font-mono">
                      {formatInr(order.total_paise)}
                    </div>
                  </div>

                  {/* Actions according to lifecycle transitions */}
                  {order.status === 'PLACED' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(order.id, 'ACCEPTED')}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {order.status === 'ACCEPTED' && (
                    <>
                      <button
                        onClick={() => handleStatusChange(order.id, 'READY')}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                      >
                        Mark Ready
                      </button>
                      <button
                        onClick={() => handleStatusChange(order.id, 'CANCELLED')}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {order.status === 'READY' && (
                    <button
                      onClick={() => handleStatusChange(order.id, 'COMPLETED')}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-xs"
                    >
                      Complete & Handover
                    </button>
                  )}

                  <button
                    onClick={() => openInvoicePreview(order.invoice_id || order.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    Invoice Preview
                  </button>
                </div>

              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
