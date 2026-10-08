import React from 'react';
import { Printer, CheckCircle2, X } from 'lucide-react';
import type { Order } from '../types';

interface ReceiptModalProps {
  order: Order;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#151a21] border border-[#2b3543] w-full max-w-md rounded-3xl p-6 shadow-2xl shadow-black flex flex-col max-h-[90vh]">
        {/* Top Status */}
        <div className="flex items-center justify-between border-b border-[#212833] pb-4">
          <div className="flex items-center gap-2 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
            <h3 className="font-extrabold text-base text-white">Payment Successful</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#0f1217] hover:bg-[#1f2633] text-gray-400 hover:text-white flex items-center justify-center border border-[#212833]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Visual Preview (58mm Mini Printer Width) */}
        <div className="flex items-center justify-between mt-3 px-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            Receipt Preview
          </span>
          <span className="text-[10px] font-bold text-[#fed428] bg-[#fed428]/10 border border-[#fed428]/30 px-2 py-0.5 rounded-md font-mono">
            58mm Mini Printer
          </span>
        </div>

        <div className="flex-1 overflow-y-auto my-2 p-3 bg-white text-black font-mono text-xs rounded-xl shadow-inner border border-gray-300 max-w-[320px] mx-auto w-full">
          <div id="thermal-receipt" className="space-y-1.5 leading-tight text-[11px]">
            <div className="flex flex-col items-center justify-center text-center pb-1">
              <img
                src="/images/rxs_logo.png"
                alt="RXS Restaurant Logo"
                className="w-14 h-14 object-contain mb-1"
              />
              <div className="font-black text-sm tracking-wider uppercase">
                RXS RESTAURANT
              </div>
              <div className="text-[10px] font-semibold text-gray-700">
                Authentic Dining & Specialties
              </div>
              <div className="text-[10px] text-gray-600">
                Tel: 0912-345-6789
              </div>
              <div className="text-gray-400 font-normal">
                --------------------------------
              </div>
            </div>

            <div className="text-[10px] pt-0.5 space-y-0.5">
              <div>Date : {new Date(order.createdAt).toLocaleString()}</div>
              <div>OR # : {order.transactionId}</div>
              <div>Staff: {order.cashier}</div>
            </div>

            <div className="border-t border-b border-dashed border-gray-400 py-1 font-bold flex justify-between">
              <span>ITEM</span>
              <span>TOTAL</span>
            </div>

            <div className="space-y-1 py-1">
              {order.items.map((it, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between">
                    <span>
                      {it.qty}x {it.name}
                    </span>
                    <span>₱{(it.price * it.qty).toFixed(2)}</span>
                  </div>
                  {it.spiceLevel && it.spiceLevel !== 'None' && (
                    <div className="text-[10px] text-gray-600 pl-3">
                      - Spice: {it.spiceLevel}
                    </div>
                  )}
                  {it.addons && it.addons.length > 0 && (
                    <div className="text-[10px] text-gray-600 pl-3">
                      - {it.addons.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="border-t border-dashed border-gray-400 pt-1 space-y-0.5">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>₱{order.subtotal.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between">
                  <span>Disc ({order.discountType}):</span>
                  <span>-₱{order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-400">
                <span>TOTAL DUE:</span>
                <span>₱{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-dashed border-gray-400 pt-1 space-y-0.5 text-[11px]">
              <div className="flex justify-between">
                <span>Payment:</span>
                <span>{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Tendered:</span>
                <span>₱{order.amountPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Change:</span>
                <span>₱{order.changeAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center font-bold pt-3 pb-1 text-[11px]">
              Thank you for dining at RXS Restaurant!<br />
              Please visit again.<br />
              *** RXS RESTAURANT POS ***
            </div>
          </div>
        </div>

        {/* Modal Print & Finish Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 rounded-xl bg-[#18202b] hover:bg-[#222c3b] text-white border border-[#212833] font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md"
          >
            <Printer className="w-4 h-4 text-[#0ca1e1]" />
            <span>Print Receipt</span>
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-[#fed428] text-black font-extrabold text-sm hover:brightness-105 shadow-lg shadow-[#fed428]/20 transition-all"
          >
            Done (New Order)
          </button>
        </div>
      </div>
    </div>
  );
};
