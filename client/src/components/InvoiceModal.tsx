import React, { useEffect, useState } from 'react';
import { X, Printer, AlertTriangle, CheckCircle } from 'lucide-react';
import { api, formatInr, formatDate } from '../services/api';
import { Invoice } from '../types';

interface InvoiceModalProps {
  invoiceId: string | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoiceId, onClose }) => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) return;

    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getInvoice(invoiceId);
        setInvoice(data.invoice);
      } catch (err: any) {
        setError(err.message || 'Failed to load invoice');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  if (!invoiceId) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Controls Header (Hidden during print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-200 no-print">
          <div className="flex items-center gap-2">
            <span className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded">
              GST Tax Invoice
            </span>
            <span className="text-sm font-semibold text-slate-800">
              {invoice?.invoiceNumber || 'Loading...'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              disabled={loading || !invoice}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Invoice Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 font-sans text-slate-800 bg-white">
          {loading && (
            <div className="py-16 text-center text-slate-500 font-medium">
              Generating printable demo invoice snapshot...
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
              {error}
            </div>
          )}

          {invoice && (
            <div className="max-w-3xl mx-auto space-y-6">
              
              {/* Prominent Prototype Disclaimer Banner */}
              <div className="bg-amber-50 border-2 border-dashed border-amber-300 rounded-xl p-3 text-center text-xs font-semibold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 inline mr-1 -mt-0.5" />
                DEMO INVOICE PREVIEW — NOT AN OFFICIAL TAX INVOICE OR STATUTORY FILING
                <div className="text-[11px] font-normal text-amber-800 mt-0.5">
                  Simulated transaction document generated for Smart Retail India prototype testing.
                </div>
              </div>

              {/* Invoice Header */}
              <div className="flex flex-col md:flex-row justify-between border-b pb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">TAX INVOICE</h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    Invoice No: <span className="font-bold text-slate-900">{invoice.invoiceNumber}</span>
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    Issue Date: <span className="font-bold text-slate-900">{formatDate(invoice.issueDate)}</span>
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    Supply Type: <span className="font-bold text-blue-700">{invoice.supplyType === 'INTRA_STATE' ? 'Intra-State Supply (CGST + SGST)' : 'Inter-State Supply (IGST)'}</span>
                  </p>
                </div>

                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white font-extrabold text-sm px-3 py-1 rounded">
                    Smart Retail India Demo
                  </div>
                  <p className="text-xs text-emerald-700 font-bold mt-1.5 flex items-center justify-end gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Status: {invoice.status}
                  </p>
                </div>
              </div>

              {/* Seller and Buyer Details Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                    Seller (Supplier / Retailer):
                  </h4>
                  <div className="font-bold text-sm text-slate-900">{invoice.seller?.shopName}</div>
                  <div className="text-slate-600 mt-0.5">{invoice.seller?.address}</div>
                  <div className="text-slate-600">State: <span className="font-medium text-slate-800">{invoice.seller?.state}</span></div>
                  <div className="text-slate-600">Phone: {invoice.seller?.phone}</div>
                  <div className="mt-1 font-mono font-bold text-blue-900 bg-blue-50/80 px-2 py-0.5 rounded inline-block border border-blue-200">
                    Demo GSTIN: {invoice.seller?.demoGstin}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                    Buyer (Customer):
                  </h4>
                  <div className="font-bold text-sm text-slate-900">{invoice.buyer?.name}</div>
                  <div className="text-slate-600 mt-0.5">{invoice.buyer?.address || 'Counter Store Pickup'}</div>
                  <div className="text-slate-600">Phone: {invoice.buyer?.phone}</div>
                  <div className="text-slate-500 italic mt-1">Place of Supply: {invoice.seller?.state}</div>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-semibold uppercase text-[10px] tracking-wider border-b">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Item & SKU</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Taxable Val</th>
                      <th className="py-2.5 px-3 text-center">GST Rate</th>
                      {invoice.supplyType === 'INTRA_STATE' ? (
                        <>
                          <th className="py-2.5 px-3 text-right">CGST</th>
                          <th className="py-2.5 px-3 text-right">SGST</th>
                        </>
                      ) : (
                        <th className="py-2.5 px-3 text-right">IGST</th>
                      )}
                      <th className="py-2.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                    {invoice.lines?.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 text-slate-400 font-sans">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-sans">
                          <div className="font-semibold text-slate-900">{line.productName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{line.sku}</div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{line.quantity}</td>
                        <td className="py-2.5 px-3 text-right">{formatInr(line.unitPricePaise)}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{formatInr(line.taxableAmountPaise)}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600 font-sans">{line.taxRatePercent}%</td>
                        {invoice.supplyType === 'INTRA_STATE' ? (
                          <>
                            <td className="py-2.5 px-3 text-right text-slate-600">{formatInr(line.cgstPaise)}</td>
                            <td className="py-2.5 px-3 text-right text-slate-600">{formatInr(line.sgstPaise)}</td>
                          </>
                        ) : (
                          <td className="py-2.5 px-3 text-right text-slate-600">{formatInr(line.igstPaise)}</td>
                        )}
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{formatInr(line.totalPaise)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tax Summary Totals */}
              <div className="flex flex-col md:flex-row justify-between items-start gap-4 pt-2">
                <div className="text-xs text-slate-500 max-w-sm space-y-1">
                  <p className="font-bold text-slate-700">Prototype Calculation Notes:</p>
                  <p>• Tax calculated using integer paise precision arithmetic.</p>
                  <p>• Intra-state supply split into 50% CGST and 50% SGST.</p>
                  <p>• Prices include demo tax where applicable.</p>
                </div>

                <div className="w-full md:w-72 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Subtotal:</span>
                    <span className="font-mono font-bold text-slate-800">{formatInr(invoice.taxableSubtotalPaise)}</span>
                  </div>

                  {invoice.supplyType === 'INTRA_STATE' ? (
                    <>
                      <div className="flex justify-between text-slate-600">
                        <span>Central GST (CGST):</span>
                        <span className="font-mono font-medium text-slate-800">{formatInr(invoice.cgstPaise)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>State GST (SGST):</span>
                        <span className="font-mono font-medium text-slate-800">{formatInr(invoice.sgstPaise)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>Integrated GST (IGST):</span>
                      <span className="font-mono font-medium text-slate-800">{formatInr(invoice.igstPaise)}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600 border-t pt-1.5">
                    <span className="font-semibold">Total GST Amount:</span>
                    <span className="font-mono font-bold text-blue-700">{formatInr(invoice.totalTaxPaise)}</span>
                  </div>

                  <div className="flex justify-between text-sm font-black text-slate-900 border-t-2 border-slate-300 pt-2">
                    <span>Grand Total (INR):</span>
                    <span className="text-emerald-700">{formatInr(invoice.totalPaise)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Declaration */}
              <div className="border-t pt-4 text-center text-[10px] text-slate-400 space-y-1">
                <p>This is a computer-generated demonstration invoice and does not constitute a legally verified tax document.</p>
                <p>Smart Retail India MVP Prototype • Generated on {formatDate(new Date().toISOString())}</p>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
};
