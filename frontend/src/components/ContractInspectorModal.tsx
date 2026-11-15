import React, { useState } from 'react';
import {
  Check,
  Code2,
  Copy,
  Download,
  Loader2,
  PlugZap,
  RefreshCw,
  X,
} from 'lucide-react';
import { useFarm } from '../context/FarmContext';

interface ContractInspectorModalProps {
  open: boolean;
  onClose: () => void;
}

export const ContractInspectorModal: React.FC<ContractInspectorModalProps> = ({
  open,
  onClose,
}) => {
  const {
    contractRequest,
    contractResponse,
    contractSource,
    apiEndpoint,
    isSyncingApi,
    lastApiError,
    setApiEndpoint,
    syncContractWithBackend,
    showToast,
  } = useFarm();

  const [activeTab, setActiveTab] = useState<'both' | 'request' | 'response'>('both');
  const [urlInput, setUrlInput] = useState(apiEndpoint);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  const fullEnvelope = {
    request: contractRequest,
    response: contractResponse,
  };

  const jsonToDisplay =
    activeTab === 'request'
      ? JSON.stringify(contractRequest, null, 2)
      : activeTab === 'response'
        ? JSON.stringify(contractResponse, null, 2)
        : JSON.stringify(fullEnvelope, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonToDisplay);
      setCopied(true);
      showToast('Copied contract JSON to clipboard.');
      setTimeout(() => setCopied(false), 1800);
    } catch {
      showToast('Copy failed. Select JSON manually.');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(fullEnvelope, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tadawol-contract-live.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConnectAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiEndpoint(urlInput.trim());
    await syncContractWithBackend(urlInput.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-[#111111]/65 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#FFFEFB] border border-[#D9D9D9] rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#111111] text-white px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#EBB40E] text-[#111111] flex items-center justify-center">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">
                Shared API Contract (`contract.json`)
              </h2>
              <p className="text-xs text-white/75">
                Live frontend-to-backend payload matching your team&apos;s exact schema
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                contractSource === 'remote-api'
                  ? 'bg-[#92D500] text-[#111111]'
                  : 'bg-white/15 text-white'
              }`}
            >
              {contractSource === 'remote-api' ? 'Connected Live API' : 'Local Simulator'}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Optional Colleague Backend Endpoint Connector */}
        <form
          onSubmit={handleConnectAndSync}
          className="px-6 py-3.5 bg-[#F5F4F0] border-b border-[#DFDDD6] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
        >
          <div className="flex items-center gap-2 text-xs font-bold text-[#111111] shrink-0">
            <PlugZap className="w-4 h-4 text-[#00873A]" />
            <span>Backend Endpoint:</span>
          </div>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Optional POST URL (e.g. http://localhost:8000/api/optimize) or leave blank for simulator"
            className="flex-1 px-3 py-2 bg-white border border-[#D1D1D1] rounded-lg font-mono-tech text-xs focus:outline-none focus:border-[#00873A]"
          />
          <button
            type="submit"
            disabled={isSyncingApi}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#00873A] hover:bg-[#111111] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
          >
            {isSyncingApi ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            POST Request
          </button>
        </form>

        {lastApiError && (
          <div className="px-6 py-2 bg-[#FCE9E4] text-[#812411] text-xs font-medium border-b border-[#F3C5B9]">
            Remote endpoint notice: {lastApiError}. Showing schema-valid local simulation.
          </div>
        )}

        {/* Tab Strip & Export Actions */}
        <div className="px-6 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-[#EFECE6] bg-white">
          <div className="inline-flex bg-[#F5F4F0] p-1 rounded-full border border-[#D9D9D9]">
            {(
              [
                { id: 'both', label: 'Full contract.json' },
                { id: 'request', label: 'request' },
                { id: 'response', label: 'response' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                  activeTab === t.id
                    ? 'bg-[#111111] text-white'
                    : 'text-[#474747] hover:text-[#111111]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F4F0] hover:bg-[#EBB40E] border border-[#D9D9D9] text-xs font-bold text-[#111111] transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-[#00873A]" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy JSON'}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111111] text-white hover:bg-[#00873A] text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>
          </div>
        </div>

        {/* JSON Payload Viewer */}
        <div className="flex-1 overflow-auto bg-[#161816] text-[#E6F4EA] p-5">
          <pre className="font-mono-tech text-xs leading-relaxed whitespace-pre">
            {jsonToDisplay}
          </pre>
        </div>

        {/* Footer note referencing shared file paths */}
        <div className="px-6 py-3 bg-[#F5F4F0] border-t border-[#DFDDD6] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#474747]">
          <span>
            Schema files: <code className="font-mono-tech font-bold text-[#111111]">src/contracts/contract.json</code> ·{' '}
            <code className="font-mono-tech font-bold text-[#111111]">src/api/tadawolContract.ts</code> ·{' '}
            <code className="font-mono-tech font-bold text-[#111111]">src/api/tadawolClient.ts</code>
          </span>
          <span className="font-mono-tech text-[#00873A] font-bold">
            region_validated: {String(contractResponse.region_validated)}
          </span>
        </div>
      </div>
    </div>
  );
};
