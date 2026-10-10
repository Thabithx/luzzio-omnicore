// ADHAN
// Financial control center for revenue breakdown, expense tracking, and estimated net profit metrics.
// Consolidated accounting across both ONLINE and POS sales channels.

import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, TrendingDown, CreditCard, Plus, RefreshCw, Trash2, Edit2, X, FileSpreadsheet } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import api from '../../services/api';
import { firstError, isBlank, isPositive } from '../../utils/formValidate';
import { useToast } from '../../components/ui/Toast';
import { useConfirm } from '../../components/ui/ConfirmModal';
import { exportFinancePnlExcelReport } from '../../utils/excelExporter';


export default function AdminFinance() {
   const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'revenue' | 'expenses' | 'reconciliation' | 'apar' | 'pnl'
   const [overview, setOverview] = useState(null);
   const [revenues, setRevenues] = useState([]);
   const [expenses, setExpenses] = useState([]);
   const [reconciliations, setReconciliations] = useState([]);
   const [aparData, setAparData] = useState(null);
   const [pnlData, setPnlData] = useState(null);
   const [loading, setLoading] = useState(false);
   const { showToast } = useToast();
   const confirm = useConfirm();

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
   const [drawerSessions, setDrawerSessions] = useState([]);
   const [drawerForm, setDrawerForm] = useState({
      cashierName: '',
      shiftType: 'FULL_DAY',
      openingFloat: '',
      cashSales: '',
      cashPayouts: '0',
      actualClosingCash: '',
      notes: ''
   });
   const [submittingDrawer, setSubmittingDrawer] = useState(false);

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
         } else if (activeTab === 'reconciliation') {
            const [reconRes, drawerRes] = await Promise.all([
               api.get('/finance/reconciliation'),
               api.get('/finance/cash-drawer-sessions')
            ]);
            setReconciliations(reconRes.data.data || []);
            setDrawerSessions(drawerRes.data.data || []);
            // Prepopulate cash sales from recorded CASH transactions if available
            const cashData = (reconRes.data.data || []).find(r => (r._id || '').toUpperCase() === 'CASH');
            if (cashData && !drawerForm.cashSales) {
               setDrawerForm(prev => ({ ...prev, cashSales: String(cashData.paidSales || cashData.totalSales || 0) }));
            }
         } else if (activeTab === 'apar') {
            const res = await api.get('/finance/ap-ar');
            setAparData(res.data.data || null);
         } else if (activeTab === 'pnl') {
            const res = await api.get('/finance/profit-loss');
            setPnlData(res.data.data || null);
         }
      } catch (err) {
         console.error('Fetch finance data error:', err);
      } finally {
         setLoading(false);
      }
   };

   const exportPnlExcel = () => {
      if (!pnlData) return;
      exportFinancePnlExcelReport({
         pnlData,
         expenses,
         filename: `Luzzio_Profit_Loss_Statement_${new Date().toISOString().slice(0, 10)}.xlsx`
      });
      showToast('P&L Statement (.XLSX) exported successfully!', 'success');
   };


   const handleExpenseSubmit = async (e) => {
      e.preventDefault();

      const error = firstError([
         { condition: isBlank(expenseForm.description),    message: 'Description is required' },
         { condition: expenseForm.description.trim().length < 3, message: 'Description must be at least 3 characters' },
         { condition: isBlank(expenseForm.amount),         message: 'Amount is required' },
         { condition: !isPositive(expenseForm.amount),     message: 'Amount must be a positive number greater than 0' },
         { condition: isBlank(expenseForm.category),       message: 'Please select a category' },
      ]);

      if (error) {
         showToast(error, 'warning');
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
         showToast('Expense recorded successfully.', 'success');
      } catch (err) {
         showToast(err.response?.data?.message || 'Failed to record expense.', 'error');
      } finally {
         setSubmittingExpense(false);
      }
   };

   const handleDrawerSubmit = async (e) => {
      e.preventDefault();
      if (!drawerForm.cashierName.trim()) {
         showToast('Cashier name is required.', 'warning');
         return;
      }
      if (drawerForm.openingFloat === '' || isNaN(Number(drawerForm.openingFloat))) {
         showToast('Please enter a valid opening cash float.', 'warning');
         return;
      }
      if (drawerForm.actualClosingCash === '' || isNaN(Number(drawerForm.actualClosingCash))) {
         showToast('Please enter actual physical cash counted.', 'warning');
         return;
      }

      setSubmittingDrawer(true);
      try {
         const res = await api.post('/finance/cash-drawer-reconcile', drawerForm);
         showToast(res.data.message || 'Cash drawer reconciled successfully!', 'success');
         setDrawerForm({
            cashierName: '',
            shiftType: 'FULL_DAY',
            openingFloat: '',
            cashSales: '',
            cashPayouts: '0',
            actualClosingCash: '',
            notes: ''
         });
         fetchFinanceData();
      } catch (err) {
         showToast(err.response?.data?.message || 'Drawer reconciliation failed.', 'error');
      } finally {
         setSubmittingDrawer(false);
      }
   };

   const handleDeleteExpense = async (id) => {
      const yes = await confirm({
         title: 'Delete Expense Entry',
         message: 'This will permanently remove this expense record from your financial ledger.',
         confirmLabel: 'Delete Expense',
         danger: true
      });
      if (!yes) return;
      try {
         await api.delete(`/finance/expenses/${id}`);
         fetchFinanceData();
         showToast('Expense entry deleted.', 'success');
      } catch (err) {
         showToast(err.response?.data?.message || 'Delete failed.', 'error');
      }
   };

   return (
      <div className="space-y-8">
         {/* Page Header */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-black text-white p-8">
            <div>
               <span className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">Financial Management Engine</span>
               <h1 className="text-2xl font-black uppercase tracking-tight mt-1">Revenue, Gateway & AP/AR Ledgers</h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
               <Button
                  onClick={() => setActiveTab('reconciliation')}
                  className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 ${activeTab === 'reconciliation' ? 'bg-white text-black' : 'bg-transparent text-white border border-white'}`}
               >
                  Reconciliation
               </Button>
               <Button
                  onClick={() => setActiveTab('apar')}
                  className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 ${activeTab === 'apar' ? 'bg-white text-black' : 'bg-transparent text-white border border-white'}`}
               >
                  AP / AR
               </Button>
               <Button
                  onClick={() => setActiveTab('pnl')}
                  className={`text-xs font-black uppercase tracking-wider px-4 py-2.5 ${activeTab === 'pnl' ? 'bg-white text-black' : 'bg-transparent text-white border border-white'}`}
               >
                  Profit & Loss (P&L)
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
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

                        <div className="bg-black text-white border-2 border-black p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Estimated Net Revenue</span>
                           <p className="text-2xl font-black text-green-400 mt-2 font-mono">Rs. {overview.netProfit.toLocaleString()}</p>
                           <p className="text-[10px] text-gray-400 mt-4">(Gross - Expenses - Refunds)</p>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6 pt-4">
                        <div className="bg-amber-50 border-2 border-amber-600 p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-800">Accounts Payable (AP)</span>
                           <p className="text-2xl font-black text-amber-900 mt-2 font-mono">Rs. {(overview.accountsPayable || 0).toLocaleString()}</p>
                           <p className="text-[10px] text-amber-700 mt-2">Money Owed to Suppliers for Pending Purchase Orders</p>
                        </div>

                        <div className="bg-blue-50 border-2 border-blue-600 p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-800">Accounts Receivable (AR)</span>
                           <p className="text-2xl font-black text-blue-900 mt-2 font-mono">Rs. {(overview.accountsReceivable || 0).toLocaleString()}</p>
                           <p className="text-[10px] text-blue-700 mt-2">Uncollected Sales Revenue / Pending Courier COD Payments</p>
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

         {/* Tab Content 4: Payment Gateway & POS Cash Drawer Reconciliation */}
         {activeTab === 'reconciliation' && (
            <div className="space-y-8">
               <div className="bg-brand-grey border border-black p-6">
                  <div className="flex items-center gap-2">
                     <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Financial Audit & Controls</span>
                     <span className="text-[8px] font-bold uppercase bg-black text-white px-2 py-0.5">Adahan</span>
                  </div>
                  <h3 className="text-base font-black uppercase tracking-tight mt-1">Payment Gateway & Cash Drawer Shift Reconciliation</h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5">ADAHAN: Reconcile payments received across multiple gateways and audit daily POS cashier cash drawer floats.</p>
               </div>

               <div className="bg-white border border-black overflow-x-auto">
                  <div className="p-4 border-b border-black bg-gray-50 flex justify-between items-center">
                     <h4 className="text-xs font-black uppercase tracking-wider">Gateway Settlement Status</h4>
                     <span className="text-[9px] font-mono text-gray-500">Live payment method aggregates</span>
                  </div>
                  <table className="w-full text-left border-collapse">
                     <thead>
                        <tr className="border-b border-black bg-brand-grey text-[9px] font-black uppercase tracking-[0.2em]">
                           <th className="p-4">Payment Gateway / Method</th>
                           <th className="p-4">Total Orders</th>
                           <th className="p-4">Recorded Sales (LKR)</th>
                           <th className="p-4">Cleared Payout (LKR)</th>
                           <th className="p-4">Pending Settlement (LKR)</th>
                           <th className="p-4">Reconciliation Status</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-200 text-xs font-mono">
                        {loading ? (
                           <tr>
                              <td colSpan="6" className="p-12 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                                 Loading Gateway Reconciliations...
                              </td>
                           </tr>
                        ) : reconciliations.length === 0 ? (
                           <tr>
                              <td colSpan="6" className="p-12 text-center text-gray-400 font-black uppercase tracking-widest">
                                 No Gateway Transactions Logged
                              </td>
                           </tr>
                        ) : (
                           reconciliations.map((item) => (
                              <tr key={item._id || item.paymentMethod} className="hover:bg-gray-50">
                                 <td className="p-4 font-black">{item._id || 'Standard'}</td>
                                 <td className="p-4 font-bold">{item.orderCount} orders</td>
                                 <td className="p-4 font-bold">LKR {item.totalSales.toLocaleString()}</td>
                                 <td className="p-4 text-emerald-700 font-bold">LKR {item.paidSales.toLocaleString()}</td>
                                 <td className="p-4 text-amber-700 font-bold">LKR {item.pendingSales.toLocaleString()}</td>
                                 <td className="p-4">
                                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase border ${item.pendingSales === 0 ? 'bg-green-100 border-green-600 text-green-700' : 'bg-amber-100 border-amber-600 text-amber-700'}`}>
                                       {item.pendingSales === 0 ? 'Balanced / Reconciled' : 'Pending Settlement'}
                                    </span>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>

               {/* ADAHAN: POS Cash Drawer Shift Reconciliation Tool */}
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Reconciliation Form */}
                  <div className="bg-white border-2 border-black p-6 space-y-4">
                     <div className="border-b border-black pb-3">
                        <div className="flex items-center gap-2">
                           <CreditCard size={14} className="text-black" />
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">POS Shift Closeout</span>
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-tight mt-1">Reconcile Cash Drawer</h4>
                        <p className="text-[9px] font-mono text-gray-400">Balance cashier physical cash against expected intake</p>
                     </div>

                     <form onSubmit={handleDrawerSubmit} className="space-y-3">
                        <div>
                           <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block mb-1">Cashier / Staff Operator *</label>
                           <Input
                              required
                              placeholder="e.g. Ruwan Perera"
                              value={drawerForm.cashierName}
                              onChange={(e) => setDrawerForm({ ...drawerForm, cashierName: e.target.value })}
                           />
                        </div>

                        <div>
                           <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block mb-1">Shift Type</label>
                           <select
                              value={drawerForm.shiftType}
                              onChange={(e) => setDrawerForm({ ...drawerForm, shiftType: e.target.value })}
                              className="w-full p-2 border border-black font-mono text-xs bg-white"
                           >
                              <option value="FULL_DAY">Full Day Shift</option>
                              <option value="MORNING">Morning Shift</option>
                              <option value="EVENING">Evening / Night Shift</option>
                           </select>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                           <div>
                              <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block mb-1">Opening Float (LKR) *</label>
                              <Input
                                 type="number"
                                 min="0"
                                 required
                                 placeholder="e.g. 10000"
                                 value={drawerForm.openingFloat}
                                 onChange={(e) => setDrawerForm({ ...drawerForm, openingFloat: e.target.value })}
                              />
                           </div>
                           <div>
                              <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block mb-1">Cash Sales (LKR)</label>
                              <Input
                                 type="number"
                                 min="0"
                                 placeholder="e.g. 45000"
                                 value={drawerForm.cashSales}
                                 onChange={(e) => setDrawerForm({ ...drawerForm, cashSales: e.target.value })}
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                           <div>
                              <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block mb-1">Cash Payouts (LKR)</label>
                              <Input
                                 type="number"
                                 min="0"
                                 placeholder="0"
                                 value={drawerForm.cashPayouts}
                                 onChange={(e) => setDrawerForm({ ...drawerForm, cashPayouts: e.target.value })}
                              />
                           </div>
                           <div>
                              <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block mb-1">Actual Cash Count (LKR) *</label>
                              <Input
                                 type="number"
                                 min="0"
                                 required
                                 placeholder="Counted cash"
                                 value={drawerForm.actualClosingCash}
                                 onChange={(e) => setDrawerForm({ ...drawerForm, actualClosingCash: e.target.value })}
                              />
                           </div>
                        </div>

                        {/* Live Calculation Preview */}
                        {(() => {
                           const opening = Number(drawerForm.openingFloat) || 0;
                           const sales = Number(drawerForm.cashSales) || 0;
                           const payouts = Number(drawerForm.cashPayouts) || 0;
                           const actual = Number(drawerForm.actualClosingCash) || 0;
                           const expected = opening + sales - payouts;
                           const variance = actual - expected;

                           return (
                              <div className="p-3 bg-brand-grey border border-black space-y-1.5 font-mono text-[10px]">
                                 <div className="flex justify-between">
                                    <span className="text-gray-500">Expected In Drawer:</span>
                                    <span className="font-bold">LKR {expected.toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between">
                                    <span className="text-gray-500">Actual Counted:</span>
                                    <span className="font-bold">LKR {actual.toLocaleString()}</span>
                                 </div>
                                 <div className="flex justify-between items-center pt-1.5 border-t border-black/20 font-black">
                                    <span>Drawer Variance:</span>
                                    <span className={`px-2 py-0.5 border ${
                                       variance === 0
                                          ? 'bg-green-100 border-green-600 text-green-700'
                                          : variance > 0
                                          ? 'bg-blue-100 border-blue-600 text-blue-700'
                                          : 'bg-red-100 border-red-600 text-red-700'
                                    }`}>
                                       {variance === 0 ? 'BALANCED' : variance > 0 ? `+LKR ${variance.toLocaleString()} OVER` : `-LKR ${Math.abs(variance).toLocaleString()} SHORT`}
                                    </span>
                                 </div>
                              </div>
                           );
                        })()}

                        <div>
                           <label className="text-[9px] font-black uppercase tracking-wider text-gray-500 block mb-1">Reconciliation Notes</label>
                           <textarea
                              rows="2"
                              value={drawerForm.notes}
                              onChange={(e) => setDrawerForm({ ...drawerForm, notes: e.target.value })}
                              placeholder="Optional cashier or supervisor notes..."
                              className="w-full p-2 border border-black text-xs font-mono resize-none"
                           />
                        </div>

                        <Button
                           type="submit"
                           disabled={submittingDrawer}
                           className="w-full bg-black text-white text-xs font-black uppercase py-3 shadow-sm hover:bg-gray-800"
                        >
                           {submittingDrawer ? 'Reconciling...' : 'Record Shift Reconciliation'}
                        </Button>
                     </form>
                  </div>

                  {/* Reconciliation History Ledger */}
                  <div className="lg:col-span-2 bg-white border border-black overflow-x-auto">
                     <div className="p-4 border-b border-black bg-gray-50 flex justify-between items-center">
                        <h4 className="text-xs font-black uppercase tracking-wider">Cash Drawer Shift Audit Ledger</h4>
                        <span className="text-[9px] font-mono text-gray-500">{drawerSessions.length} sessions logged</span>
                     </div>
                     <table className="w-full text-left border-collapse text-xs font-mono">
                        <thead>
                           <tr className="border-b border-black bg-brand-grey text-[9px] font-black uppercase tracking-[0.2em]">
                              <th className="p-3">Shift Date</th>
                              <th className="p-3">Cashier</th>
                              <th className="p-3">Float</th>
                              <th className="p-3">Expected</th>
                              <th className="p-3">Actual Count</th>
                              <th className="p-3">Variance</th>
                              <th className="p-3">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                           {drawerSessions.length === 0 ? (
                              <tr>
                                 <td colSpan="7" className="p-10 text-center text-gray-400 font-black uppercase tracking-widest">
                                    No Cash Drawer Shift Reconciliations Recorded
                                 </td>
                              </tr>
                           ) : (
                              drawerSessions.map((s) => (
                                 <tr key={s._id} className="hover:bg-gray-50">
                                    <td className="p-3 font-bold">
                                       <p>{new Date(s.createdAt).toLocaleDateString()}</p>
                                       <p className="text-[9px] text-gray-400">{new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </td>
                                    <td className="p-3 font-black">
                                       <p>{s.cashierName}</p>
                                       <span className="text-[8px] uppercase tracking-wider text-gray-400">{s.shiftType}</span>
                                    </td>
                                    <td className="p-3">LKR {s.openingFloat?.toLocaleString()}</td>
                                    <td className="p-3 font-bold">LKR {s.expectedClosingCash?.toLocaleString()}</td>
                                    <td className="p-3 font-bold text-black">LKR {s.actualClosingCash?.toLocaleString()}</td>
                                    <td className="p-3 font-black">
                                       <span className={s.variance === 0 ? 'text-green-700' : s.variance > 0 ? 'text-blue-700' : 'text-red-600'}>
                                          {s.variance >= 0 ? `+${s.variance.toLocaleString()}` : s.variance.toLocaleString()}
                                       </span>
                                    </td>
                                    <td className="p-3">
                                       <span className={`px-2 py-0.5 text-[8px] font-black uppercase border ${
                                          s.status === 'BALANCED'
                                             ? 'bg-green-100 border-green-600 text-green-700'
                                             : s.status === 'OVERAGE'
                                             ? 'bg-blue-100 border-blue-600 text-blue-700'
                                             : 'bg-red-100 border-red-600 text-red-700'
                                       }`}>
                                          {s.status}
                                       </span>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
         )}

         {/* Tab Content 5: Accounts Payable & Receivable (AP/AR) */}
         {activeTab === 'apar' && (
            <div className="space-y-8">
               <div className="bg-brand-grey border border-black p-6">
                  <h3 className="text-sm font-black uppercase tracking-wider">Accounts Payable & Accounts Receivable Ledger</h3>
                  <p className="text-[10px] text-gray-500 font-mono mt-1">ADAHAN: Track money owed to suppliers (AP) vs pending customer & courier COD payments (AR).</p>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Accounts Payable Table */}
                  <div className="bg-white border border-black space-y-4 p-6">
                     <div className="flex justify-between items-center border-b border-black pb-4">
                        <div>
                           <span className="text-[9px] font-black uppercase text-amber-700 tracking-wider">Liability</span>
                           <h4 className="text-base font-black uppercase">Accounts Payable (AP)</h4>
                        </div>
                        <span className="px-3 py-1 bg-amber-100 border border-amber-600 text-amber-800 text-xs font-black">
                           Supplier Owed: LKR {aparData?.payables?.reduce((acc, p) => acc + p.totalCost, 0).toLocaleString() || 0}
                        </span>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                           <thead>
                              <tr className="border-b border-black text-[9px] font-black uppercase tracking-wider">
                                 <th className="py-2">PO #</th>
                                 <th className="py-2">Supplier</th>
                                 <th className="py-2 text-right">Amount (LKR)</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200">
                              {!aparData?.payables?.length ? (
                                 <tr><td colSpan="3" className="py-6 text-center text-gray-400">No Pending Supplier Payables</td></tr>
                              ) : (
                                 aparData.payables.map(po => (
                                    <tr key={po._id}>
                                       <td className="py-3 font-bold">{po.poNumber}</td>
                                       <td className="py-3">{po.supplier?.supplierName || 'Supplier'}</td>
                                       <td className="py-3 text-right font-black text-amber-700">LKR {po.totalCost.toLocaleString()}</td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Accounts Receivable Table */}
                  <div className="bg-white border border-black space-y-4 p-6">
                     <div className="flex justify-between items-center border-b border-black pb-4">
                        <div>
                           <span className="text-[9px] font-black uppercase text-blue-700 tracking-wider">Asset</span>
                           <h4 className="text-base font-black uppercase">Accounts Receivable (AR)</h4>
                        </div>
                        <span className="px-3 py-1 bg-blue-100 border border-blue-600 text-blue-800 text-xs font-black">
                           Pending Sales: LKR {aparData?.receivables?.reduce((acc, r) => acc + r.totalPrice, 0).toLocaleString() || 0}
                        </span>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs font-mono">
                           <thead>
                              <tr className="border-b border-black text-[9px] font-black uppercase tracking-wider">
                                 <th className="py-2">Order #</th>
                                 <th className="py-2">Method</th>
                                 <th className="py-2 text-right">Amount (LKR)</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y divide-gray-200">
                              {!aparData?.receivables?.length ? (
                                 <tr><td colSpan="3" className="py-6 text-center text-gray-400">No Pending Customer Receivables</td></tr>
                              ) : (
                                 aparData.receivables.map(ord => (
                                    <tr key={ord._id}>
                                       <td className="py-3 font-bold">#{ord.orderNumber || ord._id.slice(-6).toUpperCase()}</td>
                                       <td className="py-3">{ord.paymentMethod}</td>
                                       <td className="py-3 text-right font-black text-blue-700">LKR {ord.totalPrice.toLocaleString()}</td>
                                    </tr>
                                 ))
                              )}
                           </tbody>
                        </table>
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* Tab Content 6: Profit & Loss (P&L) Statement & Cash Flow Summaries */}
         {activeTab === 'pnl' && (
            <div className="space-y-8">
               <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border-2 border-black p-6">
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tight">Executive Profit & Loss (P&L) Statement</h3>
                     <p className="text-xs text-gray-500 mt-1">Consolidated revenue, COGS, operating overheads, and cash flow liquidity</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                     <Button onClick={exportPnlExcel} className="bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black uppercase px-5 py-3 flex items-center gap-2 shadow-sm">
                        <FileSpreadsheet className="w-4 h-4" /> Download P&L Statement (.XLSX)
                     </Button>
                  </div>
               </div>

               {loading ? (
                  <div className="py-20 text-center text-xs font-black uppercase tracking-widest animate-pulse">
                     Calculating Comprehensive P&L Statement...
                  </div>
               ) : pnlData ? (
                  <>
                     {/* KPI Cards */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white border-2 border-black p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Gross Sales Revenue</span>
                           <p className="text-2xl font-black mt-2 font-mono text-black">LKR {pnlData.revenue.grossRevenue.toLocaleString()}</p>
                           <p className="text-[10px] text-gray-400 mt-2">{pnlData.revenue.orderCount} total customer orders</p>
                        </div>

                        <div className="bg-white border-2 border-black p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Cost of Goods Sold (COGS)</span>
                           <p className="text-2xl font-black mt-2 font-mono text-amber-700">LKR {pnlData.cogs.totalCOGS.toLocaleString()}</p>
                           <p className="text-[10px] text-gray-400 mt-2">Gross Margin: {pnlData.cogs.grossMarginPercent}%</p>
                        </div>

                        <div className="bg-white border-2 border-black p-6">
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">Operating Expenses</span>
                           <p className="text-2xl font-black mt-2 font-mono text-red-600">LKR {pnlData.expenses.totalExpenses.toLocaleString()}</p>
                           <p className="text-[10px] text-gray-400 mt-2">{Object.keys(pnlData.expenses.breakdown || {}).length} expense categories</p>
                        </div>

                        <div className={`border-2 border-black p-6 ${pnlData.netIncome.netProfit >= 0 ? 'bg-black text-white' : 'bg-red-50 text-red-900'}`}>
                           <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-60">Net Operating Profit</span>
                           <p className={`text-2xl font-black mt-2 font-mono ${pnlData.netIncome.netProfit >= 0 ? 'text-green-400' : 'text-red-600'}`}>
                              LKR {pnlData.netIncome.netProfit.toLocaleString()}
                           </p>
                           <p className="text-[10px] opacity-75 mt-2">Net Margin: {pnlData.netIncome.netProfitMargin}%</p>
                        </div>
                     </div>

                     {/* Breakdown Sections */}
                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* P&L Statement Table */}
                        <div className="bg-white border-2 border-black p-6 space-y-4">
                           <h4 className="text-sm font-black uppercase tracking-wider border-b border-black pb-3">Income Statement Summary</h4>
                           <div className="space-y-3 text-xs font-mono">
                              <div className="flex justify-between py-2 border-b border-gray-100 font-bold">
                                 <span>1. Gross Sales Revenue</span>
                                 <span>LKR {pnlData.revenue.grossRevenue.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100 text-amber-800">
                                 <span>2. Less: Cost of Goods Sold (COGS)</span>
                                 <span>- LKR {pnlData.cogs.totalCOGS.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b-2 border-black font-black bg-gray-50 px-2">
                                 <span>= GROSS PROFIT</span>
                                 <span>LKR {pnlData.cogs.grossProfit.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100 text-red-600 font-bold">
                                 <span>3. Less: Operating Expenses</span>
                                 <span>- LKR {pnlData.expenses.totalExpenses.toLocaleString()}</span>
                              </div>
                              {Object.entries(pnlData.expenses.breakdown || {}).map(([cat, amt]) => (
                                 <div key={cat} className="flex justify-between py-1 pl-4 text-gray-500 text-[11px]">
                                    <span>• {cat}</span>
                                    <span>LKR {amt.toLocaleString()}</span>
                                 </div>
                              ))}
                              <div className={`flex justify-between py-3 border-t-2 border-black font-black text-sm px-2 ${pnlData.netIncome.netProfit >= 0 ? 'bg-green-50 text-green-900' : 'bg-red-50 text-red-900'}`}>
                                 <span>= NET OPERATING INCOME</span>
                                 <span>LKR {pnlData.netIncome.netProfit.toLocaleString()}</span>
                              </div>
                           </div>
                        </div>

                        {/* Cash Flow Summary Table */}
                        <div className="bg-white border-2 border-black p-6 space-y-4">
                           <h4 className="text-sm font-black uppercase tracking-wider border-b border-black pb-3">Cash Flow Liquidity Summary</h4>
                           <div className="space-y-3 text-xs font-mono">
                              <div className="flex justify-between py-2 border-b border-gray-100 text-green-700 font-bold">
                                 <span>(+) Cash Inflows (Collected Sales)</span>
                                 <span>+ LKR {pnlData.cashFlow.inflow.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between py-2 border-b border-gray-100 text-red-600 font-bold">
                                 <span>(-) Cash Outflows (Overheads + Stock Purchases)</span>
                                 <span>- LKR {pnlData.cashFlow.outflow.toLocaleString()}</span>
                              </div>
                              <div className={`flex justify-between py-3 border-t-2 border-black font-black text-sm px-2 ${pnlData.cashFlow.netCashFlow >= 0 ? 'bg-blue-50 text-blue-900' : 'bg-amber-50 text-amber-900'}`}>
                                 <span>(=) NET CASH FLOW POSITION</span>
                                 <span>LKR {pnlData.cashFlow.netCashFlow.toLocaleString()}</span>
                              </div>
                              <p className="text-[10px] text-gray-500 mt-4 leading-relaxed font-sans">
                                 * Positive cash flow indicates solvent operational health. Negative balances indicate seasonal capital outlay in inventory acquisition.
                              </p>
                           </div>
                        </div>
                     </div>
                  </>
               ) : null}
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
                           min="0.01"
                           step="0.01"
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
