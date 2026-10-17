import React, { useEffect, useState } from 'react';
import { DollarSign, Plus, X, Tag, FileText, Info } from 'lucide-react';
import { api, formatInr, formatDate } from '../services/api';
import { useApp } from '../context/AppContext';
import { RoleAccessRequired } from '../components/RoleAccessRequired';

export const RetailerExpensesPage: React.FC = () => {
  const { currentUser, showNotification } = useApp();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Expense Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [category, setCategory] = useState<'RENT' | 'UTILITIES' | 'STAFF' | 'LOGISTICS' | 'PACKAGING' | 'MAINTENANCE' | 'OTHER'>('UTILITIES');
  const [description, setDescription] = useState('');
  const [amountRupees, setAmountRupees] = useState('');
  const [taxNote, setTaxNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadExpenses = async () => {
    if (currentUser && currentUser.role !== 'retailer' && currentUser.role !== 'admin') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getExpenses();
      setExpenses(res.expenses);
    } catch (err: any) {
      showNotification(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser?.role === 'retailer' || currentUser?.role === 'admin') {
      loadExpenses();
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amountRupees || Number(amountRupees) <= 0) {
      showNotification('Please provide a valid description and amount', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const amountPaise = Math.round(Number(amountRupees) * 100);
      await api.recordExpense({
        category,
        description,
        amountPaise,
        taxTreatmentNote: taxNote,
      });

      showNotification('Operating expense recorded successfully', 'success');
      setModalOpen(false);
      setDescription('');
      setAmountRupees('');
      setTaxNote('');
      loadExpenses();
    } catch (err: any) {
      showNotification(err.message || 'Failed to record expense', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const totalExpensesPaise = expenses.reduce((sum, e) => sum + e.amount_paise, 0);

  if (currentUser && currentUser.role !== 'retailer' && currentUser.role !== 'admin') {
    return <RoleAccessRequired requiredRole="retailer" />;
  }

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Operating Expenses & Overhead Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Log store rentals, helper wages, utilities, and packaging costs for net profit reporting.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-400" />
          Record Operating Expense
        </button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Total Recorded Store Overhead
          </span>
          <div className="text-2xl font-black text-slate-900 font-mono">
            {formatInr(totalExpensesPaise)}
          </div>
          <div className="text-[11px] text-slate-400">
            Across {expenses.length} recorded expense transactions
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-slate-800">Accounting Distinction:</span>
            <p>
              Operating expenses directly reduce Gross Profit to arrive at Estimated Net Profit. Note that inventory purchases are not immediate expenses; unsold goods remain as asset inventory.
            </p>
          </div>
        </div>
      </div>

      {/* Expenses List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] font-bold tracking-wider border-b">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Tax Treatment / Note</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading recorded expenses...
                  </td>
                </tr>
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No operating expenses recorded yet.
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">
                      {exp.date ? exp.date.substring(0, 10) : '-'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold font-mono">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {exp.description}
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {exp.tax_treatment_note || '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-black text-rose-600">
                      {formatInr(exp.amount_paise)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900">Record Operating Expense</h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Category</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                >
                  <option value="RENT">Shop Rent</option>
                  <option value="UTILITIES">Electricity & Water</option>
                  <option value="STAFF">Helper / Delivery Wages</option>
                  <option value="PACKAGING">Packaging Materials</option>
                  <option value="LOGISTICS">Transport & Freight</option>
                  <option value="MAINTENANCE">Equipment / Store Repair</option>
                  <option value="OTHER">Other Operational Overhead</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Description / Vendor</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BSES Monthly electricity power bill"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount in Rupees (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 4500.00"
                  value={amountRupees}
                  onChange={e => setAmountRupees(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tax Treatment Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Exempt electricity tariff, or 18% GST paid"
                  value={taxNote}
                  onChange={e => setTaxNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
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
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition shadow-xs"
                >
                  {submitting ? 'Recording...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
