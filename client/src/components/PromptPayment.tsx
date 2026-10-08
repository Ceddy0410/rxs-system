import React, { useState } from 'react';
import { X, Banknote, Smartphone, Check, AlertCircle } from 'lucide-react';
import type { CartItem } from '../types';

interface PromptPaymentProps {
  cart: CartItem[];
  transactionId: string;
  onClose: () => void;
  onCompletePayment: (paymentDetails: {
    paymentMethod: string;
    discountType: string;
    discountAmount: number;
    subtotal: number;
    totalAmount: number;
    amountPaid: number;
    changeAmount: number;
  }) => void;
}

export const PromptPayment: React.FC<PromptPaymentProps> = ({
  cart,
  transactionId,
  onClose,
  onCompletePayment
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'Cash' | 'GCash'>('Cash');
  const [discountType, setDiscountType] = useState<string>('None');
  const [idNumber, setIdNumber] = useState<string>('');
  const [amountPaidInput, setAmountPaidInput] = useState<string>('');

  const subtotal = cart.reduce((acc, it) => acc + it.price * it.qty, 0);

  // Discount calculation
  let discountPercentage = 0;
  if (discountType === 'Senior Citizen' || discountType === 'PWD') {
    discountPercentage = 0.20; // 20%
  } else if (discountType === 'Special Promo') {
    discountPercentage = 0.10; // 10%
  }

  const discountAmount = subtotal * discountPercentage;
  const totalAmountDue = Math.max(0, subtotal - discountAmount);

  const amountPaidNumber = parseFloat(amountPaidInput) || 0;
  const change = Math.max(0, amountPaidNumber - totalAmountDue);
  const isSufficient = selectedMethod === 'GCash' ? true : amountPaidNumber >= totalAmountDue;

  // Quick Preset Bills
  const handleQuickCash = (amount: number) => {
    setAmountPaidInput(String(amount));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSufficient) return;

    onCompletePayment({
      paymentMethod: selectedMethod,
      discountType,
      discountAmount,
      subtotal,
      totalAmount: totalAmountDue,
      amountPaid: selectedMethod === 'GCash' ? totalAmountDue : amountPaidNumber,
      changeAmount: selectedMethod === 'GCash' ? 0 : change
    });
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#151a21] border border-[#2b3543] w-full max-w-2xl rounded-3xl p-6 shadow-2xl shadow-black animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#212833] pb-4">
          <div>
            <h2 className="text-xl font-black text-white tracking-wider flex items-center gap-2">
              Payment & Tender
            </h2>
            <p className="text-xs text-gray-400 mt-0.5 font-mono">
              Transaction OR #: <span className="text-[#0ca1e1] font-bold">#{transactionId}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-[#0f1217] hover:bg-[#1f2633] text-gray-400 hover:text-white flex items-center justify-center transition-all border border-[#212833]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">
          {/* Left Column: Method & Bill Totals */}
          <div className="space-y-4">
            {/* Payment Method Selector */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('Cash')}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    selectedMethod === 'Cash'
                      ? 'bg-[#fed428]/15 border-[#fed428] text-[#fed428] shadow-lg shadow-[#fed428]/10 font-bold scale-[1.02]'
                      : 'bg-[#0f1217] border-[#212833] text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Banknote className="w-7 h-7" />
                  <span className="text-sm font-bold">Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('GCash')}
                  className={`p-4 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all ${
                    selectedMethod === 'GCash'
                      ? 'bg-[#0ca1e1]/15 border-[#0ca1e1] text-[#0ca1e1] shadow-lg shadow-[#0ca1e1]/10 font-bold scale-[1.02]'
                      : 'bg-[#0f1217] border-[#212833] text-gray-400 hover:text-white hover:border-gray-600'
                  }`}
                >
                  <Smartphone className="w-7 h-7" />
                  <span className="text-sm font-bold">GCash / Card</span>
                </button>
              </div>
            </div>

            {/* Discounts Dropdown */}
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                Apply Discount
              </label>
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value)}
                className="w-full bg-[#0f1217] border border-[#212833] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#0ca1e1]"
              >
                <option value="None">None (Standard Rate)</option>
                <option value="Senior Citizen">Senior Citizen (20% Off)</option>
                <option value="PWD">PWD (20% Off)</option>
                <option value="Special Promo">Special Promo (10% Off)</option>
              </select>

              {(discountType === 'Senior Citizen' || discountType === 'PWD') && (
                <div className="mt-2.5">
                  <input
                    type="text"
                    placeholder="Enter Senior / PWD ID Number..."
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    className="w-full bg-[#0f1217] border border-[#212833] rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#0ca1e1]"
                  />
                </div>
              )}
            </div>

            {/* Bill Summary Box */}
            <div className="bg-[#0c0e11] border border-[#212833] rounded-2xl p-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Subtotal:</span>
                <span className="font-mono text-white">₱{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-400">
                  <span>Discount ({discountType}):</span>
                  <span className="font-mono">-₱{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-[#212833]">
                <span className="text-gray-200">TOTAL DUE:</span>
                <span className="text-2xl font-black text-[#fed428] font-mono">
                  ₱{totalAmountDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Tender Numpad & Quick Cash */}
          <div className="space-y-4">
            {selectedMethod === 'Cash' ? (
              <>
                <div>
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                    Amount Tendered (Cash Paid)
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-gray-500 font-mono">
                      ₱
                    </span>
                    <input
                      type="number"
                      step="any"
                      placeholder="0.00"
                      value={amountPaidInput}
                      onChange={(e) => setAmountPaidInput(e.target.value)}
                      className="w-full bg-[#0c0e11] border border-[#212833] rounded-2xl pl-9 pr-4 py-3 text-2xl font-black text-white font-mono focus:outline-none focus:border-[#fed428]"
                    />
                  </div>
                </div>

                {/* Quick Bills Buttons */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickCash(totalAmountDue)}
                    className="py-2 rounded-xl bg-[#18202b] hover:bg-[#222c3b] border border-[#212833] text-xs font-bold text-[#fed428] transition-all"
                  >
                    Exact
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(200)}
                    className="py-2 rounded-xl bg-[#18202b] hover:bg-[#222c3b] border border-[#212833] text-xs font-bold text-gray-300 transition-all font-mono"
                  >
                    ₱200
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(500)}
                    className="py-2 rounded-xl bg-[#18202b] hover:bg-[#222c3b] border border-[#212833] text-xs font-bold text-gray-300 transition-all font-mono"
                  >
                    ₱500
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(1000)}
                    className="py-2 rounded-xl bg-[#18202b] hover:bg-[#222c3b] border border-[#212833] text-xs font-bold text-gray-300 transition-all font-mono"
                  >
                    ₱1,000
                  </button>
                </div>

                {/* Change Calculator Banner */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                  amountPaidNumber >= totalAmountDue
                    ? 'bg-emerald-950/30 border-emerald-800 text-emerald-400'
                    : 'bg-rose-950/30 border-rose-900/60 text-rose-300'
                }`}>
                  <div>
                    <span className="text-xs font-bold block opacity-80 uppercase tracking-wider">
                      {amountPaidNumber >= totalAmountDue ? 'Change' : 'Pending Balance'}
                    </span>
                    <span className="text-2xl font-black font-mono">
                      ₱{amountPaidNumber >= totalAmountDue ? change.toFixed(2) : (totalAmountDue - amountPaidNumber).toFixed(2)}
                    </span>
                  </div>
                  {amountPaidNumber >= totalAmountDue ? (
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Check className="w-6 h-6 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[#0c0e11] rounded-2xl border border-[#212833]">
                <div className="w-16 h-16 rounded-full bg-[#0ca1e1]/20 flex items-center justify-center text-[#0ca1e1] mb-3">
                  <Smartphone className="w-8 h-8" />
                </div>
                <h4 className="font-bold text-white text-base">GCash / Digital Tender</h4>
                <p className="text-xs text-gray-400 mt-1 max-w-xs">
                  Scan QR code or confirm exact digital transaction of{' '}
                  <span className="text-[#0ca1e1] font-bold font-mono">₱{totalAmountDue.toFixed(2)}</span>
                </p>
                <div className="mt-4 px-3 py-1.5 rounded-lg bg-[#18202b] text-[11px] text-gray-400 font-mono">
                  Ref: GCASH-{Date.now().toString().slice(-6)}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Submit CTA */}
        <div className="mt-6 pt-4 border-t border-[#212833] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3.5 rounded-xl bg-[#0f1217] text-gray-400 hover:text-white border border-[#212833] font-bold text-sm transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isSufficient}
            className={`px-8 py-3.5 rounded-xl font-black text-sm tracking-wide shadow-xl flex items-center gap-2 transition-all ${
              isSufficient
                ? 'bg-gradient-to-r from-[#fed428] to-[#e6ba15] text-black hover:brightness-105 active:scale-98 shadow-[#fed428]/20 cursor-pointer'
                : 'bg-gray-800 text-gray-500 border border-gray-700 cursor-not-allowed'
            }`}
          >
            <span>CONFIRM & PRINT RECEIPT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
