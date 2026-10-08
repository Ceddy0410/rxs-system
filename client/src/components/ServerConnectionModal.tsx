import React, { useState } from 'react';
import { Wifi, X, Check, RefreshCw, Server, AlertCircle } from 'lucide-react';
import { getServerUrl } from '../apiConfig';

interface ServerConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  isSocketConnected: boolean;
  onServerChanged: () => void;
}

export const ServerConnectionModal: React.FC<ServerConnectionModalProps> = ({
  isOpen,
  onClose,
  isSocketConnected,
  onServerChanged
}) => {
  const currentUrl = getServerUrl();
  const [serverInput, setServerInput] = useState<string>(currentUrl || 'http://192.168.1.66:3001');
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [testMessage, setTestMessage] = useState<string>('');

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Pinging server...');
    const target = serverInput.trim().replace(/\/+$/, '');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${target}/api/status`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        setTestStatus('success');
        setTestMessage(`Connected to ${data.system || 'RXS POS Server'} (${data.dbEngine || 'DB Ready'})`);
      } else {
        setTestStatus('failed');
        setTestMessage(`Server responded with status ${res.status}`);
      }
    } catch (e: any) {
      setTestStatus('failed');
      setTestMessage('Could not reach server. Verify IP and that both devices are on the same Wi-Fi.');
    }
  };

  const handleSave = () => {
    const formatted = serverInput.trim().replace(/\/+$/, '');
    if (formatted) {
      localStorage.setItem('rxs_server_url', formatted);
    } else {
      localStorage.removeItem('rxs_server_url');
    }
    onServerChanged();
    onClose();
  };

  const handleResetToLaptop = () => {
    setServerInput('http://192.168.1.66:3001');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-[#151a21] border border-[#2b3543] w-full max-w-md rounded-3xl p-6 shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#212833]">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              isSocketConnected 
                ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' 
                : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
            }`}>
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Server Connection Settings</h3>
              <p className="text-[11px] text-gray-400">
                Connect this tablet to the main Cashier station
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-[#0c0e11] hover:bg-[#202733] border border-[#212833] text-gray-400 hover:text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Status */}
        <div className="mt-4 p-3.5 rounded-2xl bg-[#0c0e11] border border-[#212833]">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400 font-semibold">Active Sync Status:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold flex items-center gap-1.5 ${
              isSocketConnected 
                ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                : 'bg-rose-950/60 text-rose-400 border border-rose-800'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isSocketConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`}></span>
              {isSocketConnected ? 'CONNECTED TO HOST' : 'OFFLINE (STANDALONE)'}
            </span>
          </div>
        </div>

        {/* Input */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-bold text-gray-300 block mb-1">
              Host Server IP / Address:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={serverInput}
                onChange={(e) => {
                  setServerInput(e.target.value);
                  setTestStatus('idle');
                }}
                placeholder="http://192.168.1.66:3001"
                className="flex-1 bg-[#0c0e11] border border-[#212833] focus:border-[#0ca1e1] rounded-xl px-3.5 py-2.5 text-white font-mono text-xs outline-none"
              />
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testStatus === 'testing'}
                className="px-3 py-2.5 rounded-xl bg-[#151a21] hover:bg-[#202733] border border-[#2b3543] text-gray-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#0ca1e1] ${testStatus === 'testing' ? 'animate-spin' : ''}`} />
                <span>Test</span>
              </button>
            </div>
          </div>

          {/* Quick Preset */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500">Quick set:</span>
            <button
              type="button"
              onClick={handleResetToLaptop}
              className="px-2.5 py-1 rounded-lg bg-[#0c0e11] hover:bg-[#1a212b] border border-[#212833] text-[10px] font-mono font-bold text-amber-400 transition-all cursor-pointer active:scale-95"
            >
              💻 Ceddy Laptop (192.168.1.66:3001)
            </button>
          </div>

          {/* Test Result Feedback */}
          {testStatus !== 'idle' && (
            <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
              testStatus === 'success'
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : testStatus === 'testing'
                ? 'bg-[#0c0e11] border-[#212833] text-gray-300'
                : 'bg-rose-950/40 border-rose-800 text-rose-300'
            }`}>
              {testStatus === 'success' && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
              {testStatus === 'failed' && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
              {testStatus === 'testing' && <RefreshCw className="w-4 h-4 text-gray-400 animate-spin shrink-0" />}
              <span className="text-[11px]">{testMessage}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-6 pt-3 border-t border-[#212833]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#0c0e11] hover:bg-[#1a212b] border border-[#212833] text-gray-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 rounded-xl bg-[#0ca1e1] hover:bg-[#0ca1e1]/90 text-black text-xs font-black transition-all cursor-pointer shadow-lg shadow-[#0ca1e1]/20 flex items-center gap-1.5 active:scale-95"
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Save & Connect</span>
          </button>
        </div>
      </div>
    </div>
  );
};
