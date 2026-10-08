import React, { useState, useEffect } from 'react';
import { UtensilsCrossed, Clock, CheckCircle, ChefHat, Volume2, AlertTriangle, Flame } from 'lucide-react';
import type { Order } from '../types';

interface KitchenDisplayProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: number, status: 'Preparing' | 'Ready' | 'Completed') => void;
  onPlayChime?: () => void;
}

export const KitchenDisplay: React.FC<KitchenDisplayProps> = ({ 
  orders, 
  onUpdateOrderStatus,
  onPlayChime 
}) => {
  const [filter, setFilter] = useState<'All' | 'Pending' | 'Preparing' | 'Ready'>('All');
  const [now, setNow] = useState<number>(Date.now());

  // Clock tick every second for live ticket timers
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filter only active orders
  const activeOrders = orders.filter(
    (o) => o.status === 'Pending' || o.status === 'Preparing' || o.status === 'Ready'
  );

  const displayedOrders = filter === 'All' 
    ? activeOrders 
    : activeOrders.filter((o) => o.status === filter);

  // Calculate Batch Cooking Totals across all pending & preparing tickets
  const itemPrepMap: { [name: string]: number } = {};
  activeOrders
    .filter((o) => o.status === 'Pending' || o.status === 'Preparing')
    .forEach((o) => {
      o.items.forEach((it) => {
        itemPrepMap[it.name] = (itemPrepMap[it.name] || 0) + it.qty;
      });
    });

  const topPrepItems = Object.entries(itemPrepMap).sort((a, b) => b[1] - a[1]);

  // Format Elapsed Time (e.g. "04:15")
  const getElapsedTime = (createdAt: string) => {
    const elapsedSeconds = Math.max(0, Math.floor((now - new Date(createdAt).getTime()) / 1000));
    const mins = Math.floor(elapsedSeconds / 60);
    const secs = elapsedSeconds % 60;
    return {
      formatted: `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`,
      mins,
      elapsedSeconds
    };
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#080a0d] p-5 overflow-hidden select-none">
      {/* KDS Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#212833]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white tracking-wide">
                Kitchen Display System (KDS)
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold flex items-center gap-1.5 animate-pulse">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                MONITOR 2 • LIVE TV FEED
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Instant real-time ticket stream from Cashier terminals
            </p>
          </div>
        </div>

        {/* Filter Pills & Actions */}
        <div className="flex items-center gap-2">
          {onPlayChime && (
            <button
              onClick={onPlayChime}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151a21] hover:bg-[#202733] border border-[#2b3543] text-gray-300 hover:text-white text-xs font-bold transition-all shadow-md"
              title="Test Kitchen Audio Bell"
            >
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Test Bell</span>
            </button>
          )}

          <div className="flex items-center bg-[#151a21] p-1 rounded-xl border border-[#212833]">
            {(['All', 'Pending', 'Preparing', 'Ready'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  filter === tab
                    ? 'bg-[#fed428] text-black shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
                {tab === 'All' && ` (${activeOrders.length})`}
                {tab === 'Pending' && ` (${activeOrders.filter(o => o.status === 'Pending').length})`}
                {tab === 'Preparing' && ` (${activeOrders.filter(o => o.status === 'Preparing').length})`}
                {tab === 'Ready' && ` (${activeOrders.filter(o => o.status === 'Ready').length})`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Batch Cooking Summary Bar */}
      {topPrepItems.length > 0 && (
        <div className="mb-4 bg-[#12161f] border border-amber-500/30 rounded-2xl p-3 flex items-center gap-3 overflow-x-auto shadow-md">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs shrink-0 pr-3 border-r border-[#212833]">
            <Flame className="w-4 h-4 text-amber-500 animate-bounce" />
            <span>BATCH PREP:</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto py-0.5">
            {topPrepItems.map(([name, qty]) => (
              <span
                key={name}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#1c232e] border border-[#2b3543] text-xs font-bold text-white shrink-0"
              >
                <span className="w-5 h-5 rounded-md bg-amber-500 text-black flex items-center justify-center font-mono font-black text-[11px]">
                  {qty}
                </span>
                <span>{name}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Orders Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {displayedOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
            <UtensilsCrossed className="w-20 h-20 text-gray-700 mb-3" />
            <h3 className="text-lg font-bold text-gray-300">Kitchen Queue is Clear!</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm">
              All active tickets have been fulfilled. New orders placed by cashiers will pop up here with an audible chime.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
            {displayedOrders.map((order) => {
              const isPending = order.status === 'Pending';
              const isPreparing = order.status === 'Preparing';
              const isReady = order.status === 'Ready';

              const timer = getElapsedTime(order.createdAt);
              const isUrgent = timer.mins >= 10;
              const isWarning = timer.mins >= 5 && timer.mins < 10;

              return (
                <div
                  key={order.id}
                  className={`bg-[#12161f] rounded-2xl border flex flex-col justify-between overflow-hidden shadow-2xl transition-all ${
                    isUrgent
                      ? 'border-rose-500 shadow-rose-500/20 ring-1 ring-rose-500'
                      : isPending
                      ? 'border-amber-500/60 shadow-amber-500/5'
                      : isPreparing
                      ? 'border-[#0ca1e1]/70 shadow-[#0ca1e1]/5'
                      : 'border-emerald-500/70 shadow-emerald-500/5'
                  }`}
                >
                  {/* Ticket Header */}
                  <div
                    className={`p-3.5 border-b flex items-center justify-between ${
                      isUrgent
                        ? 'bg-rose-950/40 border-rose-900/50 text-rose-300'
                        : isPending
                        ? 'bg-amber-950/25 border-amber-900/40 text-amber-300'
                        : isPreparing
                        ? 'bg-sky-950/25 border-sky-900/40 text-sky-300'
                        : 'bg-emerald-950/25 border-emerald-900/40 text-emerald-300'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-black tracking-wide text-white">
                          #{order.transactionId}
                        </span>
                        {isUrgent && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-600 text-white font-black animate-pulse flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            RUSH!
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] opacity-80 font-semibold block">
                        Cashier: {order.cashier || 'Terminal'}
                      </span>
                    </div>

                    {/* Live Timer Clock */}
                    <div className="text-right">
                      <div
                        className={`flex items-center gap-1 text-xs font-mono font-black px-2 py-0.5 rounded-lg border ${
                          isUrgent
                            ? 'bg-rose-900/50 text-rose-200 border-rose-700 animate-pulse'
                            : isWarning
                            ? 'bg-amber-900/40 text-amber-300 border-amber-700'
                            : 'bg-black/40 text-gray-300 border-[#212833]'
                        }`}
                      >
                        <Clock className="w-3 h-3" />
                        <span>{timer.formatted}</span>
                      </div>
                      <span className="text-[10px] opacity-60 font-mono mt-0.5 block">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Items List */}
                  <div className="p-3.5 flex-1 space-y-2.5 overflow-y-auto max-h-72">
                    {order.items.map((it, idx) => (
                      <div
                        key={idx}
                        className="flex items-start justify-between gap-2 border-b border-[#212833]/70 pb-2.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <span className="w-7 h-7 rounded-lg bg-[#080a0d] border border-[#2b3543] text-[#fed428] font-mono font-black text-sm flex items-center justify-center shrink-0">
                            {it.qty}
                          </span>
                          <div>
                            <h4 className="font-bold text-white text-sm leading-snug">
                              {it.name}
                            </h4>
                            {it.spiceLevel && it.spiceLevel !== 'None' && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800/80 font-bold inline-block mt-1">
                                🌶️ {it.spiceLevel}
                              </span>
                            )}
                            {it.addons && it.addons.length > 0 && (
                              <div className="text-[11px] text-amber-300/80 font-medium mt-0.5">
                                + {it.addons.join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Status CTA Buttons */}
                  <div className="p-3 bg-[#080a0d] border-t border-[#212833] flex items-center gap-2">
                    {isPending && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = order.id || Number(order.transactionId);
                          onUpdateOrderStatus(targetId, 'Preparing');
                        }}
                        className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-300 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer touch-manipulation select-none"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>START PREPARING ➔</span>
                      </button>
                    )}

                    {isPreparing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = order.id || Number(order.transactionId);
                          onUpdateOrderStatus(targetId, 'Ready');
                        }}
                        className="w-full py-3.5 rounded-xl bg-[#0ca1e1] hover:bg-sky-400 active:bg-sky-300 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#0ca1e1]/20 active:scale-95 cursor-pointer touch-manipulation select-none"
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                        <span>MARK READY ➔</span>
                      </button>
                    )}

                    {isReady && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          const targetId = order.id || Number(order.transactionId);
                          onUpdateOrderStatus(targetId, 'Completed');
                        }}
                        className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-300 text-black font-black text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer touch-manipulation select-none"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>SERVE & COMPLETE ✓</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
