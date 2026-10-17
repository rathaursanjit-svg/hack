import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle, 
  FileText,
  Truck,
  Store,
  CreditCard
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api, formatInr } from '../services/api';

export const CartCheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const { cart, updateCartQuantity, removeFromCart, clearCart, currentUser, selectedShopId, openInvoicePreview } = useApp();

  const [supplyType, setSupplyType] = useState<'INTRA_STATE' | 'INTER_STATE'>('INTRA_STATE');
  const [fulfillmentType, setFulfillmentType] = useState<'DELIVERY' | 'PICKUP'>('DELIVERY');
  const [paymentStatus, setPaymentStatus] = useState<'SIMULATED_PAID' | 'PAY_ON_PICKUP'>('SIMULATED_PAID');
  
  const [customerName, setCustomerName] = useState(currentUser?.name || 'Aarav Mehta');
  const [customerPhone, setCustomerPhone] = useState('+91 98200 44551');
  const [deliveryAddress, setDeliveryAddress] = useState('Flat 402, Lotus Greens, Lajpat Nagar III, New Delhi');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Compute breakdown in real-time
  let taxableSubtotalPaise = 0;
  let totalTaxPaise = 0;
  let grandTotalPaise = 0;

  for (const item of cart) {
    const gross = item.quantity * item.product.price_paise;
    const rate = item.product.tax_rate_percent || 0;

    if (rate === 0) {
      taxableSubtotalPaise += gross;
      grandTotalPaise += gross;
    } else if (item.product.price_includes_tax) {
      const taxable = Math.round(gross / (1 + rate / 100));
      const tax = gross - taxable;
      taxableSubtotalPaise += taxable;
      totalTaxPaise += tax;
      grandTotalPaise += gross;
    } else {
      const taxable = gross;
      const tax = Math.round((taxable * rate) / 100);
      taxableSubtotalPaise += taxable;
      totalTaxPaise += tax;
      grandTotalPaise += (taxable + tax);
    }
  }

  const cgstPaise = supplyType === 'INTRA_STATE' ? Math.floor(totalTaxPaise / 2) : 0;
  const sgstPaise = supplyType === 'INTRA_STATE' ? (totalTaxPaise - cgstPaise) : 0;
  const igstPaise = supplyType === 'INTER_STATE' ? totalTaxPaise : 0;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        shopId: selectedShopId,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
        })),
        supplyType,
        fulfillmentType,
        paymentStatus,
        customerName,
        customerPhone,
        deliveryAddress: fulfillmentType === 'DELIVERY' ? deliveryAddress : 'Store Pickup Counter',
        notes,
      };

      const res = await api.createOrder(payload);
      setPlacedOrder(res.order);
      clearCart();
    } catch (err: any) {
      setError(err.message || 'Failed to place order');
    } finally {
      setSubmitting(false);
    }
  };

  // If order was just placed, display confirmation screen
  if (placedOrder) {
    return (
      <div className="max-w-xl mx-auto my-8 bg-white p-8 rounded-2xl shadow-xl border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="w-10 h-10" />
        </div>

        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900">Order Placed Successfully!</h2>
          <p className="text-sm text-slate-500 font-mono">
            Order Reference: <strong className="text-slate-900">{placedOrder.orderNumber}</strong>
          </p>
          <div className="inline-block bg-emerald-50 text-emerald-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-emerald-200 mt-2">
            Stock Reserved Atomically in Kirana Ledger
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-slate-500">Total Amount:</span>
            <span className="font-bold font-mono text-slate-900">{formatInr(placedOrder.grandTotalPaise)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">GST Breakdown:</span>
            <span className="font-bold font-mono text-blue-700">{formatInr(placedOrder.totalTaxPaise)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Payment Status:</span>
            <span className="font-bold text-slate-800">{paymentStatus === 'SIMULATED_PAID' ? 'Simulated Paid (Card/UPI)' : 'Pay on Pickup'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Fulfillment Mode:</span>
            <span className="font-bold text-slate-800">{fulfillmentType}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => openInvoicePreview(placedOrder.invoiceId)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            View Printable Tax Invoice
          </button>

          <button
            onClick={() => navigate('/my-orders')}
            className="w-full sm:w-auto px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition"
          >
            Track in My Orders
          </button>
        </div>
      </div>
    );
  }

  // Empty cart view
  if (cart.length === 0) {
    return (
      <div className="max-w-lg mx-auto my-12 bg-white p-12 rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
        <ShoppingBag className="w-14 h-14 text-slate-300 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">Your Cart is Empty</h2>
        <p className="text-xs text-slate-500">
          Explore our local inventory and add fresh groceries, dairy, beverages, or household essentials.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition"
        >
          Browse Marketplace
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shopping Cart & Simulated Checkout</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review items, select tax jurisdiction and fulfillment mode, and place your simulated order.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Cart Line Items */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-700 uppercase tracking-wider">
                Cart Items ({cart.length})
              </span>
              <button
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
              >
                Clear Cart
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {cart.map(item => (
                <div key={item.product.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={item.product.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
                      alt={item.product.name}
                      className="w-14 h-14 rounded-lg object-cover border border-slate-200"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                        {item.product.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {formatInr(item.product.price_paise)} / {item.product.unit} • GST {item.product.tax_rate_percent}%
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quantity controls */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-3 py-1 text-xs font-bold text-slate-900 font-mono">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="px-2 py-1 text-slate-600 hover:bg-slate-200 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right w-24">
                      <div className="text-xs font-black text-slate-900 font-mono">
                        {formatInr(item.quantity * item.product.price_paise)}
                      </div>
                    </div>

                    {/* Remove button */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery & Contact Details Form */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Customer & Delivery Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white"
                />
              </div>

              {fulfillmentType === 'DELIVERY' && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Complete Delivery Address
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={deliveryAddress}
                    onChange={e => setDeliveryAddress(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Special Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave with security guard"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary & Settings */}
        <div className="space-y-4">
          
          {/* Tax & Fulfillment Configuration */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Demo Supply & Fulfillment Mode
            </h3>

            {/* Supply Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                GST Supply Type (Intra vs Inter-State)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSupplyType('INTRA_STATE')}
                  className={`p-2 rounded-lg text-xs font-semibold text-center border transition ${
                    supplyType === 'INTRA_STATE'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Intra-State
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">CGST (50%) + SGST (50%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSupplyType('INTER_STATE')}
                  className={`p-2 rounded-lg text-xs font-semibold text-center border transition ${
                    supplyType === 'INTER_STATE'
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Inter-State
                  <span className="block text-[10px] font-normal text-slate-500 mt-0.5">IGST (100%)</span>
                </button>
              </div>
            </div>

            {/* Fulfillment Type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Fulfillment Mode
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentType('DELIVERY')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition ${
                    fulfillmentType === 'DELIVERY'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5" />
                  Home Delivery
                </button>
                <button
                  type="button"
                  onClick={() => setFulfillmentType('PICKUP')}
                  className={`flex items-center justify-center gap-1.5 p-2 rounded-lg text-xs font-semibold border transition ${
                    fulfillmentType === 'PICKUP'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  Store Pickup
                </button>
              </div>
            </div>

            {/* Simulated Payment Mode */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">
                Payment Method (Simulated)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentStatus('SIMULATED_PAID')}
                  className={`p-2 rounded-lg text-xs font-semibold text-center border transition ${
                    paymentStatus === 'SIMULATED_PAID'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Simulate UPI / Card
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentStatus('PAY_ON_PICKUP')}
                  className={`p-2 rounded-lg text-xs font-semibold text-center border transition ${
                    paymentStatus === 'PAY_ON_PICKUP'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Pay on Pickup
                </button>
              </div>
            </div>
          </div>

          {/* Price Breakdown Card */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-5 space-y-3">
            <h3 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
              Price & Tax Breakdown
            </h3>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Taxable Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">{formatInr(taxableSubtotalPaise)}</span>
              </div>

              {supplyType === 'INTRA_STATE' ? (
                <>
                  <div className="flex justify-between text-slate-600">
                    <span>CGST (Central):</span>
                    <span className="font-mono text-slate-800">{formatInr(cgstPaise)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>SGST (State):</span>
                    <span className="font-mono text-slate-800">{formatInr(sgstPaise)}</span>
                  </div>
                </>
              ) : (
                <div className="flex justify-between text-slate-600">
                  <span>IGST (Integrated):</span>
                  <span className="font-mono text-slate-800">{formatInr(igstPaise)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-600 border-t pt-1.5">
                <span className="font-semibold">Total GST:</span>
                <span className="font-mono font-bold text-blue-700">{formatInr(totalTaxPaise)}</span>
              </div>

              <div className="flex justify-between text-base font-black text-slate-900 border-t-2 border-slate-300 pt-2">
                <span>Final Payable:</span>
                <span className="text-emerald-700">{formatInr(grandTotalPaise)}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={submitting}
              className="w-full mt-3 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-md active:scale-98 disabled:bg-slate-300"
            >
              {submitting ? 'Reserving Stock & Placing Order...' : 'Confirm Demo Order'}
            </button>

            <div className="text-[10px] text-slate-400 text-center leading-tight pt-1">
              No real bank charges will occur. Order reserves inventory atomically in local Kirana database.
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
