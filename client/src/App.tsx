import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './context/AppContext';
import { DemoBanner } from './components/DemoBanner';
import { Navbar } from './components/Navbar';
import { InvoiceModal } from './components/InvoiceModal';

// Pages
import { MarketplacePage } from './pages/MarketplacePage';
import { CartCheckoutPage } from './pages/CartCheckoutPage';
import { ConsumerOrdersPage } from './pages/ConsumerOrdersPage';
import { RetailerDashboardPage } from './pages/RetailerDashboardPage';
import { RetailerInventoryPage } from './pages/RetailerInventoryPage';
import { RetailerPurchasesPage } from './pages/RetailerPurchasesPage';
import { RetailerOrdersPage } from './pages/RetailerOrdersPage';
import { RetailerGstPage } from './pages/RetailerGstPage';
import { RetailerExpensesPage } from './pages/RetailerExpensesPage';
import { RetailerPnlPage } from './pages/RetailerPnlPage';
import { SupplierPortalPage } from './pages/SupplierPortalPage';
import { AdminPortalPage } from './pages/AdminPortalPage';

const AppContent: React.FC = () => {
  const { previewInvoiceId, closeInvoicePreview, notification } = useApp();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <DemoBanner />
      <Navbar />

      {/* Global Toast Notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className={`px-4 py-2.5 rounded-xl shadow-lg border text-xs font-bold flex items-center gap-2 ${
            notification.type === 'success' 
              ? 'bg-emerald-900 text-white border-emerald-700' 
              : notification.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-slate-900 text-white border-slate-700'
          }`}>
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Main Page Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          {/* Public / Consumer Routes */}
          <Route path="/" element={<MarketplacePage />} />
          <Route path="/cart" element={<CartCheckoutPage />} />
          <Route path="/my-orders" element={<ConsumerOrdersPage />} />

          {/* Retailer Operational Routes */}
          <Route path="/retailer" element={<RetailerDashboardPage />} />
          <Route path="/retailer/inventory" element={<RetailerInventoryPage />} />
          <Route path="/retailer/purchases" element={<RetailerPurchasesPage />} />
          <Route path="/retailer/orders" element={<RetailerOrdersPage />} />
          <Route path="/retailer/gst" element={<RetailerGstPage />} />
          <Route path="/retailer/expenses" element={<RetailerExpensesPage />} />
          <Route path="/retailer/pnl" element={<RetailerPnlPage />} />

          {/* Supplier Route */}
          <Route path="/supplier" element={<SupplierPortalPage />} />

          {/* Admin Route */}
          <Route path="/admin" element={<AdminPortalPage />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Global Demo Invoice Preview Modal */}
      <InvoiceModal
        invoiceId={previewInvoiceId}
        onClose={closeInvoicePreview}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 text-xs border-t border-slate-800 no-print mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-bold text-slate-200">Smart Retail India</span> — Working Prototype (October 2026)
            <div className="text-[11px] text-slate-500 mt-0.5">
              Configurable demo tax calculations • No official GST return filing or live payments claimed.
            </div>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">
            React + Express + TypeScript + SQLite
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
};

export default App;
