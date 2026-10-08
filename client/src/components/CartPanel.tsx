import React from 'react';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import type { CartItem } from '../types';

interface CartPanelProps {
  cart: CartItem[];
  transactionId: string;
  onUpdateQty: (cartId: string, delta: number) => void;
  onRemoveItem: (cartId: string) => void;
  onClearCart: () => void;
  onOpenPayment: () => void;
}

export const CartPanel: React.FC<CartPanelProps> = ({
  cart,
  transactionId,
  onUpdateQty,
  onRemoveItem,
  onClearCart,
  onOpenPayment
}) => {
  const totalItemsCount = cart.reduce((acc, it) => acc + it.qty, 0);
  const subtotal = cart.reduce((acc, it) => acc + it.price * it.qty, 0);

  return (
    <aside className="w-96 bg-[#0f1217] border-l border-[#212833] flex flex-col justify-between select-none">
      {/* Cart Ticket Header */}
      <div className="p-5 border-b border-[#212833]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#fed428]" />
            <h2 className="text-lg font-black text-white tracking-wider">Cart</h2>
          </div>
          <div className="text-right">
            <span className="text-[11px] text-gray-400 block font-semibold">TICKET NO.</span>
            <span className="text-xs font-mono font-bold text-[#0ca1e1]">
              #{transactionId}
            </span>
          </div>
        </div>
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-500">
            <div className="w-16 h-16 rounded-2xl bg-[#151a21] border border-[#212833] flex items-center justify-center mb-3">
              <ShoppingBag className="w-8 h-8 text-gray-600" />
            </div>
            <p className="font-bold text-gray-400 text-sm">Cart is currently empty</p>
            <p className="text-xs text-gray-600 mt-1 max-w-[200px]">
              Tap any dish from the menu grid on the left to start an order.
            </p>
          </div>
        ) : (
          cart.map((item) => (
            <div
              key={item.cartId}
              className="bg-[#151a21] border border-[#212833] rounded-2xl p-3.5 transition-all hover:border-[#2f3948]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-white text-sm truncate">{item.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                    <span className="text-[#fed428] font-mono font-bold">₱{Number(item.price).toFixed(2)}</span>
                    {item.spiceLevel && item.spiceLevel !== 'None' && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60 font-semibold">
                        {item.spiceLevel}
                      </span>
                    )}
                  </div>
                  {item.addons && item.addons.length > 0 && (
                    <div className="text-[10px] text-gray-400 mt-1 flex flex-wrap gap-1">
                      {item.addons.map((ad) => (
                        <span key={ad} className="bg-[#0f1217] px-1.5 py-0.5 rounded text-gray-300 border border-[#212833]">
                          +{ad}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Total Line Price */}
                <span className="font-black text-white font-mono text-sm">
                  ₱{(item.price * item.qty).toFixed(2)}
                </span>
              </div>

              {/* Stepper & Void Controls */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-[#212833]/70">
                <div className="flex items-center gap-2 bg-[#0c0e11] px-2 py-1 rounded-xl border border-[#212833]">
                  <button
                    onClick={() => onUpdateQty(item.cartId, -1)}
                    className="w-6 h-6 rounded-lg bg-[#18202b] hover:bg-[#222c3b] active:scale-95 text-white flex items-center justify-center transition-all"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono font-extrabold text-sm text-white w-6 text-center">
                    {item.qty}
                  </span>
                  <button
                    onClick={() => onUpdateQty(item.cartId, 1)}
                    className="w-6 h-6 rounded-lg bg-[#18202b] hover:bg-[#222c3b] active:scale-95 text-white flex items-center justify-center transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Void / Remove Button */}
                <button
                  onClick={() => onRemoveItem(item.cartId)}
                  className="flex items-center gap-1 text-xs text-rose-400/80 hover:text-rose-300 p-1.5 rounded-lg hover:bg-rose-950/40 transition-all font-semibold"
                  title="Void Item"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Void</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Payment CTA */}
      <div className="p-5 border-t border-[#212833] bg-[#0c0e11]/80 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400 font-semibold">
          <span>Items Ordered</span>
          <span className="text-white font-bold">{totalItemsCount}</span>
        </div>

        <div className="flex items-center justify-between text-base">
          <span className="font-bold text-gray-300">Sub Total</span>
          <span className="font-black text-2xl text-[#fed428] font-mono">
            ₱{subtotal.toFixed(2)}
          </span>
        </div>

        {cart.length > 0 && (
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={onClearCart}
              className="py-3 px-4 rounded-xl bg-[#151a21] hover:bg-[#1e2530] text-gray-400 hover:text-white border border-[#212833] text-xs font-bold transition-all"
            >
              Clear
            </button>
            <button
              onClick={onOpenPayment}
              className="flex-1 py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#fed428] to-[#e6ba15] hover:brightness-105 active:scale-98 text-black font-black text-base shadow-xl shadow-[#fed428]/20 flex items-center justify-center gap-2 transition-all tracking-wide"
            >
              <span>PAYMENT</span>
              <ArrowRight className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
