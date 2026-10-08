import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Receipt, 
  ShoppingBag, 
  Flame, 
  RefreshCw, 
  Calendar,
  Award,
  ArrowUpRight
} from 'lucide-react';
import type { Order, MenuItem, RawProduct } from '../types';

interface DashboardViewProps {
  orders: Order[];
  menuItems: MenuItem[];
  rawProducts: RawProduct[];
  onRefresh: () => void;
}

type PeriodFilter = 'today' | 'yesterday' | 'last7days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'custom';

interface ChartDataPoint {
  label: string;
  fullDate: string;
  amount: number;
  orderCount: number;
  cashAmount: number;
  gcashAmount: number;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders,
  onRefresh
}) => {
  const [period, setPeriod] = useState<PeriodFilter>('thisMonth');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [activeTooltip, setActiveTooltip] = useState<ChartDataPoint | null>(null);

  // Safe date parser
  const parseDate = (createdAt?: string | null): Date => {
    if (!createdAt) return new Date();
    if (typeof createdAt === 'string' && createdAt.includes(' ') && !createdAt.includes('T')) {
      return new Date(createdAt.replace(' ', 'T'));
    }
    return new Date(createdAt);
  };

  // 1. Filter Orders by selected Period
  const { filteredOrders, periodLabel } = useMemo(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    let start = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0);
    let end = new Date(todayYear, todayMonth, todayDate, 23, 59, 59, 999);
    let label = 'Today';

    if (period === 'today') {
      start = new Date(todayYear, todayMonth, todayDate, 0, 0, 0, 0);
      end = new Date(todayYear, todayMonth, todayDate, 23, 59, 59, 999);
      label = `Today (${now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
    } else if (period === 'yesterday') {
      start = new Date(todayYear, todayMonth, todayDate - 1, 0, 0, 0, 0);
      end = new Date(todayYear, todayMonth, todayDate - 1, 23, 59, 59, 999);
      label = `Yesterday (${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })})`;
    } else if (period === 'last7days') {
      start = new Date(todayYear, todayMonth, todayDate - 6, 0, 0, 0, 0);
      end = new Date(todayYear, todayMonth, todayDate, 23, 59, 59, 999);
      label = 'Past 7 Days';
    } else if (period === 'thisMonth') {
      start = new Date(todayYear, todayMonth, 1, 0, 0, 0, 0);
      end = new Date(todayYear, todayMonth + 1, 0, 23, 59, 59, 999);
      label = `This Month (${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
    } else if (period === 'lastMonth') {
      start = new Date(todayYear, todayMonth - 1, 1, 0, 0, 0, 0);
      end = new Date(todayYear, todayMonth, 0, 23, 59, 59, 999);
      label = `Last Month (${start.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })})`;
    } else if (period === 'thisYear') {
      start = new Date(todayYear, 0, 1, 0, 0, 0, 0);
      end = new Date(todayYear, 11, 31, 23, 59, 59, 999);
      label = `This Year (${todayYear})`;
    } else if (period === 'lastYear') {
      start = new Date(todayYear - 1, 0, 1, 0, 0, 0, 0);
      end = new Date(todayYear - 1, 11, 31, 23, 59, 59, 999);
      label = `Last Year (${todayYear - 1})`;
    } else if (period === 'custom') {
      if (customStart) {
        start = new Date(customStart + 'T00:00:00');
      }
      if (customEnd) {
        end = new Date(customEnd + 'T23:59:59');
      }
      label = customStart && customEnd ? `${customStart} to ${customEnd}` : 'Custom Date Range';
    }

    const matched = orders.filter((o) => {
      const d = parseDate(o.createdAt);
      return d >= start && d <= end;
    });

    return { filteredOrders: matched, periodLabel: label };
  }, [orders, period, customStart, customEnd]);

  // 2. Generate Chart Data Points (Daily / Hourly Aggregation)
  const chartData = useMemo<ChartDataPoint[]>(() => {
    const now = new Date();
    const todayYear = now.getFullYear();
    const todayMonth = now.getMonth();
    const todayDate = now.getDate();

    if (period === 'today' || period === 'yesterday') {
      // Hourly breakdown (e.g. 8 AM to 11 PM)
      const targetDate = period === 'today' ? now : new Date(todayYear, todayMonth, todayDate - 1);
      const hoursMap: { [hour: number]: { amount: number; orderCount: number; cash: number; gcash: number } } = {};
      
      // Initialize 8 AM to 10 PM
      for (let h = 8; h <= 22; h++) {
        hoursMap[h] = { amount: 0, orderCount: 0, cash: 0, gcash: 0 };
      }

      filteredOrders.forEach((o) => {
        const d = parseDate(o.createdAt);
        const h = d.getHours();
        if (!hoursMap[h]) {
          hoursMap[h] = { amount: 0, orderCount: 0, cash: 0, gcash: 0 };
        }
        const amt = Number(o.totalAmount || 0);
        hoursMap[h].amount += amt;
        hoursMap[h].orderCount += 1;
        if ((o.paymentMethod || '').toLowerCase() === 'cash') hoursMap[h].cash += amt;
        else if ((o.paymentMethod || '').toLowerCase() === 'gcash') hoursMap[h].gcash += amt;
      });

      return Object.entries(hoursMap)
        .map(([hStr, data]) => {
          const h = parseInt(hStr, 10);
          const periodSuffix = h >= 12 ? 'PM' : 'AM';
          const displayHour = h % 12 === 0 ? 12 : h % 12;
          return {
            label: `${displayHour}${periodSuffix}`,
            fullDate: `${targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${displayHour}:00 ${periodSuffix}`,
            amount: data.amount,
            orderCount: data.orderCount,
            cashAmount: data.cash,
            gcashAmount: data.gcash
          };
        })
        .sort((a, b) => {
          const parseH = (label: string) => {
            const num = parseInt(label, 10);
            const isPM = label.includes('PM');
            if (num === 12) return isPM ? 12 : 0;
            return isPM ? num + 12 : num;
          };
          return parseH(a.label) - parseH(b.label);
        });
    }

    if (period === 'last7days') {
      // 7 Daily bars
      const days: ChartDataPoint[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(todayYear, todayMonth, todayDate - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayOrders = filteredOrders.filter((o) => {
          const od = parseDate(o.createdAt);
          return od.toISOString().split('T')[0] === dayStr;
        });

        const amount = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const cashAmount = dayOrders
          .filter((o) => (o.paymentMethod || '').toLowerCase() === 'cash')
          .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const gcashAmount = dayOrders
          .filter((o) => (o.paymentMethod || '').toLowerCase() === 'gcash')
          .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

        days.push({
          label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
          fullDate: d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }),
          amount,
          orderCount: dayOrders.length,
          cashAmount,
          gcashAmount
        });
      }
      return days;
    }

    if (period === 'thisMonth' || period === 'lastMonth') {
      // Days of Month
      const targetMonthDate = period === 'thisMonth' 
        ? new Date(todayYear, todayMonth, 1)
        : new Date(todayYear, todayMonth - 1, 1);
      
      const numDays = new Date(targetMonthDate.getFullYear(), targetMonthDate.getMonth() + 1, 0).getDate();
      const monthYear = targetMonthDate.getFullYear();
      const mIdx = targetMonthDate.getMonth();

      const days: ChartDataPoint[] = [];
      for (let day = 1; day <= numDays; day++) {
        const d = new Date(monthYear, mIdx, day);
        
        const dayOrders = filteredOrders.filter((o) => {
          const od = parseDate(o.createdAt);
          return (
            od.getFullYear() === monthYear &&
            od.getMonth() === mIdx &&
            od.getDate() === day
          );
        });

        const amount = dayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const cashAmount = dayOrders
          .filter((o) => (o.paymentMethod || '').toLowerCase() === 'cash')
          .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const gcashAmount = dayOrders
          .filter((o) => (o.paymentMethod || '').toLowerCase() === 'gcash')
          .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

        days.push({
          label: `${day}`,
          fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
          amount,
          orderCount: dayOrders.length,
          cashAmount,
          gcashAmount
        });
      }
      return days;
    }

    if (period === 'thisYear' || period === 'lastYear') {
      // 12 Months
      const targetYear = period === 'thisYear' ? todayYear : todayYear - 1;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      return months.map((mName, mIdx) => {
        const monthOrders = filteredOrders.filter((o) => {
          const od = parseDate(o.createdAt);
          return od.getFullYear() === targetYear && od.getMonth() === mIdx;
        });

        const amount = monthOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const cashAmount = monthOrders
          .filter((o) => (o.paymentMethod || '').toLowerCase() === 'cash')
          .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
        const gcashAmount = monthOrders
          .filter((o) => (o.paymentMethod || '').toLowerCase() === 'gcash')
          .reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

        return {
          label: mName,
          fullDate: `${mName} ${targetYear}`,
          amount,
          orderCount: monthOrders.length,
          cashAmount,
          gcashAmount
        };
      });
    }

    // Custom or fallback: Group by distinct date string
    const dateMap: { [dateKey: string]: { label: string; fullDate: string; amount: number; orderCount: number; cash: number; gcash: number } } = {};
    filteredOrders.forEach((o) => {
      const d = parseDate(o.createdAt);
      const dateKey = d.toISOString().split('T')[0];
      if (!dateMap[dateKey]) {
        dateMap[dateKey] = {
          label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          fullDate: d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
          amount: 0,
          orderCount: 0,
          cash: 0,
          gcash: 0
        };
      }
      const amt = Number(o.totalAmount || 0);
      dateMap[dateKey].amount += amt;
      dateMap[dateKey].orderCount += 1;
      if ((o.paymentMethod || '').toLowerCase() === 'cash') dateMap[dateKey].cash += amt;
      else if ((o.paymentMethod || '').toLowerCase() === 'gcash') dateMap[dateKey].gcash += amt;
    });

    const entries = Object.keys(dateMap).sort().map((k) => ({
      label: dateMap[k].label,
      fullDate: dateMap[k].fullDate,
      amount: dateMap[k].amount,
      orderCount: dateMap[k].orderCount,
      cashAmount: dateMap[k].cash,
      gcashAmount: dateMap[k].gcash
    }));

    return entries.length > 0 ? entries : [{
      label: 'No Data',
      fullDate: 'No transactions in this custom range',
      amount: 0,
      orderCount: 0,
      cashAmount: 0,
      gcashAmount: 0
    }];
  }, [filteredOrders, period]);

  // 3. Financial Metrics & Stats
  const totalRevenue = useMemo(() => {
    return filteredOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
  }, [filteredOrders]);

  const totalOrdersCount = filteredOrders.length;
  const avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;

  // Peak sales in chart
  const peakDataPoint = useMemo(() => {
    if (chartData.length === 0) return null;
    return chartData.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), chartData[0]);
  }, [chartData]);

  const maxAmount = useMemo(() => {
    const max = Math.max(...chartData.map((d) => d.amount), 0);
    return max > 0 ? max * 1.15 : 1000; // 15% headroom
  }, [chartData]);

  // Top 5 Best Sellers in period
  const topItems = useMemo(() => {
    const itemMap: { [name: string]: { name: string; count: number; revenue: number } } = {};
    filteredOrders.forEach((o) => {
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
    return Object.values(itemMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [filteredOrders]);

  // Non-zero active sales days list for table breakdown
  const activeDaysList = useMemo(() => {
    return [...chartData]
      .filter((d) => d.amount > 0 || d.orderCount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [chartData]);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e11] p-5 md:p-6 overflow-hidden select-none font-sans text-gray-100">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-[#212833]">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#fed428]/10 border border-[#fed428]/30 flex items-center justify-center text-[#fed428] shadow-lg shadow-[#fed428]/10">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-black text-white tracking-wide">
                Sales & Revenue Analytics
              </h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-mono font-bold">
                {periodLabel}
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Interactive sales amount per day, volume analysis, and historical trends
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#151a21] hover:bg-[#1f2633] text-gray-300 hover:text-white border border-[#212833] text-xs font-semibold transition-all cursor-pointer active:scale-95 shadow-md"
          title="Refresh Sales Data"
        >
          <RefreshCw className="w-3.5 h-3.5 text-[#fed428]" />
          <span>Sync Now</span>
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-5">
        {/* Time Period Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-[#12161f] border border-[#212833] rounded-2xl shadow-inner">
          {(
            [
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: 'last7days', label: 'Last 7 Days' },
              { id: 'thisMonth', label: 'This Month' },
              { id: 'lastMonth', label: 'Last Month' },
              { id: 'thisYear', label: 'This Year' },
              { id: 'lastYear', label: 'Last Year' },
              { id: 'custom', label: 'Custom' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setPeriod(tab.id);
                setActiveTooltip(null);
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                period === tab.id
                  ? 'bg-[#fed428] text-black shadow-md shadow-[#fed428]/20 scale-102 font-extrabold'
                  : 'text-gray-400 hover:text-white hover:bg-[#1c232f]'
              }`}
            >
              {tab.label}
            </button>
          ))}

          {/* Custom Date Inputs if Custom selected */}
          {period === 'custom' && (
            <div className="flex items-center gap-2 ml-auto py-1 px-2 bg-[#0c0e11] rounded-xl border border-[#26303d]">
              <Calendar className="w-3.5 h-3.5 text-[#fed428]" />
              <input
                type="date"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-transparent text-xs text-white border-0 focus:outline-none font-mono"
              />
              <span className="text-gray-500 text-xs">to</span>
              <input
                type="date"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-transparent text-xs text-white border-0 focus:outline-none font-mono"
              />
            </div>
          )}
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Revenue */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4 shadow-xl relative overflow-hidden group">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1.5">
              <span>TOTAL SALES AMOUNT</span>
              <TrendingUp className="w-4 h-4 text-[#fed428]" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-[#fed428] font-mono tracking-tight">
              ₱{totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              In {periodLabel}
            </span>
          </div>

          {/* Orders Count */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1.5">
              <span>ORDERS SERVED</span>
              <Receipt className="w-4 h-4 text-[#0ca1e1]" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-white font-mono tracking-tight">
              {totalOrdersCount}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              Fulfilled transactions
            </span>
          </div>

          {/* Average Ticket */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1.5">
              <span>AVG. ORDER VALUE</span>
              <ShoppingBag className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-white font-mono tracking-tight">
              ₱{avgOrderValue.toFixed(2)}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">
              Per customer receipt
            </span>
          </div>

          {/* Peak Sales Day */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-xs text-gray-400 font-semibold mb-1.5">
              <span>HIGHEST PEAK SALES</span>
              <Award className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl lg:text-3xl font-black text-emerald-400 font-mono tracking-tight">
              {peakDataPoint && peakDataPoint.amount > 0 ? (
                <>₱{peakDataPoint.amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}</>
              ) : (
                '₱0.00'
              )}
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block truncate">
              {peakDataPoint && peakDataPoint.amount > 0 ? peakDataPoint.fullDate : 'No peak recorded'}
            </span>
          </div>
        </div>

        {/* ==================== THE SALES GRAPH ==================== */}
        <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-5 shadow-2xl relative">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#212833]/60">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Amount of Sales per Day</span>
                <span className="text-xs text-gray-400 font-normal font-mono">
                  (₱ Total Revenue)
                </span>
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Hover or click on any bar to see detailed breakdown and orders count
              </p>
            </div>

            {/* Active Hover / Selected Tooltip Badge */}
            {activeTooltip && (
              <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-[#0c0e11] border border-[#fed428]/40 shadow-lg animate-in fade-in">
                <span className="text-xs font-bold text-gray-300">
                  {activeTooltip.fullDate}:
                </span>
                <span className="text-sm font-black font-mono text-[#fed428]">
                  ₱{activeTooltip.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
                <span className="text-[11px] text-gray-400 font-mono font-medium">
                  ({activeTooltip.orderCount} orders)
                </span>
              </div>
            )}
          </div>

          {/* SVG Bar Chart Container */}
          <div className="w-full h-72 sm:h-80 relative flex flex-col justify-end">
            {/* Background Grid Lines & Y-Axis Labels */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
              {[1, 0.75, 0.5, 0.25, 0].map((ratio) => {
                const val = maxAmount * ratio;
                return (
                  <div key={ratio} className="w-full flex items-center gap-2">
                    <span className="w-14 text-right text-[10px] font-mono text-gray-500 shrink-0">
                      ₱{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val.toFixed(0)}
                    </span>
                    <div className="flex-1 border-b border-[#212833]/60"></div>
                  </div>
                );
              })}
            </div>

            {/* Bars Area */}
            <div className="relative pl-16 pr-2 h-full flex items-end justify-between gap-1 sm:gap-2 pb-8 pt-4 z-10">
              {chartData.map((d, idx) => {
                const heightPercent = maxAmount > 0 ? (d.amount / maxAmount) * 100 : 0;
                const isSelected = activeTooltip?.fullDate === d.fullDate;
                const hasSales = d.amount > 0;

                return (
                  <div
                    key={idx}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                    onMouseEnter={() => setActiveTooltip(d)}
                    onClick={() => setActiveTooltip(d)}
                  >
                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                      <div className="bg-[#080a0d] border border-[#2b3543] text-white rounded-xl p-2.5 shadow-2xl text-center whitespace-nowrap">
                        <p className="text-[11px] font-bold text-gray-300">{d.fullDate}</p>
                        <p className="text-sm font-black font-mono text-[#fed428] mt-0.5">
                          ₱{d.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {d.orderCount} orders • Cash: ₱{d.cashAmount.toFixed(0)} • GCash: ₱{d.gcashAmount.toFixed(0)}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-[#080a0d] border-r border-b border-[#2b3543] rotate-45 -mt-1"></div>
                    </div>

                    {/* The Bar */}
                    <div className="w-full max-w-[28px] h-full flex items-end justify-center">
                      <div
                        style={{ height: `${Math.max(hasSales ? 4 : 2, heightPercent)}%` }}
                        className={`w-full rounded-t-lg transition-all duration-300 ${
                          hasSales
                            ? isSelected
                              ? 'bg-[#fed428] shadow-lg shadow-[#fed428]/40 ring-2 ring-white'
                              : 'bg-gradient-to-t from-amber-500/70 to-[#fed428] group-hover:from-amber-400 group-hover:to-[#fed428] group-hover:shadow-md group-hover:shadow-[#fed428]/20'
                            : 'bg-[#1b222d]/60 group-hover:bg-[#252f3f]'
                        }`}
                      />
                    </div>

                    {/* X-axis label */}
                    <div className="absolute top-full mt-2 text-center w-full overflow-hidden">
                      <span
                        className={`text-[10px] font-mono block truncate ${
                          isSelected
                            ? 'text-[#fed428] font-bold'
                            : hasSales
                            ? 'text-gray-300 font-medium'
                            : 'text-gray-600'
                        }`}
                      >
                        {d.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Daily Breakdown Table & Best Sellers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Active Days Breakdown Table */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Daily Sales Summary</span>
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                {activeDaysList.length} active dates
              </span>
            </div>

            {activeDaysList.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <Receipt className="w-10 h-10 mx-auto text-gray-700 mb-2" />
                <p className="text-xs font-semibold">No sales recorded in this period</p>
                <p className="text-[11px] text-gray-600 mt-0.5">Try selecting another time range above.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {activeDaysList.map((day, idx) => {
                  const sharePct = totalRevenue > 0 ? (day.amount / totalRevenue) * 100 : 0;
                  return (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#0c0e11] border border-[#212833] hover:border-[#2f3b4e] transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-[#18202b] text-gray-400 font-mono font-bold text-xs flex items-center justify-center border border-[#212833]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-white block">
                            {day.fullDate}
                          </span>
                          <span className="text-[11px] text-gray-400 font-mono">
                            {day.orderCount} orders • Cash: ₱{day.cashAmount.toFixed(0)} • GCash: ₱{day.gcashAmount.toFixed(0)}
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black font-mono text-[#fed428] block">
                          ₱{day.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                          <div className="w-16 h-1.5 bg-[#1f2633] rounded-full overflow-hidden">
                            <div
                              style={{ width: `${Math.min(100, Math.max(5, sharePct))}%` }}
                              className="h-full bg-[#fed428] rounded-full"
                            />
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {sharePct.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Best Seller Dishes in selected period */}
          <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-5 shadow-xl">
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-[#fed428]" />
                <span>Top Selling Dishes in Period</span>
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                Ranked by revenue
              </span>
            </div>

            {topItems.length === 0 ? (
              <div className="py-12 text-center text-gray-500">
                <ShoppingBag className="w-10 h-10 mx-auto text-gray-700 mb-2" />
                <p className="text-xs font-semibold">No dishes ordered in this period</p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {topItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-[#0c0e11] border border-[#212833] hover:border-[#2f3b4e] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-[#18202b] text-[#fed428] font-black text-xs flex items-center justify-center font-mono border border-[#212833]">
                        #{idx + 1}
                      </span>
                      <div>
                        <span className="font-bold text-xs text-white block">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-gray-400 font-medium">
                          {item.count} portions sold
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-bold text-[#fed428] block font-mono">
                        ₱{item.revenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center justify-end gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        Top Seller
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
