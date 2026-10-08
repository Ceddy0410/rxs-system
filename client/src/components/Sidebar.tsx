import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  UtensilsCrossed, 
  Boxes, 
  BarChart3, 
  Users,
  Printer, 
  Tv,
  ArrowRightLeft,
  Shield, 
  UserCheck, 
  ChefHat
} from 'lucide-react';
import type { User } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  pendingKitchenCount: number;
  currentUser: User;
  onSwitchUser: (user: User) => void;
  onOpenUserModal?: () => void;
  tvMode: boolean;
  setTvMode: (val: boolean) => void;
}

export const USERS_LIST: User[] = [
  {
    id: 1,
    username: 'admin',
    name: 'Ceddy (Super Admin)',
    role: 'Admin',
    avatar: '/images/icons/AccessAdminDark.png'
  },
  {
    id: 2,
    username: 'cashier1',
    name: 'Maria (Cashier)',
    role: 'Cashier',
    avatar: '/images/icons/AccessCashierDark.png'
  },
  {
    id: 3,
    username: 'cashier2',
    name: 'John (Cashier)',
    role: 'Cashier',
    avatar: '/images/icons/AccessCashierDark.png'
  },
  {
    id: 4,
    username: 'chef',
    name: 'Chief Ken (Kitchen)',
    role: 'Kitchen',
    avatar: '/images/icons/AccessKitchenDark.png'
  }
];

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setCurrentTab, 
  pendingKitchenCount,
  currentUser,
  onOpenUserModal,
  tvMode,
  setTvMode
}) => {
  // Define full menu
  const allMenuItems = [
    { id: 'pos', label: 'Transaction', icon: ShoppingBag, roles: ['Admin', 'Cashier'] },
    { id: 'kitchen', label: 'Kitchen', icon: UtensilsCrossed, badge: pendingKitchenCount, roles: ['Admin', 'Cashier', 'Kitchen'] },
    { id: 'inventory', label: 'Inventory', icon: Boxes, roles: ['Admin', 'Cashier'] },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'Cashier'] },
    { id: 'reports', label: 'Reports', icon: BarChart3, roles: ['Admin'] },
    { id: 'users', label: 'Staff Accounts', icon: Users, roles: ['Admin'] },
    { id: 'printer', label: 'Printer & MNT', icon: Printer, roles: ['Admin'] },
  ];

  // Filter based on user's role
  const menuItems = allMenuItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside className="w-64 bg-[#0f1217] border-r border-[#212833] flex flex-col justify-between select-none">
      <div>
        {/* RXS Restaurant Brand Header */}
        <div className="p-5 border-b border-[#212833]/80">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/10 p-0.5 border border-[#212833] shadow-lg shadow-black flex items-center justify-center">
              <img
                src="/images/rxs_logo.png"
                alt="RXS Restaurant Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="font-black tracking-wider text-base text-white">
                RXS Restaurant
              </h1>
              <p className="text-[11px] font-semibold text-[#fed428] tracking-wide">
                Sales & Inventory
              </p>
            </div>
          </div>
        </div>

        {/* TV Mode Toggle for Kitchen Screen */}
        {currentUser.role === 'Kitchen' && (
          <div className="p-3">
            <button
              onClick={() => setTvMode(!tvMode)}
              className={`w-full flex items-center justify-center gap-2 p-3 rounded-xl font-bold text-xs border transition-all ${
                tvMode
                  ? 'bg-[#0ca1e1] text-black border-[#0ca1e1] shadow-lg shadow-[#0ca1e1]/20'
                  : 'bg-[#18202b] text-gray-300 border-[#212833] hover:text-white'
              }`}
            >
              <Tv className="w-4 h-4" />
              <span>{tvMode ? 'Exit TV Mode' : 'TV Screen Full View'}</span>
            </button>
          </div>
        )}

        {/* Navigation Items (Role Filtered) */}
        <nav className="p-3 space-y-1.5 mt-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.id === 'users' && onOpenUserModal) {
                    onOpenUserModal();
                  } else {
                    setCurrentTab(item.id);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl font-semibold text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-[#fed428] text-black shadow-md shadow-[#fed428]/20 font-bold scale-[1.01]'
                    : 'text-gray-400 hover:text-white hover:bg-[#181e27]'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-black' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && item.badge > 0 ? (
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    isActive ? 'bg-black text-[#fed428]' : 'bg-[#0ca1e1] text-black'
                  }`}>
                    {item.badge}
                  </span>
                ) : null}
              </button>
            );
          })}
        </nav>
      </div>

      {/* User Info & Switcher Footer */}
      <div className="p-3 border-t border-[#212833] bg-[#0c0e11]/60 m-2 rounded-2xl relative">
        <div className="flex items-center justify-between">
          <div 
            onClick={onOpenUserModal}
            className="flex items-center gap-3 min-w-0 cursor-pointer group"
            title="Click to switch staff account"
          >
            <div className={`w-10 h-10 rounded-full border-2 p-0.5 overflow-hidden flex items-center justify-center bg-gray-900 ${
              currentUser.role === 'Admin' ? 'border-[#fed428]' :
              currentUser.role === 'Cashier' ? 'border-[#0ca1e1]' : 'border-amber-500'
            }`}>
              {currentUser.role === 'Admin' ? (
                <Shield className="w-5 h-5 text-[#fed428]" />
              ) : currentUser.role === 'Cashier' ? (
                <UserCheck className="w-5 h-5 text-[#0ca1e1]" />
              ) : (
                <ChefHat className="w-5 h-5 text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-[#fed428] transition-colors">
                {currentUser.name}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full animate-pulse ${
                  currentUser.role === 'Admin' ? 'bg-[#fed428]' :
                  currentUser.role === 'Cashier' ? 'bg-[#0ca1e1]' : 'bg-amber-400'
                }`}></span>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  currentUser.role === 'Admin' ? 'text-[#fed428]' :
                  currentUser.role === 'Cashier' ? 'text-[#0ca1e1]' : 'text-amber-400'
                }`}>
                  {currentUser.role === 'Kitchen' ? 'Chief (Kitchen)' : currentUser.role}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Switch User Button */}
          {onOpenUserModal && (
            <button
              onClick={onOpenUserModal}
              className="w-8 h-8 rounded-xl bg-[#151a21] hover:bg-[#202733] border border-[#212833] text-gray-300 hover:text-white flex items-center justify-center transition-all cursor-pointer touch-manipulation active:scale-95"
              title="Switch Cashier / User Account"
            >
              <ArrowRightLeft className="w-4 h-4 text-[#fed428]" />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
};
