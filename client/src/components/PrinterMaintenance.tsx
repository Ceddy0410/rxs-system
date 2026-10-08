import React, { useState } from 'react';
import { Printer, AlertOctagon, CheckCircle2, RefreshCw, Play, FileText, Wrench } from 'lucide-react';
import { apiFetch } from '../apiConfig';

interface PrinterMaintenanceProps {
  printerStatus: { connected: boolean; paperReady: boolean; printerModel?: string; jobsCount?: number };
  onRefreshStatus: () => void;
}

export const PrinterMaintenance: React.FC<PrinterMaintenanceProps> = ({
  printerStatus,
  onRefreshStatus
}) => {
  const [testResult, setTestResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTestPrint = async () => {
    setLoading(true);
    setTestResult(null);
    setErrorMsg(null);
    try {
      const res = await apiFetch('/api/printer/test', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setTestResult(data.rawReceipt);
      } else {
        setErrorMsg(data.error || 'Failed to print test receipt');
      }
    } catch (err: any) {
      // Offline Demo Fallback
      setTestResult(`==========================================
             RXS RESTAURANT               
     Delicious Dining & Specialties       
           Tel: 0912-345-6789             
==========================================
Date/Time: ${new Date().toLocaleString()}
Cashier  : Tablet Cashier (Offline Demo)
Receipt #: TEST-OFFLINE-${Math.floor(100000 + Math.random() * 900000)}
==========================================
QTY  ITEM                     PRICE  TOTAL
------------------------------------------
  1  Kuro Ramen               250    250
     [Spice: Mild]
  1  Matcha Frappe             95     95
------------------------------------------
Sub Total     :              PHP     345.00
TOTAL DUE     :              PHP     345.00
==========================================
Payment Method: Cash (Test)
Amount Tender :              PHP     500.00
Change        :              PHP     155.00
------------------------------------------
   Thank you for dining at RXS Restaurant! 
           Please visit again!             
       *** RXS RESTAURANT POS ***          
==========================================`);
    } finally {
      setLoading(false);
      try { onRefreshStatus(); } catch (e) {}
    }
  };

  const handleTogglePaper = async () => {
    try {
      await apiFetch('/api/printer/toggle-paper', { method: 'POST' });
      onRefreshStatus();
    } catch (e) {}
  };

  const handleToggleConnection = async () => {
    try {
      await apiFetch('/api/printer/toggle-connection', { method: 'POST' });
      onRefreshStatus();
    } catch (e) {}
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0c0e11] p-6 overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#212833]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white tracking-wide">
              Thermal Receipt Printer & Maintenance
            </h2>
            <p className="text-xs text-gray-400">
              Hardware diagnostics, paper feed monitoring, and error protection
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshStatus}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#151a21] hover:bg-[#1f2633] text-gray-300 hover:text-white border border-[#212833] text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Hardware Status</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-6">
        {/* Diagnostic Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Connection Card */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between ${
            printerStatus.connected
              ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-400'
              : 'bg-rose-950/30 border-rose-800 text-rose-300'
          }`}>
            <div>
              <span className="text-xs font-bold block uppercase tracking-wider opacity-75">
                Cable / Port Status
              </span>
              <span className="text-xl font-black">
                {printerStatus.connected ? 'ONLINE & CONNECTED' : 'DISCONNECTED / NO SIGNAL'}
              </span>
              <p className="text-[11px] opacity-75 mt-0.5">
                {printerStatus.connected ? 'USB / LAN Communication OK' : 'Check USB cable or power adapter'}
              </p>
            </div>
            {printerStatus.connected ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : (
              <AlertOctagon className="w-8 h-8 text-rose-400" />
            )}
          </div>

          {/* Paper Roll Card */}
          <div className={`p-5 rounded-2xl border flex items-center justify-between ${
            printerStatus.paperReady
              ? 'bg-emerald-950/20 border-emerald-800/60 text-emerald-400'
              : 'bg-amber-950/30 border-amber-800 text-amber-300'
          }`}>
            <div>
              <span className="text-xs font-bold block uppercase tracking-wider opacity-75">
                Thermal Paper Roll
              </span>
              <span className="text-xl font-black">
                {printerStatus.paperReady ? 'PAPER READY (80mm)' : 'PAPER OUT / COVER OPEN'}
              </span>
              <p className="text-[11px] opacity-75 mt-0.5">
                {printerStatus.paperReady ? 'Standard 80mm roll detected' : 'Please insert new thermal paper roll'}
              </p>
            </div>
            {printerStatus.paperReady ? (
              <FileText className="w-8 h-8" />
            ) : (
              <AlertOctagon className="w-8 h-8 text-amber-400" />
            )}
          </div>

          {/* Model & Engine */}
          <div className="bg-[#151a21] border border-[#212833] p-5 rounded-2xl">
            <span className="text-xs font-bold block uppercase tracking-wider text-gray-400">
              Printer Driver Engine
            </span>
            <span className="text-xl font-black text-white font-mono">
              ESC/POS Direct Engine
            </span>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Zero driver dependency • Epson/Xprinter/Star
            </p>
          </div>
        </div>

        {/* Error Simulation & Diagnostics Area */}
        <div className="bg-[#151a21] border border-[#212833] rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Wrench className="w-5 h-5 text-[#fed428]" />
            <h3 className="text-base font-bold text-white">
              Hardware Testing & Error Simulation
            </h3>
          </div>
          <p className="text-xs text-gray-400 mb-5 max-w-2xl leading-relaxed">
            Test how the cashier terminal behaves when common physical errors happen (like paper running out during busy store hours). The system prevents lost transactions and prompts the cashier immediately.
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTestPrint}
              disabled={loading}
              className="px-5 py-3 rounded-xl bg-[#fed428] text-black font-extrabold text-xs shadow-lg shadow-[#fed428]/20 hover:brightness-105 active:scale-98 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>{loading ? 'Printing...' : 'Run Test Print'}</span>
            </button>

            <button
              onClick={handleTogglePaper}
              className="px-5 py-3 rounded-xl bg-[#0c0e11] hover:bg-[#18202b] text-gray-300 border border-[#212833] font-bold text-xs transition-all"
            >
              Simulate: {printerStatus.paperReady ? 'Paper Out' : 'Reload Paper'}
            </button>

            <button
              onClick={handleToggleConnection}
              className="px-5 py-3 rounded-xl bg-[#0c0e11] hover:bg-[#18202b] text-gray-300 border border-[#212833] font-bold text-xs transition-all"
            >
              Simulate: {printerStatus.connected ? 'Disconnect Cable' : 'Reconnect Cable'}
            </button>
          </div>

          {/* Test Print Output Preview */}
          {errorMsg && (
            <div className="mt-5 p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {testResult && (
            <div className="mt-5">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Raw ESC/POS Thermal Buffer Sent to Device:
              </h4>
              <pre className="p-4 rounded-xl bg-white text-black font-mono text-xs overflow-x-auto border border-gray-300 shadow-inner">
                {testResult}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
