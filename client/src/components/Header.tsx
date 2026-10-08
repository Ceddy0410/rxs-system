import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Printer, 
  Clock, 
  Shield, 
  UserCheck, 
  ChefHat, 
  AlertTriangle, 
  Banknote,
  Bell,
  X,
  CheckCheck,
  PackageCheck
} from 'lucide-react';
import type { User, RawProduct } from '../types';

interface HeaderProps {
  printerStatus: { connected: boolean; paperReady: boolean };
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  currentUser: User;
  onOpenUserModal?: () => void;
  isSocketConnected?: boolean;
  lowStockIngredients?: RawProduct[];
  onOpenServerModal?: () => void;
  onOpenCashDrawerModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  printerStatus,
  soundEnabled,
  setSoundEnabled,
  currentUser,
  lowStockIngredients = [],
  onOpenCashDrawerModal
}) => {
  const [time, setTime] = useState(new Date());
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [dismissedNotifIds, setDismissedNotifIds] = useState<string[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Close notification popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formattedDate = time.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  const formattedTime = time.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  // Build active notifications list (low stock & expiring alerts)
  const activeNotifications = useMemo(() => {
    const alerts: Array<{
      id: string;
      title: string;
      message: string;
      type: 'low_stock' | 'restock' | 'expiry';
      item: RawProduct;
    }> = [];

    lowStockIngredients.forEach((p) => {
      alerts.push({
        id: `low-${p.id}`,
        title: `Low Stock: ${p.name}`,
        message: `Only ${p.quantity} ${p.uom} left in stock (Min required: ${p.minStock} ${p.uom})`,
        type: 'low_stock',
        item: p
      });
    });

    return alerts.filter((a) => !dismissedNotifIds.includes(a.id));
  }, [lowStockIngredients, dismissedNotifIds]);

  // Max number indicator is 99 (if exceeded, show 99)
  const rawCount = activeNotifications.length;
  const displayBadgeCount = rawCount > 99 ? '99' : String(rawCount);

  const handleDismissNotif = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedNotifIds((prev) => [...prev, id]);
  };

  const handleClearAllNotifs = () => {
    setDismissedNotifIds(activeNotifications.map((n) => n.id));
  };

  // Role permission check for Drawer Audit (Admin, Manager, Super Admin only)
  const isAdminOrManager = Boolean(
    currentUser && (
      currentUser.role === 'Admin' ||
      currentUser.role === 'Super Admin' ||
      currentUser.role === 'Manager' ||
      String(currentUser.role).toLowerCase().includes('admin') ||
      String(currentUser.role).toLowerCase().includes('manager')
    )
  );

  return (
    <header className="h-16 bg-[#0f1217] border-b border-[#212833] px-5 flex items-center justify-between select-none font-sans">
      {/* Left: Active Staff Badge */}
      <div className="flex items-center gap-3">
        {/* Active Cashier / Staff Badge */}
        <div className="flex items-center gap-2 bg-[#151a21] p-1.5 pr-3 rounded-2xl border border-[#212833] shadow-inner">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
            isAdminOrManager ? 'bg-[#fed428]/20 text-[#fed428]' :
            currentUser.role === 'Cashier' ? 'bg-[#0ca1e1]/20 text-[#0ca1e1]' :
            'bg-amber-500/20 text-amber-400'
          }`}>
            {isAdminOrManager ? (
              <Shield className="w-4 h-4" />
            ) : currentUser.role === 'Cashier' ? (
              <UserCheck className="w-4 h-4" />
            ) : (
              <ChefHat className="w-4 h-4" />
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-xs font-black text-white leading-tight">
              {currentUser.name}
            </span>
            <div className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${
                isAdminOrManager ? 'bg-[#fed428]' :
                currentUser.role === 'Cashier' ? 'bg-[#0ca1e1]' : 'bg-amber-400'
              }`}></span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                isAdminOrManager ? 'text-[#fed428]' :
                currentUser.role === 'Cashier' ? 'text-[#0ca1e1]' : 'text-amber-400'
              }`}>
                {currentUser.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Drawer Audit (Admin Only), Notification Bell, Clock, Printer & Audio Controls */}
      <div className="flex items-center gap-3">
        {/* Drawer Audit Action Button - Admin / Manager / Super Admin Only */}
        {isAdminOrManager && onOpenCashDrawerModal && (
          <button
            type="button"
            onClick={onOpenCashDrawerModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151a21] hover:bg-emerald-950/60 border border-[#212833] hover:border-emerald-700/60 text-emerald-400 text-xs font-bold transition-all cursor-pointer touch-manipulation active:scale-95 shadow-md"
            title="Cash Drawer Balancing & Shift Audit (Admin/Manager Only)"
          >
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span>Drawer Audit</span>
          </button>
        )}

        {/* Sleek Notification Bell with Badge & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            className={`relative w-9 h-9 rounded-xl flex items-center justify-center transition-all border cursor-pointer active:scale-95 ${
              rawCount > 0
                ? 'bg-[#151a21] border-[#2b3543] text-amber-400 hover:text-amber-300 shadow-md'
                : 'bg-[#151a21] border-[#212833] text-gray-400 hover:text-white'
            }`}
            title="System & Inventory Notifications"
          >
            <Bell className="w-4 h-4" />
            {rawCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 border-2 border-[#0f1217] text-white text-[10px] font-black font-mono flex items-center justify-center shadow-lg animate-pulse">
                {displayBadgeCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Modal Box */}
          {isNotifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#151a21] border border-[#2b3543] rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
              {/* Dropdown Header */}
              <div className="px-4 py-3 border-b border-[#212833] flex items-center justify-between bg-[#0f1217]">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#fed428]" />
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Notifications
                  </span>
                  {rawCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold font-mono">
                      {rawCount} new
                    </span>
                  )}
                </div>

                {rawCount > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllNotifs}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Clear All</span>
                  </button>
                )}
              </div>

              {/* Notification List Body */}
              <div className="max-h-80 overflow-y-auto divide-y divide-[#212833]/60 p-1">
                {activeNotifications.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 space-y-1">
                    <PackageCheck className="w-8 h-8 mx-auto text-gray-600 mb-2" />
                    <p className="text-xs font-bold text-gray-400">All caught up!</p>
                    <p className="text-[11px] text-gray-600">No low ingredients or alerts at this time.</p>
                  </div>
                ) : (
                  activeNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-3 hover:bg-[#1a212c] transition-colors flex items-start justify-between gap-3 group rounded-xl"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight">
                            {notif.title}
                          </h4>
                          <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">
                            {notif.message}
                          </p>
                          <span className="text-[10px] font-mono text-amber-400/90 font-semibold mt-1 inline-block">
                            Min: {notif.item.minStock} {notif.item.uom}
                          </span>
                        </div>
                      </div>

                      {/* Click to dismiss item */}
                      <button
                        type="button"
                        onClick={(e) => handleDismissNotif(notif.id, e)}
                        className="text-gray-500 hover:text-gray-300 p-1 rounded-lg hover:bg-[#202733] transition-all cursor-pointer opacity-80 group-hover:opacity-100"
                        title="Dismiss notification"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Real-time Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151a21] border border-[#212833] text-gray-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">{formattedDate}</span>
          <span className="text-[#fed428] font-bold">{formattedTime}</span>
        </div>

        {/* Printer Status */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border font-medium ${
            !printerStatus.connected
              ? 'bg-rose-950/40 border-rose-800 text-rose-300'
              : !printerStatus.paperReady
              ? 'bg-amber-950/40 border-amber-800 text-amber-300'
              : 'bg-emerald-950/40 border-emerald-800/80 text-emerald-400'
          }`}
        >
          <Printer className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {!printerStatus.connected
              ? 'Printer Offline'
              : !printerStatus.paperReady
              ? 'Paper Empty'
              : 'Printer Ready'}
          </span>
        </div>

        {/* Sound Toggle */}
        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer touch-manipulation active:scale-95 ${
            soundEnabled
              ? 'bg-[#151a21] border-[#212833] text-gray-200 hover:text-white'
              : 'bg-[#151a21] border-[#212833] text-gray-500'
          }`}
          title="Toggle Audio Effects"
        >
          {soundEnabled ? (
            <>
              <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Sound On</span>
            </>
          ) : (
            <>
              <VolumeX className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Sound Off</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
