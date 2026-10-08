import React, { useState, useEffect } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Database, 
  Printer, 
  Clock, 
  ArrowRightLeft,
  Shield, 
  UserCheck, 
  ChefHat,
  AlertTriangle
} from 'lucide-react';
import type { User, RawProduct } from '../types';

interface HeaderProps {
  dbEngine: string;
  printerStatus: { connected: boolean; paperReady: boolean };
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  currentUser: User;
  onOpenUserModal?: () => void;
  isSocketConnected?: boolean;
  lowStockIngredients?: RawProduct[];
}

export const Header: React.FC<HeaderProps> = ({
  dbEngine,
  printerStatus,
  soundEnabled,
  setSoundEnabled,
  currentUser,
  onOpenUserModal,
  isSocketConnected = true,
  lowStockIngredients = []
}) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
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

  return (
    <header className="h-16 bg-[#0f1217] border-b border-[#212833] px-5 flex items-center justify-between select-none">
      {/* Left: Active Staff & Real-Time Sync Indicator */}
      <div className="flex items-center gap-3">
        {/* Active Cashier / Staff Badge with 1-Click Switch Button */}
        <div className="flex items-center gap-2 bg-[#151a21] p-1.5 pr-2.5 rounded-2xl border border-[#212833] shadow-inner">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
            currentUser.role === 'Admin' ? 'bg-[#fed428]/20 text-[#fed428]' :
            currentUser.role === 'Cashier' ? 'bg-[#0ca1e1]/20 text-[#0ca1e1]' :
            'bg-amber-500/20 text-amber-400'
          }`}>
            {currentUser.role === 'Admin' ? (
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
                currentUser.role === 'Admin' ? 'bg-[#fed428]' :
                currentUser.role === 'Cashier' ? 'bg-[#0ca1e1]' : 'bg-amber-400'
              }`}></span>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${
                currentUser.role === 'Admin' ? 'text-[#fed428]' :
                currentUser.role === 'Cashier' ? 'text-[#0ca1e1]' : 'text-amber-400'
              }`}>
                {currentUser.role}
              </span>
            </div>
          </div>

          {onOpenUserModal && (
            <button
              type="button"
              onClick={onOpenUserModal}
              className="ml-2 flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#0c0e11] hover:bg-[#202733] border border-[#212833] text-gray-300 hover:text-white text-[11px] font-bold transition-all cursor-pointer touch-manipulation active:scale-95"
              title="Switch Cashier or Manage Staff Accounts"
            >
              <ArrowRightLeft className="w-3 h-3 text-[#fed428]" />
              <span className="hidden sm:inline">Switch Acc</span>
            </button>
          )}
        </div>

        {/* Real-time WebSocket Health Pill */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold border ${
            isSocketConnected
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400'
              : 'bg-rose-950/40 border-rose-800/60 text-rose-400 animate-pulse'
          }`}
          title={isSocketConnected ? 'WebSocket Real-Time Sync Active' : 'WebSocket Disconnected - Reconnecting...'}
        >
          <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-emerald-400' : 'bg-rose-500'}`}></span>
          <span>{isSocketConnected ? 'LIVE SYNC' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Right: Status Controls */}
      <div className="flex items-center gap-3">
        {/* Low Stock Raw Ingredients Alert */}
        {lowStockIngredients.length > 0 && (
          <div className="relative group">
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/50 text-amber-300 text-[11px] font-bold font-mono animate-pulse hover:animate-none cursor-pointer shadow-md shadow-amber-500/10">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>{lowStockIngredients.length} LOW INGREDIENT{lowStockIngredients.length > 1 ? 'S' : ''}</span>
            </div>

            {/* Hover Tooltip / Dropdown */}
            <div className="hidden group-hover:block absolute right-0 top-full mt-2 w-80 bg-[#151a21] border border-[#2b3543] rounded-2xl p-3 shadow-2xl z-50 animate-in fade-in zoom-in duration-100">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#212833]">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3 h-3" />
                  Low Stock Ingredients
                </span>
                <span className="text-[10px] text-gray-400 font-mono">
                  {lowStockIngredients.length} item{lowStockIngredients.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {lowStockIngredients.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-[#0c0e11] border border-[#212833] text-xs">
                    <div>
                      <div className="font-bold text-white">{p.name}</div>
                      <div className="text-[10px] text-gray-500">Min: {p.minStock} {p.uom}</div>
                    </div>
                    <span className="text-amber-400 font-mono font-bold">
                      {p.quantity} {p.uom}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Real-time Clock */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#151a21] border border-[#212833] text-gray-300 text-xs font-mono">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden md:inline">{formattedDate}</span>
          <span className="text-[#fed428] font-bold">{formattedTime}</span>
        </div>

        {/* Database Status */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#151a21] border border-[#212833] text-xs">
          <Database className="w-3.5 h-3.5 text-[#0ca1e1]" />
          <span className="text-gray-400">DB:</span>
          <span className="font-semibold text-emerald-400">{dbEngine || 'MySQL'}</span>
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
