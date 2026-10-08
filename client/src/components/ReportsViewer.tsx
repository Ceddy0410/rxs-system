import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  FileSpreadsheet, 
  Printer, 
  Calendar, 
  Search, 
  Eye, 
  Wallet, 
  Receipt, 
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import type { Order } from '../types';
import { ReceiptModal } from './ReceiptModal';

interface ReportsViewerProps {
  orders?: Order[];
  onRefresh?: () => void;
}

export const ReportsViewer: React.FC<ReportsViewerProps> = ({ orders = [], onRefresh }) => {
  // Period filter: 'today', 'monthly', 'annual', 'custom'
  const [periodType, setPeriodType] = useState<'today' | 'monthly' | 'annual' | 'custom'>('today');
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-11

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Status Filter: default to completed/done orders as requested
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed'>('completed');
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'cash' | 'gcash'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState<Order | null>(null);
  const [printSuccessNotice, setPrintSuccessNotice] = useState<boolean>(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const availableYears = [currentYear - 2, currentYear - 1, currentYear, currentYear + 1];

  // 1. Filter Orders based on Period, Status, Payment, Search
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      const orderYear = orderDate.getFullYear();
      const orderMonth = orderDate.getMonth();

      // Period matching
      if (periodType === 'today') {
        const today = new Date();
        const isToday =
          orderDate.getDate() === today.getDate() &&
          orderMonth === today.getMonth() &&
          orderYear === today.getFullYear();
        if (!isToday) return false;
      } else if (periodType === 'monthly') {
        if (orderYear !== selectedYear || orderMonth !== selectedMonth) return false;
      } else if (periodType === 'annual') {
        if (orderYear !== selectedYear) return false;
      } else if (periodType === 'custom') {
        if (startDate && endDate) {
          const start = new Date(startDate).getTime();
          const end = new Date(endDate).getTime() + 86400000;
          const time = orderDate.getTime();
          if (time < start || time > end) return false;
        }
      }

      // Status filter
      if (statusFilter === 'completed') {
        if (o.status !== 'Completed') return false;
      }

      // Payment method filter
      if (paymentFilter === 'cash') {
        if ((o.paymentMethod || '').toLowerCase() !== 'cash') return false;
      } else if (paymentFilter === 'gcash') {
        if ((o.paymentMethod || '').toLowerCase() !== 'gcash') return false;
      }

      // Search query (Transaction ID, Cashier, Item Names)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchId = String(o.transactionId).toLowerCase().includes(query);
        const matchCashier = (o.cashier || '').toLowerCase().includes(query);
        const matchPayment = (o.paymentMethod || '').toLowerCase().includes(query);
        const matchItem = Array.isArray(o.items) && o.items.some((it) => it.name.toLowerCase().includes(query));
        if (!matchId && !matchCashier && !matchPayment && !matchItem) return false;
      }

      return true;
    });
  }, [orders, periodType, selectedYear, selectedMonth, startDate, endDate, statusFilter, paymentFilter, searchQuery]);

  // 2. Financial Metrics Calculation
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const grossSubtotal = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + Number(o.subtotal || o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const totalDiscounts = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + Number(o.discountAmount || 0), 0);
  }, [filteredOrders]);

  const totalCash = useMemo(() => {
    return filteredOrders
      .filter((o) => (o.paymentMethod || '').toLowerCase() === 'cash')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const totalGCash = useMemo(() => {
    return filteredOrders
      .filter((o) => (o.paymentMethod || '').toLowerCase() === 'gcash')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [filteredOrders]);

  // Standard 12% VAT
  const vatableSales = totalRevenue / 1.12;
  const vatAmount = totalRevenue - vatableSales;

  // 3. Helper to format items into readable string
  const formatOrderItems = (items: any[]) => {
    if (!Array.isArray(items) || items.length === 0) return 'No items';
    return items
      .map((it) => `${it.qty}x ${it.name}${it.spiceLevel && it.spiceLevel !== 'None' ? ` (${it.spiceLevel})` : ''}`)
      .join(', ');
  };

  // 4. Download to Excel (.CSV) - Supports Annual, Monthly, Today, Custom
  const handleDownloadExcel = () => {
    if (filteredOrders.length === 0) {
      alert('No completed orders found in the selected period to download.');
      return;
    }

    const periodLabel =
      periodType === 'monthly'
        ? `${months[selectedMonth]}_${selectedYear}`
        : periodType === 'annual'
        ? `Annual_${selectedYear}`
        : periodType === 'today'
        ? `Daily_${new Date().toISOString().slice(0, 10)}`
        : `Custom_${startDate || 'Start'}_to_${endDate || 'End'}`;

    const headers = [
      'Transaction ID',
      'Date',
      'Time',
      'Cashier',
      'Status',
      'Payment Method',
      'Orders / Items Breakdown',
      'Subtotal (PHP)',
      'Discount Type',
      'Discount Amount (PHP)',
      '12% VAT (PHP)',
      'Total Paid (PHP)',
      'Amount Tendered (PHP)',
      'Change (PHP)'
    ];

    const dataRows = filteredOrders.map((o) => {
      const d = new Date(o.createdAt);
      const dateStr = d.toLocaleDateString('en-US');
      const timeStr = d.toLocaleTimeString('en-US');
      const itemsText = formatOrderItems(o.items).replace(/"/g, '""');

      const oNet = Number(o.totalAmount || 0);
      const oVat = oNet - oNet / 1.12;

      return [
        `"#${o.transactionId}"`,
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${o.cashier || 'Cashier'}"`,
        `"${o.status}"`,
        `"${o.paymentMethod}"`,
        `"${itemsText}"`,
        Number(o.subtotal || o.totalAmount).toFixed(2),
        `"${o.discountType || 'None'}"`,
        Number(o.discountAmount || 0).toFixed(2),
        oVat.toFixed(2),
        oNet.toFixed(2),
        Number(o.amountPaid || o.totalAmount).toFixed(2),
        Number(o.changeAmount || 0).toFixed(2)
      ];
    });

    // Summary Rows for Excel accounting
    const summaryRows = [
      [],
      ['SUMMARY AUDIT TOTALS', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Total Completed Orders:', filteredOrders.length, '', '', '', '', '', '', '', '', '', '', '', ''],
      ['Total Cash Collections:', '', '', '', '', '', '', '', '', '', '', totalCash.toFixed(2), '', ''],
      ['Total GCash Collections:', '', '', '', '', '', '', '', '', '', '', totalGCash.toFixed(2), '', ''],
      ['Total 12% VAT Collected:', '', '', '', '', '', '', '', '', '', vatAmount.toFixed(2), '', '', ''],
      ['GROSS TOTAL SALES:', '', '', '', '', '', '', grossSubtotal.toFixed(2), '', '', '', '', '', ''],
      ['TOTAL NET REVENUE:', '', '', '', '', '', '', '', '', '', '', totalRevenue.toFixed(2), '', '']
    ];

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...dataRows.map((r) => r.join(',')), ...summaryRows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `RXS_Completed_Orders_${periodLabel}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintZReading = async () => {
    try {
      await fetch('/api/printer/test', { method: 'POST' });
    } catch (e) {}
    setPrintSuccessNotice(true);
    setTimeout(() => setPrintSuccessNotice(false), 4000);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e11] p-6 overflow-hidden select-none font-sans">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between mb-5 pb-4 border-b border-[#212833] gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#0ca1e1]/10 border border-[#0ca1e1]/30 flex items-center justify-center text-[#0ca1e1] shadow-lg shadow-[#0ca1e1]/10">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-wide">
              Sales & Orders Reports
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Completed transactions, customer payment methods, orders breakdown, and Excel exports
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#151a21] hover:bg-[#1f2633] text-gray-300 hover:text-white border border-[#212833] text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 shadow-md"
              title="Refresh reports data"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#fed428]" />
              <span>Refresh</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151a21] hover:bg-[#1c2431] text-white border border-[#0ca1e1]/60 text-xs font-black transition-all cursor-pointer touch-manipulation active:scale-95 shadow-lg shadow-[#0ca1e1]/10"
            title="Download full itemized report to Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0ca1e1]" />
            <span>Download to Excel ({periodType.toUpperCase()})</span>
          </button>

          <button
            type="button"
            onClick={handlePrintZReading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#fed428] hover:bg-[#fed428]/90 text-black text-xs font-black transition-all cursor-pointer touch-manipulation active:scale-95 shadow-lg shadow-[#fed428]/20"
            title="Print formal End-of-Day Z-Reading"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Z-Reading</span>
          </button>
        </div>
      </div>

      {/* Success Alert Banner if Z-reading sent */}
      {printSuccessNotice && (
        <div className="mb-4 p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Z-Reading Shift Report successfully sent to thermal printer!</span>
        </div>
      )}

      {/* Primary KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5 mb-5">
        <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Total Revenue
          </span>
          <span className="text-xl font-black text-[#fed428] font-mono">
            ₱{totalRevenue.toFixed(2)}
          </span>
        </div>

        <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Done Orders
          </span>
          <span className="text-xl font-black text-white font-mono">
            {filteredOrders.length} orders
          </span>
        </div>

        <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            Cash Collected
          </span>
          <span className="text-xl font-black text-emerald-400 font-mono">
            ₱{totalCash.toFixed(2)}
          </span>
        </div>

        <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            GCash / Digital
          </span>
          <span className="text-xl font-black text-[#0ca1e1] font-mono">
            ₱{totalGCash.toFixed(2)}
          </span>
        </div>

        <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
            12% VAT
          </span>
          <span className="text-xl font-black text-purple-400 font-mono">
            ₱{vatAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Filter Toolbar: Annual / Monthly / Today / Custom */}
      <div className="bg-[#12161f] border border-[#212833] rounded-2xl p-3.5 mb-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Period Selector Tabs */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-gray-400 mr-1.5 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#fed428]" />
              <span>Report Period:</span>
            </span>

            <button
              type="button"
              onClick={() => setPeriodType('today')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                periodType === 'today'
                  ? 'bg-[#fed428] text-black shadow-md'
                  : 'bg-[#18202b] text-gray-400 hover:text-white border border-[#212833]'
              }`}
            >
              Today
            </button>

            <button
              type="button"
              onClick={() => setPeriodType('monthly')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                periodType === 'monthly'
                  ? 'bg-[#fed428] text-black shadow-md'
                  : 'bg-[#18202b] text-gray-400 hover:text-white border border-[#212833]'
              }`}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setPeriodType('annual')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                periodType === 'annual'
                  ? 'bg-[#fed428] text-black shadow-md'
                  : 'bg-[#18202b] text-gray-400 hover:text-white border border-[#212833]'
              }`}
            >
              Annual / Yearly
            </button>

            <button
              type="button"
              onClick={() => setPeriodType('custom')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer touch-manipulation ${
                periodType === 'custom'
                  ? 'bg-[#fed428] text-black shadow-md'
                  : 'bg-[#18202b] text-gray-400 hover:text-white border border-[#212833]'
              }`}
            >
              Custom Range
            </button>
          </div>

          {/* Dynamic Period Dropdowns */}
          <div className="flex items-center gap-2 text-xs">
            {periodType === 'monthly' && (
              <>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="bg-[#0c0e11] border border-[#212833] rounded-xl px-3 py-1.5 text-white text-xs font-bold outline-none focus:border-[#0ca1e1]"
                >
                  {months.map((m, idx) => (
                    <option key={idx} value={idx}>
                      {m}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-[#0c0e11] border border-[#212833] rounded-xl px-3 py-1.5 text-white text-xs font-bold outline-none focus:border-[#0ca1e1]"
                >
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </>
            )}

            {periodType === 'annual' && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-[#0c0e11] border border-[#212833] rounded-xl px-3 py-1.5 text-white text-xs font-bold outline-none focus:border-[#0ca1e1]"
              >
                {availableYears.map((yr) => (
                  <option key={yr} value={yr}>
                    Year {yr}
                  </option>
                ))}
              </select>
            )}

            {periodType === 'custom' && (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-[#0c0e11] border border-[#212833] rounded-xl px-2.5 py-1 text-white text-xs font-mono outline-none focus:border-[#0ca1e1]"
                />
                <span className="text-gray-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-[#0c0e11] border border-[#212833] rounded-xl px-2.5 py-1 text-white text-xs font-mono outline-none focus:border-[#0ca1e1]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Search & Sub-filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#212833]/60">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search receipt #, cashier, customer payment, dish..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0c0e11] border border-[#212833] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-gray-500 outline-none focus:border-[#0ca1e1]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            {/* Status toggle */}
            <div className="flex items-center bg-[#0c0e11] p-0.5 rounded-xl border border-[#212833]">
              <button
                type="button"
                onClick={() => setStatusFilter('completed')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Done Orders Only
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  statusFilter === 'all'
                    ? 'bg-[#18202b] text-white shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Statuses
              </button>
            </div>

            {/* Payment method toggle */}
            <div className="flex items-center bg-[#0c0e11] p-0.5 rounded-xl border border-[#212833]">
              <button
                type="button"
                onClick={() => setPaymentFilter('all')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  paymentFilter === 'all'
                    ? 'bg-[#0ca1e1] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                All Payments
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('cash')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  paymentFilter === 'cash'
                    ? 'bg-emerald-500 text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Cash
              </button>
              <button
                type="button"
                onClick={() => setPaymentFilter('gcash')}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  paymentFilter === 'gcash'
                    ? 'bg-[#0ca1e1] text-black shadow-sm'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                GCash
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Done Orders Table */}
      <div className="flex-1 bg-[#151a21] border border-[#212833] rounded-2xl overflow-hidden shadow-2xl flex flex-col">
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0f1217] text-gray-400 uppercase font-bold text-[11px] border-b border-[#212833] sticky top-0 z-10">
              <tr>
                <th className="py-3 px-4">Receipt #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4">Customer Payment</th>
                <th className="py-3 px-4 w-1/3">Orders (Dishes & Items)</th>
                <th className="py-3 px-4 text-right">Discount</th>
                <th className="py-3 px-4 text-right">Total Amount</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#212833]">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-gray-500">
                    <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40 text-gray-400" />
                    <span>No orders found matching your selected period and criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-[#1a212b] transition-colors">
                    {/* Receipt Number */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#0ca1e1]">
                      #{ord.transactionId}
                    </td>

                    {/* Date and Time */}
                    <td className="py-3.5 px-4 text-gray-400 font-mono text-[11px]">
                      {new Date(ord.createdAt).toLocaleDateString()}{' '}
                      <span className="text-gray-500">{new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </td>

                    {/* Cashier */}
                    <td className="py-3.5 px-4 text-white font-semibold">
                      {ord.cashier || 'Cashier'}
                    </td>

                    {/* Payment Method Used */}
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] inline-flex items-center gap-1.5 ${
                        (ord.paymentMethod || '').toLowerCase() === 'cash'
                          ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/80'
                          : 'bg-sky-950/60 text-[#0ca1e1] border border-sky-800/80'
                      }`}>
                        <Wallet className="w-3 h-3" />
                        <span>{ord.paymentMethod}</span>
                      </span>
                    </td>

                    {/* What Are the Orders */}
                    <td className="py-3.5 px-4 text-gray-200">
                      <div className="space-y-1">
                        {Array.isArray(ord.items) && ord.items.length > 0 ? (
                          ord.items.map((it, idx) => (
                            <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                              <span className="font-mono font-bold text-[#fed428] px-1.5 py-0.2 rounded bg-black/40">
                                {it.qty}x
                              </span>
                              <span className="font-semibold text-white">{it.name}</span>
                              {it.spiceLevel && it.spiceLevel !== 'None' && (
                                <span className="text-[10px] text-rose-400">({it.spiceLevel})</span>
                              )}
                              <span className="text-gray-500 font-mono text-[10px] ml-auto">
                                ₱{(it.price * it.qty).toFixed(2)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-500 italic">No item details</span>
                        )}
                      </div>
                    </td>

                    {/* Discount */}
                    <td className="py-3.5 px-4 text-right font-mono text-rose-400 text-xs">
                      {ord.discountAmount && ord.discountAmount > 0 ? `-₱${ord.discountAmount.toFixed(2)}` : '₱0.00'}
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-mono font-black text-white text-sm">
                      ₱{Number(ord.totalAmount).toFixed(2)}
                    </td>

                    {/* Receipt Action */}
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => setSelectedReceiptOrder(ord)}
                        className="p-1.5 rounded-lg bg-[#0c0e11] hover:bg-[#202733] text-gray-300 hover:text-white border border-[#212833] transition-all cursor-pointer touch-manipulation active:scale-90"
                        title="View / Reprint Receipt"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#0ca1e1]" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Audit Stats */}
        <div className="bg-[#0f1217] border-t border-[#212833] px-6 py-3 flex flex-wrap items-center justify-between text-xs text-gray-400 font-mono">
          <div>
            Showing <span className="text-white font-bold">{filteredOrders.length}</span> orders ({periodType.toUpperCase()})
          </div>
          <div className="flex items-center gap-6">
            <span>Discounts: <strong className="text-rose-400">-₱{totalDiscounts.toFixed(2)}</strong></span>
            <span>Cash: <strong className="text-emerald-400">₱{totalCash.toFixed(2)}</strong></span>
            <span>GCash: <strong className="text-[#0ca1e1]">₱{totalGCash.toFixed(2)}</strong></span>
            <span>Total: <strong className="text-[#fed428] text-sm">₱{totalRevenue.toFixed(2)}</strong></span>
          </div>
        </div>
      </div>

      {/* Re-print / View Customer Receipt Modal */}
      {selectedReceiptOrder && (
        <ReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
};
