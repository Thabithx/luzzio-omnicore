// ADHAN
// Financial control center for revenue breakdown, expense tracking, and estimated net profit metrics.
// Consolidated accounting across both ONLINE and POS sales channels.

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Plus, RefreshCw, Trash2, Edit2, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';

export default function AdminFinance() {
   const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'revenue' | 'expenses'
   const [overview, setOverview] = useState(null);
   const [revenues, setRevenues] = useState([]);
   const [expenses, setExpenses] = useState([]);
   const [loading, setLoading] = useState(false);

   // Expense Modal State
   const [showExpenseModal, setShowExpenseModal] = useState(false);
   const [expenseForm, setExpenseForm] = useState({
      category: 'Utilities',
      description: '',
      amount: '',
      paymentMethod: 'CASH',
      reference: '',
      notes: ''
   });
   const [submittingExpense, setSubmittingExpense] = useState(false);

   useEffect(() => {
      fetchFinanceData();
   }, [activeTab]);

   const fetchFinanceData = async () => {
      setLoading(true);
      try {
         if (activeTab === 'overview') {
            const res = await api.get('/finance/overview');
            setOverview(res.data.data || null);
         } else if (activeTab === 'revenue') {
            const res = await api.get('/finance/revenue');
            setRevenues(res.data.data || []);
         } else if (activeTab === 'expenses') {
            const res = await api.get('/finance/expenses');
            setExpenses(res.data.data || []);
         }
      } catch (err) {
         console.error('Fetch finance data error:', err);
      } finally {
         setLoading(false);
      }
   };

   const handleExpenseSubmit = async (e) => {
      e.preventDefault();
      if (!expenseForm.description || !expenseForm.amount) {
         alert('Please enter a description and amount');
         return;
      }

      setSubmittingExpense(true);
      try {
         await api.post('/finance/expenses', expenseForm);
         setShowExpenseModal(false);
         setExpenseForm({
            category: 'Utilities',
            description: '',
            amount: '',
            paymentMethod: 'CASH',
            reference: '',
            notes: ''
         });
         fetchFinanceData();
      } catch (err) {
         alert(err.response?.data?.message || 'Failed to record expense');
      } finally {
         setSubmittingExpense(false);
      }
   };

   const handleDeleteExpense = async (id) => {
      if (!window.confirm('Delete this expense entry?')) return;
      try {
         await api.delete(`/finance/expenses/${id}`);
         fetchFinanceData();
      } catch (err) {
         alert(err.response?.data?.message || 'Delete failed');
      }
   };

   return (
      <div className="space-y-8">
         {/* Page Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black text-white p-8">
            <div>
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Financial Management Engine</span>
               <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Revenue & Expense Ledgers</h1>
            </div>
            <div className="flex items-center gap-2">
               <Button
                  onClick={() => setActiveTab('overview')}
                  className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 ${activeTab === 'overview' ? 'bg-white text-black' : 'bg-transparent text-white border border-white'}`}
               >
                  Overview
               </Button>
               <Button
                  onClick={() => setActiveTab('revenue')}
                  className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 ${activeTab === 'revenue' ? 'bg-white text-black' : 'bg-transparent text-white border border-white'}`}
               >
                  Revenues
               </Button>
               <Button
                  onClick={() => setActiveTab('expenses')}
                  className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 ${activeTab === 'expenses' ? 'bg-white text-black' : 'bg-transparent text-white border border-white'}`}
               >
                  Expenses
               </Button>
            </div>
         </div>

         {/* Tab Content 1: Overview Dashboard Cards */}
         {activeTab === 'overview' && (
            <div className="space-y-8">
               {loading ? (
                  <div className="py-20 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                     Calculating Financial Metrics...
                  </div>
               ) : overview ? (
                  <>
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white border-2 border-black p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Total Gross Revenue</span>
                           <p className="text-2xl font-black mt-2 font-mono">Rs. {overview.totalRevenue.toLocaleString()}</p>
                           <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between text-[10px] font-mono text-gray-500">
                              <span>Online: Rs. {overview.onlineRevenue.toLocaleString()}</span>
                              <span>POS: Rs. {overview.posRevenue.toLocaleString()}</span>
                           </div>
                        </div>

                        <div className="bg-white border-2 border-black p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Total Operating Expenses</span>
                           <p className="text-2xl font-black text-red-600 mt-2 font-mono">Rs. {overview.totalExpenses.toLocaleString()}</p>
                           <p className="text-[10px] text-gray-400 mt-4">Supplier, Rent, Salaries, Utilities</p>
                        </div>

                        <div className="bg-white border-2 border-black p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Total Refunds Issued</span>
                           <p className="text-2xl font-black text-amber-600 mt-2 font-mono">Rs. {overview.totalRefunds.toLocaleString()}</p>
                           <p className="text-[10px] text-gray-400 mt-4">Approved Customer Returns</p>
                        </div>

                        <div className="bg-black text-white border-2 border-black p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Estimated Net Revenue</span>
                           <p className="text-2xl font-black text-green-400 mt-2 font-mono">Rs. {overview.netProfit.toLocaleString()}</p>
                           <p className="text-[10px] text-gray-400 mt-4">(Gross - Expenses - Refunds)</p>
                        </div>
                     </div>
                  </>
               ) : null}
            </div>
         )}

         {/* Tab Content 2: Revenue Stream Ledger */}
         {activeTab === 'revenue' && (
            <div className="bg-white border border-black overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                     <tr className="border-b border-black bg-brand-grey text-[9px] font-black uppercase tracking-[0.2em]">
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">Channel</th>
                        <th className="p-4">Order ID</th>
                        <th className="p-4">Amount</th>
                        <th className="p-4">Payment Method</th>
                        <th className="p-4">Status</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs font-mono">
                     {loading ? (
                        <tr>
                           <td colSpan="6" className="p-12 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                              Loading Revenue Transactions...
                           </td>
                        </tr>
                     ) : revenues.length === 0 ? (
                        <tr>
                           <td colSpan="6" className="p-12 text-center text-gray-400 font-black uppercase tracking-widest">
                              No Revenue Transactions Found
                           </td>
                        </tr>
                     ) : (
                        revenues.map((r) => (
                           <tr key={r._id} className="hover:bg-gray-50">
                              <td className="p-4 text-[10px] text-gray-500">
                                 {new Date(r.timestamp).toLocaleString()}
                              </td>
                              <td className="p-4">
                                 <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${r.sourceChannel === 'POS' ? 'bg-black text-white border-black' : 'bg-brand-grey text-black border-black'}`}>
                                    {r.sourceChannel}
                                 </span>
                              </td>
                              <td className="p-4 font-bold text-blue-600">
                                 #{r.orderId?.orderNumber || (r.orderId?._id ? r.orderId._id.slice(-6).toUpperCase() : 'N/A')}
                              </td>
                              <td className={`p-4 font-black ${r.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                 Rs. {r.amount.toLocaleString()}
                              </td>
                              <td className="p-4">{r.paymentMethod}</td>
                              <td className="p-4">
                                 <span className="px-2 py-0.5 text-[8px] font-black uppercase border border-black bg-gray-100">
                                    {r.status}
                                 </span>
                              </td>
                           </tr>
                        ))
                     )}
                  </tbody>
               </table>
            </div>
         )}

         {/* Tab Content 3: Expense Manager */}
         {activeTab === 'expenses' && (
            <div className="space-y-6">
               <div className="flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest">Operating Expenses Log</h3>
                  <Button onClick={() => setShowExpenseModal(true)} className="bg-black text-white text-xs font-black uppercase px-6 py-2.5">
                     <Plus size={14} className="mr-2 inline" /> Record New Expense
                  </Button>
               </div>

               <div className="bg-white border border-black overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b border-black bg-brand-grey text-[9px] font-black uppercase tracking-[0.2em]">
                           <th className="p-4">Date</th>
                           <th className="p-4">Category</th>
                           <th className="p-4">Description</th>
                           <th className="p-4">Amount</th>
                           <th className="p-4">Method / Ref</th>
                           <th className="p-4 text-right">Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200 text-xs font-mono">
                        {loading ? (
                           <tr>
                              <td colSpan="6" className="p-12 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                                 Loading Expense Records...
                              </td>
                           </tr>
                        ) : expenses.length === 0 ? (
                           <tr>
                              <td colSpan="6" className="p-12 text-center text-gray-400 font-black uppercase tracking-widest">
                                 No Business Expenses Recorded
                              </td>
                           </tr>
                        ) : (
                           expenses.map((e) => (
                              <tr key={e._id} className="hover:bg-gray-50">
                                 <td className="p-4 text-[10px] text-gray-500">
                                    {new Date(e.date).toLocaleDateString()}
                                 </td>
                                 <td className="p-4 font-sans font-black uppercase">
                                    {e.category}
                                 </td>
                                 <td className="p-4 font-sans">
                                    {e.description}
                                 </td>
                                 <td className="p-4 font-black text-red-600">
                                    Rs. {e.amount.toLocaleString()}
                                 </td>
                                 <td className="p-4 text-gray-500">
                                    {e.paymentMethod} {e.reference ? `(${e.reference})` : ''}
                                 </td>
                                 <td className="p-4 text-right">
                                    <button onClick={() => handleDeleteExpense(e._id)} className="text-red-600 hover:underline">
                                       <Trash2 size={14} />
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

         {/* Create Expense Modal */}
         {showExpenseModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-black p-8 max-w-md w-full space-y-6">
                  <div className="flex justify-between items-center border-b border-black pb-4">
                     <h3 className="text-sm font-black uppercase tracking-widest">Record Business Expense</h3>
                     <button onClick={() => setShowExpenseModal(false)}><X size={18} /></button>
                  </div>

                  <form onSubmit={handleExpenseSubmit} className="space-y-4">
                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Expense Category *</label>
                        <select
                           value={expenseForm.category}
                           onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}
                           className="w-full p-2.5 border border-black font-mono text-xs bg-white"
                        >
                           <option value="Rent">Rent</option>
                           <option value="Salaries">Salaries</option>
                           <option value="Utilities">Utilities</option>
                           <option value="Supplier Payments">Supplier Payments</option>
                           <option value="Transportation">Transportation</option>
                           <option value="Marketing">Marketing</option>
                           <option value="Maintenance">Maintenance</option>
                           <option value="Other">Other</option>
                        </select>
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Description *</label>
                        <Input
                           type="text"
                           required
                           placeholder="e.g. Monthly Electricity Bill"
                           value={expenseForm.description}
                           onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                        />
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Amount (Rs.) *</label>
                        <Input
                           type="number"
                           required
                           min="0"
                           value={expenseForm.amount}
                           onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                           className="font-mono text-base font-bold"
                        />
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Payment Method</label>
                        <select
                           value={expenseForm.paymentMethod}
                           onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}
                           className="w-full p-2.5 border border-black font-mono text-xs bg-white"
                        >
                           <option value="CASH">CASH</option>
                           <option value="CARD">CARD</option>
                           <option value="BANK_TRANSFER">BANK TRANSFER</option>
                           <option value="CHEQUE">CHEQUE</option>
                           <option value="OTHER">OTHER</option>
                        </select>
                     </div>

                     <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 block mb-1">Reference # (Optional)</label>
                        <Input
                           type="text"
                           value={expenseForm.reference}
                           onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}
                        />
                     </div>

                     <div className="flex gap-4 pt-4 border-t border-black">
                        <Button type="submit" disabled={submittingExpense} className="flex-1 bg-black text-white text-xs font-black uppercase py-3">
                           {submittingExpense ? 'Recording...' : 'Save Expense'}
                        </Button>
                        <Button type="button" onClick={() => setShowExpenseModal(false)} className="bg-brand-grey border border-black text-black text-xs font-black uppercase px-6">
                           Cancel
                        </Button>
                     </div>
                  </form>
               </div>
            </div>
         )}
      </div>
   );
}
