import React, { useMemo } from 'react';
import { 
  LayoutDashboard, 
  TrendingUp, 
  Receipt, 
  ShoppingBag, 
  Clock, 
  AlertTriangle,
  Flame,
  RefreshCw
} from 'lucide-react';
import type { Order, MenuItem, RawProduct } from '../types';

interface DashboardViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  rawProducts: RawProduct[];
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  menuItems,
  rawProducts,
  onRefresh
}) => {
  // Live KPI Calculations
  const totalSales = useMemo(() => {
    return orders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [orders]);

  const totalTransactions = orders.length;
  const avgTicket = totalTransactions > 0 ? totalSales / totalTransactions : 0;

  const pendingCount = orders.filter((o) => o.status === 'Pending').length;
  const preparingCount = orders.filter((o) => o.status === 'Preparing').length;
  const readyCount = orders.filter((o) => o.status === 'Ready').length;
  const completedCount = orders.filter((o) => o.status === 'Completed').length;

  const lowStockMenu = menuItems.filter((i) => i.stock <= 5);
  const lowStockRaw = rawProducts.filter((p) => p.quantity <= p.minStock);

  // Top 5 Best Sellers
  const topItems = useMemo(() => {
    const itemMap: { [name: string]: { name: string; count: number; revenue: number } } = {};
    orders.forEach((o) => {
      if (Array.isArray(o.items)) {
        o.items.forEach((it) => {
          if (!itemMap[it.name]) {
            itemMap[it.name] = { name: it.name, count: 0, revenue: 0 };
          }
          itemMap[it.name].count += it.qty;
          itemMap[it.name].revenue += it.qty * it.price;
        });
      }
    });
    return Object.values(itemMap).sort((a, b) => b.count - a.count).slice(0, 5);
  }, [orders]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e11] p-6 overflow-hidden select-none font-sans">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#212833]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#fed428]/10 border border-[#fed428]/30 flex items-center justify-center text-[#fed428] shadow-lg shadow-[#fed428]/10">
            <LayoutDashboard className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white tracking-wide">
                Live Restaurant Dashboard
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                LIVE OPERATIONS
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Real-time operational counters, kitchen pipeline, and sales stream
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151a21] hover:bg-[#1f2633] text-gray-300 hover:text-white border border-[#212833] text-xs font-semibold transition-all cursor-pointer touch-manipulation active:scale-95 shadow-md"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#fed428]" />
          <span>Sync Now</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Revenue */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-5 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
              <span>TODAY'S REVENUE</span>
              <TrendingUp className="w-4 h-4 text-[#fed428]" />
            </div>
            <div className="text-3xl font-black text-[#fed428] font-mono tracking-tight">
              ₱{totalSales.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
              ● Live Real-Time Ticker
            </span>
          </div>

          {/* Transactions */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
              <span>ORDERS SERVED</span>
              <Receipt className="w-4 h-4 text-[#0ca1e1]" />
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              {totalTransactions}
            </div>
            <span className="text-[11px] text-gray-400 mt-1.5 block">
              Active shift orders
            </span>
          </div>

          {/* Average Ticket */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
              <span>AVG. ORDER VALUE</span>
              <ShoppingBag className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-white font-mono tracking-tight">
              ₱{avgTicket.toFixed(2)}
            </div>
            <span className="text-[11px] text-gray-400 mt-1.5 block">
              Average spend per customer
            </span>
          </div>

          {/* Active Kitchen Orders */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-2">
              <span>KITCHEN QUEUE</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400 font-mono tracking-tight">
              {pendingCount + preparingCount} <span className="text-xs text-gray-400 font-normal">active</span>
            </div>
            <span className="text-[11px] text-amber-300/90 mt-1.5 block">
              {pendingCount} pending • {preparingCount} cooking
            </span>
          </div>
        </div>

        {/* Low Stock Warning Banner if any */}
        {(lowStockMenu.length > 0 || lowStockRaw.length > 0) && (
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/60 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-300">Inventory Alert</h4>
                <p className="text-xs text-amber-400/80">
                  {lowStockMenu.length} menu dishes and {lowStockRaw.length} raw ingredients are running low on stock.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Live Kitchen Throughput Strip */}
        <div className="bg-[#12161f] border border-[#212833] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-md">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>KITCHEN ORDER STATUS:</span>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 text-xs font-bold font-mono">
              Pending: {pendingCount}
            </span>
            <span className="px-3 py-1 rounded-xl bg-sky-950/40 border border-sky-800/50 text-sky-300 text-xs font-bold font-mono">
              Preparing: {preparingCount}
            </span>
            <span className="px-3 py-1 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 text-xs font-bold font-mono">
              Ready: {readyCount}
            </span>
            <span className="px-3 py-1 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 text-xs font-bold font-mono">
              Served: {completedCount}
            </span>
          </div>
        </div>

        {/* Split Grid: Best Sellers & Live Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Sellers */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-5 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#fed428]" />
                <span>Top Best Seller Dishes</span>
              </span>
              <span className="text-[11px] text-gray-400 font-normal">Ranked by volume</span>
            </h3>

            {topItems.length === 0 ? (
              <p className="text-xs text-gray-500 py-10 text-center">No orders recorded in current shift.</p>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c0e11] border border-[#212833] hover:border-[#2b3647] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#18202b] text-[#fed428] font-black text-xs flex items-center justify-center font-mono border border-[#212833]">
                        #{idx + 1}
                      </span>
                      <span className="font-bold text-sm text-white">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#fed428] block font-mono">
                        ₱{item.revenue.toFixed(2)}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium">
                        {item.count} orders
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Recent Transactions Feed */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Recent Transactions Stream</span>
              </h3>
              <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                Live Stream
              </span>
            </div>

            {orders.length === 0 ? (
              <p className="text-xs text-gray-500 py-10 text-center">No orders placed yet.</p>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-96 pr-1">
                {orders.slice(0, 10).map((ord) => {
                  return (
                    <div
                      key={ord.id}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-[#0c0e11] border border-[#212833] text-xs hover:border-[#2f3b4e] transition-all"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[#0ca1e1] text-sm">
                            #{ord.transactionId}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ord.status === 'Pending'
                                ? 'bg-amber-950/60 text-amber-300 border border-amber-800/60'
                                : ord.status === 'Preparing'
                                ? 'bg-sky-950/60 text-sky-300 border border-sky-800/60'
                                : ord.status === 'Ready'
                                ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/60'
                                : 'bg-gray-800 text-gray-400'
                            }`}
                          >
                            {ord.status}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-400 mt-0.5 block">
                          {new Date(ord.createdAt).toLocaleTimeString()} • Cashier: {ord.cashier || 'Terminal'} • {ord.paymentMethod}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="font-black text-white font-mono text-sm block">
                          ₱{Number(ord.totalAmount).toFixed(2)}
                        </span>
                        <span className="text-[10px] text-gray-500 font-mono">
                          {ord.items?.length || 0} items
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
