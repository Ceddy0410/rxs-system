import React, { useState, useMemo } from 'react';
import { 
  X, 
  Banknote, 
  Calculator, 
  CheckCircle2, 
  AlertTriangle, 
  Printer, 
  Coins, 
  RotateCcw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Users
} from 'lucide-react';
import type { Order, User } from '../types';

interface CashDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  orders: Order[];
}

export const CashDrawerModal: React.FC<CashDrawerModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  orders
}) => {
  // 1. Starting Cash Float (customizable per shift)
  const [startingFloat, setStartingFloat] = useState<number>(() => {
    const saved = localStorage.getItem('rxs_cash_float');
    return saved ? parseFloat(saved) || 1000 : 1000;
  });

  // 2. Filter Shift by Cashier (All vs Specific Staff)
  const [cashierFilter, setCashierFilter] = useState<string>('all');

  // 3. Denomination breakdown
  const [denominations, setDenominations] = useState<{ [key: string]: number }>({
    d1000: 0,
    d500: 0,
    d200: 0,
    d100: 0,
    d50: 0,
    d20: 0,
    coins: 0
  });

  // Mode: 'breakdown' (count bills one by one) or 'quick' (type total directly)
  const [countMode, setCountMode] = useState<'quick' | 'breakdown'>('breakdown');
  const [directCashCount, setDirectCashCount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [printSuccess, setPrintSuccess] = useState<boolean>(false);

  // Safe Date parsing
  const parseOrderDate = (createdAt?: string | null): Date => {
    if (!createdAt) return new Date();
    if (typeof createdAt === 'string' && createdAt.includes(' ') && !createdAt.includes('T')) {
      return new Date(createdAt.replace(' ', 'T'));
    }
    return new Date(createdAt);
  };

  // 1. Filter Today's Paid Orders (Include all orders where payment was received, exclude cancelled)
  const todayOrders = useMemo(() => {
    const today = new Date();
    return orders.filter((o) => {
      if (o.status === 'Cancelled') return false;
      const orderDate = parseOrderDate(o.createdAt);
      return (
        orderDate.getDate() === today.getDate() &&
        orderDate.getMonth() === today.getMonth() &&
        orderDate.getFullYear() === today.getFullYear()
      );
    });
  }, [orders]);

  // List of distinct Cashiers who worked today
  const activeCashiersList = useMemo(() => {
    const set = new Set<string>();
    todayOrders.forEach((o) => {
      if (o.cashier) set.add(o.cashier);
    });
    return Array.from(set);
  }, [todayOrders]);

  // Orders filtered by selected Cashier
  const shiftOrders = useMemo(() => {
    if (cashierFilter === 'all') return todayOrders;
    return todayOrders.filter((o) => o.cashier === cashierFilter);
  }, [todayOrders, cashierFilter]);

  // Total Cash Sales collected in shift
  const totalCashSales = useMemo(() => {
    return shiftOrders
      .filter((o) => (o.paymentMethod || '').toLowerCase() === 'cash')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [shiftOrders]);

  // Total GCash / E-Wallet Sales in shift (tracked separately, doesn't sit in physical drawer)
  const totalGCashSales = useMemo(() => {
    return shiftOrders
      .filter((o) => (o.paymentMethod || '').toLowerCase() === 'gcash')
      .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [shiftOrders]);

  // Expected physical cash that should be in the drawer
  const expectedCashInDrawer = startingFloat + totalCashSales;

  // Actual physical cash counted by the cashier
  const actualCashCounted = useMemo(() => {
    if (countMode === 'quick') {
      return parseFloat(directCashCount) || 0;
    }
    return (
      (denominations.d1000 * 1000) +
      (denominations.d500 * 500) +
      (denominations.d200 * 200) +
      (denominations.d100 * 100) +
      (denominations.d50 * 50) +
      (denominations.d20 * 20) +
      (denominations.coins || 0)
    );
  }, [countMode, directCashCount, denominations]);

  // Check if cashier has started entering their count
  const hasEnteredCount = useMemo(() => {
    if (countMode === 'quick') {
      return directCashCount.trim() !== '' && !isNaN(parseFloat(directCashCount));
    }
    return Object.values(denominations).some((qty) => qty > 0);
  }, [countMode, directCashCount, denominations]);

  // Discrepancy (Over / Short)
  const discrepancy = hasEnteredCount ? actualCashCounted - expectedCashInDrawer : 0;
  const isBalanced = hasEnteredCount && Math.abs(discrepancy) < 0.01;
  const isOver = hasEnteredCount && discrepancy > 0.01;

  if (!isOpen) return null;

  const handleUpdateDenomination = (key: string, val: string) => {
    const num = Math.max(0, parseInt(val, 10) || 0);
    setDenominations((prev) => ({ ...prev, [key]: num }));
  };

  const handleSaveFloat = (val: number) => {
    const valid = Math.max(0, val);
    setStartingFloat(valid);
    localStorage.setItem('rxs_cash_float', String(valid));
  };

  const handleResetCounter = () => {
    setDenominations({
      d1000: 0,
      d500: 0,
      d200: 0,
      d100: 0,
      d50: 0,
      d20: 0,
      coins: 0
    });
    setDirectCashCount('');
  };

  // Helper for 1-Click Verification / Test: Auto-fill breakdown to perfectly match expected
  const handleAutoFillExpected = () => {
    let remainder = Math.round(expectedCashInDrawer);
    const d1000 = Math.floor(remainder / 1000);
    remainder %= 1000;
    const d500 = Math.floor(remainder / 500);
    remainder %= 500;
    const d200 = Math.floor(remainder / 200);
    remainder %= 200;
    const d100 = Math.floor(remainder / 100);
    remainder %= 100;
    const d50 = Math.floor(remainder / 50);
    remainder %= 50;
    const d20 = Math.floor(remainder / 20);
    remainder %= 20;
    const coins = remainder + (expectedCashInDrawer - Math.floor(expectedCashInDrawer));

    setDenominations({
      d1000,
      d500,
      d200,
      d100,
      d50,
      d20,
      coins: Number(coins.toFixed(2))
    });
    setDirectCashCount(expectedCashInDrawer.toFixed(2));
  };

  const handlePrintShiftReconciliation = () => {
    const printWindow = window.open('', '', 'width=400,height=600');
    if (!printWindow) return;

    const reportHtml = `
      <html>
        <head>
          <title>Shift Cash Reconciliation - RXS POS</title>
          <style>
            body { font-family: monospace; font-size: 12px; padding: 10px; line-height: 1.4; color: #000; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 8px 0; }
            .row { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="center bold">RXS RAMEN RESTAURANT</div>
          <div class="center">CASH DRAWER RECONCILIATION AUDIT (X-READING)</div>
          <div class="center">${new Date().toLocaleString()}</div>
          <div class="divider"></div>
          <div class="row"><span>Audited Staff:</span><span class="bold">${currentUser.name}</span></div>
          <div class="row"><span>Shift Scope:</span><span class="bold">${cashierFilter === 'all' ? 'All Cashiers (Store Total)' : cashierFilter}</span></div>
          <div class="row"><span>Total Orders:</span><span>${shiftOrders.length}</span></div>
          <div class="divider"></div>
          <div class="row"><span>Starting Cash Float:</span><span>PHP ${startingFloat.toFixed(2)}</span></div>
          <div class="row"><span>Cash Sales (Total):</span><span>PHP ${totalCashSales.toFixed(2)}</span></div>
          <div class="row bold"><span>EXPECTED IN DRAWER:</span><span>PHP ${expectedCashInDrawer.toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="center bold">PHYSICAL CASH COUNTED:</div>
          <div class="row"><span>1000 Bills (${denominations.d1000}x):</span><span>PHP ${(denominations.d1000 * 1000).toFixed(2)}</span></div>
          <div class="row"><span>500 Bills (${denominations.d500}x):</span><span>PHP ${(denominations.d500 * 500).toFixed(2)}</span></div>
          <div class="row"><span>200 Bills (${denominations.d200}x):</span><span>PHP ${(denominations.d200 * 200).toFixed(2)}</span></div>
          <div class="row"><span>100 Bills (${denominations.d100}x):</span><span>PHP ${(denominations.d100 * 100).toFixed(2)}</span></div>
          <div class="row"><span>50 Bills (${denominations.d50}x):</span><span>PHP ${(denominations.d50 * 50).toFixed(2)}</span></div>
          <div class="row"><span>20 Bills (${denominations.d20}x):</span><span>PHP ${(denominations.d20 * 20).toFixed(2)}</span></div>
          <div class="row"><span>Coins Total:</span><span>PHP ${(denominations.coins || 0).toFixed(2)}</span></div>
          <div class="divider"></div>
          <div class="row bold"><span>ACTUAL COUNTED TOTAL:</span><span>PHP ${actualCashCounted.toFixed(2)}</span></div>
          <div class="row bold">
            <span>VARIANCE / DISCREPANCY:</span>
            <span>${discrepancy >= 0 ? '+' : ''}PHP ${discrepancy.toFixed(2)} (${isBalanced ? 'BALANCED' : isOver ? 'OVERAGE' : 'SHORTAGE'})</span>
          </div>
          <div class="divider"></div>
          <div class="row"><span>Separate GCash Total:</span><span>PHP ${totalGCashSales.toFixed(2)}</span></div>
          ${notes ? `<div class="divider"></div><div>Audit Notes: ${notes}</div>` : ''}
          <div class="divider"></div>
          <div class="center" style="margin-top: 20px;">Cashier Signature: __________________</div>
          <div class="center" style="margin-top: 15px;">Manager Signature: __________________</div>
        </body>
      </html>
    `;

    printWindow.document.write(reportHtml);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);

    setPrintSuccess(true);
    setTimeout(() => setPrintSuccess(false), 3000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 select-none animate-in fade-in duration-150 font-sans">
      <div className="bg-[#12161f] border border-[#212833] rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#212833] flex items-center justify-between bg-[#0f1217]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide flex items-center gap-2">
                Cash Drawer Balancing & Shift Audit (X-Reading)
              </h3>
              <p className="text-xs text-gray-400">
                Logged in: <span className="text-[#fed428] font-bold">{currentUser.name}</span> • Match physical cash in hand with system sales
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#18202b] hover:bg-[#202733] text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {printSuccess && (
            <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Shift Reconciliation Slip sent to printer!</span>
            </div>
          )}

          {/* Shift / Cashier Filter Bar */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#fed428]" />
              <span className="text-xs font-bold text-gray-300">Auditing Register Scope:</span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={cashierFilter}
                onChange={(e) => setCashierFilter(e.target.value)}
                className="bg-[#0c0e11] border border-[#2b3543] rounded-xl px-3 py-1.5 text-xs font-bold text-[#fed428] focus:outline-none focus:border-[#fed428] cursor-pointer"
              >
                <option value="all">All Cashiers Combined (Store Total)</option>
                {activeCashiersList.map((cashier) => (
                  <option key={cashier} value={cashier}>
                    Only Shift: {cashier}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={handleAutoFillExpected}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1f2837] hover:bg-[#273347] border border-[#37455c] text-amber-300 text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                title="Quick Test: Auto-fills bills to match system total perfectly so you can verify calculation"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#fed428]" />
                <span>Test Match Total</span>
              </button>
            </div>
          </div>

          {/* Top 3 Metric Cards: Float, Sales, Expected */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 1. Starting Float */}
            <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  1. Starting Cash Float
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-white font-mono">₱</span>
                  <input
                    type="number"
                    step="any"
                    value={startingFloat}
                    onChange={(e) => handleSaveFloat(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#0c0e11] border border-[#2b3543] rounded-xl px-2.5 py-1 text-lg font-black text-[#fed428] font-mono focus:outline-none focus:border-[#fed428]"
                    title="Change beginning cash float"
                  />
                </div>
              </div>
              <span className="text-[10px] text-gray-500 mt-2 block">
                Petty cash provided at shift opening
              </span>
            </div>

            {/* 2. Total Cash Sales in Shift */}
            <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                  2. Cash Sales (System Total)
                </span>
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  ₱{totalCashSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-gray-400 mt-2">
                <Smartphone className="w-3 h-3 text-[#0ca1e1]" />
                <span>GCash / E-Wallet (Separate): ₱{totalGCashSales.toFixed(2)}</span>
              </div>
            </div>

            {/* 3. Expected Total In Drawer */}
            <div className="bg-[#18202b] border border-[#2d3748] rounded-2xl p-4 flex flex-col justify-between shadow-lg">
              <div>
                <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                  3. Expected In Drawer
                </span>
                <span className="text-2xl font-black text-[#fed428] font-mono">
                  ₱{expectedCashInDrawer.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <span className="text-[10px] text-gray-300 mt-2 block font-medium">
                Starting Float (₱{startingFloat}) + Cash Sales (₱{totalCashSales.toFixed(2)})
              </span>
            </div>
          </div>

          {/* Middle: Cash Counting Area */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#212833]">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#fed428]" />
                <span className="text-sm font-black text-white uppercase tracking-wider">
                  Cashier Actual Drawer Count
                </span>
              </div>

              {/* Mode switch: Breakdown vs Direct */}
              <div className="flex items-center gap-1 bg-[#0c0e11] p-1 rounded-xl border border-[#212833]">
                <button
                  type="button"
                  onClick={() => setCountMode('breakdown')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    countMode === 'breakdown'
                      ? 'bg-[#fed428] text-black shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Coins className="w-3 h-3 inline mr-1" />
                  Bill Counter
                </button>
                <button
                  type="button"
                  onClick={() => setCountMode('quick')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    countMode === 'quick'
                      ? 'bg-[#fed428] text-black shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Direct Total
                </button>
              </div>
            </div>

            {countMode === 'breakdown' ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {/* 1000 */}
                <div className="bg-[#0c0e11] border border-[#212833] rounded-xl p-2.5 text-center">
                  <span className="text-[11px] font-bold text-gray-400 block mb-1">₱1,000 Bill</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={denominations.d1000 || ''}
                    onChange={(e) => handleUpdateDenomination('d1000', e.target.value)}
                    className="w-full bg-[#151a21] border border-[#2b3543] rounded-lg text-center py-1 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#fed428]"
                  />
                  <span className="text-[10px] text-gray-500 font-mono block mt-1">
                    = ₱{(denominations.d1000 * 1000).toLocaleString()}
                  </span>
                </div>

                {/* 500 */}
                <div className="bg-[#0c0e11] border border-[#212833] rounded-xl p-2.5 text-center">
                  <span className="text-[11px] font-bold text-gray-400 block mb-1">₱500 Bill</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={denominations.d500 || ''}
                    onChange={(e) => handleUpdateDenomination('d500', e.target.value)}
                    className="w-full bg-[#151a21] border border-[#2b3543] rounded-lg text-center py-1 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#fed428]"
                  />
                  <span className="text-[10px] text-gray-500 font-mono block mt-1">
                    = ₱{(denominations.d500 * 500).toLocaleString()}
                  </span>
                </div>

                {/* 200 */}
                <div className="bg-[#0c0e11] border border-[#212833] rounded-xl p-2.5 text-center">
                  <span className="text-[11px] font-bold text-gray-400 block mb-1">₱200 Bill</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={denominations.d200 || ''}
                    onChange={(e) => handleUpdateDenomination('d200', e.target.value)}
                    className="w-full bg-[#151a21] border border-[#2b3543] rounded-lg text-center py-1 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#fed428]"
                  />
                  <span className="text-[10px] text-gray-500 font-mono block mt-1">
                    = ₱{(denominations.d200 * 200).toLocaleString()}
                  </span>
                </div>

                {/* 100 */}
                <div className="bg-[#0c0e11] border border-[#212833] rounded-xl p-2.5 text-center">
                  <span className="text-[11px] font-bold text-gray-400 block mb-1">₱100 Bill</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={denominations.d100 || ''}
                    onChange={(e) => handleUpdateDenomination('d100', e.target.value)}
                    className="w-full bg-[#151a21] border border-[#2b3543] rounded-lg text-center py-1 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#fed428]"
                  />
                  <span className="text-[10px] text-gray-500 font-mono block mt-1">
                    = ₱{(denominations.d100 * 100).toLocaleString()}
                  </span>
                </div>

                {/* 50 */}
                <div className="bg-[#0c0e11] border border-[#212833] rounded-xl p-2.5 text-center">
                  <span className="text-[11px] font-bold text-gray-400 block mb-1">₱50 Bill</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={denominations.d50 || ''}
                    onChange={(e) => handleUpdateDenomination('d50', e.target.value)}
                    className="w-full bg-[#151a21] border border-[#2b3543] rounded-lg text-center py-1 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#fed428]"
                  />
                  <span className="text-[10px] text-gray-500 font-mono block mt-1">
                    = ₱{(denominations.d50 * 50).toLocaleString()}
                  </span>
                </div>

                {/* 20 */}
                <div className="bg-[#0c0e11] border border-[#212833] rounded-xl p-2.5 text-center">
                  <span className="text-[11px] font-bold text-gray-400 block mb-1">₱20 Bill</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={denominations.d20 || ''}
                    onChange={(e) => handleUpdateDenomination('d20', e.target.value)}
                    className="w-full bg-[#151a21] border border-[#2b3543] rounded-lg text-center py-1 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#fed428]"
                  />
                  <span className="text-[10px] text-gray-500 font-mono block mt-1">
                    = ₱{(denominations.d20 * 20).toLocaleString()}
                  </span>
                </div>

                {/* Coins Total */}
                <div className="bg-[#0c0e11] border border-[#212833] rounded-xl p-2.5 text-center">
                  <span className="text-[11px] font-bold text-gray-400 block mb-1">Total Coins (₱)</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={denominations.coins || ''}
                    onChange={(e) => handleUpdateDenomination('coins', e.target.value)}
                    className="w-full bg-[#151a21] border border-[#2b3543] rounded-lg text-center py-1 font-mono font-bold text-white text-sm focus:outline-none focus:border-[#fed428]"
                  />
                  <span className="text-[10px] text-gray-500 font-mono block mt-1">
                    Coins total
                  </span>
                </div>
              </div>
            ) : (
              <div className="max-w-md mx-auto py-2">
                <label className="text-xs font-bold text-gray-300 block mb-2 text-center">
                  Enter Total Physical Cash Counted (Bills + Coins)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-gray-500 font-mono">
                    ₱
                  </span>
                  <input
                    type="number"
                    step="any"
                    placeholder="0.00"
                    value={directCashCount}
                    onChange={(e) => setDirectCashCount(e.target.value)}
                    className="w-full bg-[#0c0e11] border border-[#2b3543] rounded-2xl pl-10 pr-4 py-3 text-2xl font-black text-white font-mono text-center focus:outline-none focus:border-[#fed428]"
                  />
                </div>
              </div>
            )}

            {/* Reconciliation Discrepancy Banner */}
            {!hasEnteredCount ? (
              // Uncounted State (Neutral Guidance - does not trigger false shortage alarm)
              <div className="p-4 rounded-2xl border border-[#2b3543] bg-[#121721] text-gray-300 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">
                      Awaiting Cashier Drawer Count
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      Enter physical bill and coin quantities above to compute shift variance against ₱{expectedCashInDrawer.toFixed(2)} expected.
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                    Variance Status
                  </span>
                  <span className="text-sm font-bold font-mono text-gray-400">
                    Pending Count
                  </span>
                </div>
              </div>
            ) : (
              // Counted State: Balanced, Overage, or Shortage
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
                isBalanced
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : isOver
                  ? 'bg-blue-950/40 border-blue-800 text-blue-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}>
                <div className="flex items-center gap-3">
                  {isBalanced ? (
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                  ) : isOver ? (
                    <ShieldCheck className="w-8 h-8 text-blue-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-8 h-8 text-rose-400 shrink-0" />
                  )}
                  <div>
                    <div className="font-black text-sm uppercase tracking-wide">
                      {isBalanced
                        ? '✅ Cash Drawer is Perfectly Balanced'
                        : isOver
                        ? `💡 Overage Detected (+₱${discrepancy.toFixed(2)} Excess Cash)`
                        : `⚠️ Shortage Detected (-₱${Math.abs(discrepancy).toFixed(2)} Missing)`}
                    </div>
                    <div className="text-xs opacity-90 mt-0.5">
                      Actual Counted: <span className="font-mono font-bold text-white">₱{actualCashCounted.toFixed(2)}</span> vs Expected: <span className="font-mono font-bold text-white">₱{expectedCashInDrawer.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                    Difference / Variance
                  </span>
                  <span className={`text-xl font-black font-mono ${
                    isBalanced ? 'text-emerald-400' : isOver ? 'text-blue-400' : 'text-rose-400'
                  }`}>
                    {discrepancy >= 0 ? `+₱${discrepancy.toFixed(2)}` : `-₱${Math.abs(discrepancy).toFixed(2)}`}
                  </span>
                </div>
              </div>
            )}

            {/* Shift Audit Notes */}
            <div>
              <label className="text-[11px] font-bold text-gray-400 block mb-1">
                Shift Audit Notes (Reason for discrepancy or petty cash adjustments):
              </label>
              <input
                type="text"
                placeholder="e.g. Added ₱500 extra change float at 2pm, or refunded #102..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-[#0c0e11] border border-[#212833] rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#0ca1e1]"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-[#212833] flex flex-wrap items-center justify-between gap-3 bg-[#0f1217]">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetCounter}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#18202b] hover:bg-[#202733] text-gray-400 hover:text-white border border-[#212833] text-xs font-bold transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Count</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handlePrintShiftReconciliation}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#18202b] hover:bg-[#222d3d] border border-[#0ca1e1]/60 text-white font-bold text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#0ca1e1]" />
              <span>Print X-Reading Audit Slip</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-[#fed428] hover:bg-[#fed428]/90 text-black font-black text-xs transition-all shadow-lg shadow-[#fed428]/20 active:scale-95 cursor-pointer"
            >
              Done / Close Audit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
