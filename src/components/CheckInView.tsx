import React, { useState, useRef } from 'react';
import type { TeamMember, AppConfig, TaxOption } from '../types';
import { FilePlus, AlertTriangle, Upload, X, Image } from 'lucide-react';
import { formatAmount } from './InvoiceTable';

interface CheckInViewProps {
  currentUser: TeamMember | null;
  config: AppConfig;
  onSubmit: (invoiceData: {
    vendor: string;
    invoiceNumber: string;
    invoiceDate: string;
    taxableAmount: number;
    taxOption: TaxOption;
    taxAmount: number;
    amount: number;
    poNumber: string;
    bankLast4: string;
    description: string;
    invoiceImage: string | null;
  }) => void;
}

export const CheckInView: React.FC<CheckInViewProps> = ({
  currentUser,
  config,
  onSubmit,
}) => {
  const [vendor, setVendor] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [taxableAmount, setTaxableAmount] = useState('');
  const [taxOption, setTaxOption] = useState<TaxOption>('IGST');
  const [poNumber, setPoNumber] = useState('');
  const [bankLast4, setBankLast4] = useState('');
  const [description, setDescription] = useState('');
  const [invoiceImage, setInvoiceImage] = useState<string | null>(null);
  const [imageFileName, setImageFileName] = useState<string>('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto tax calculations
  const parsedTaxable = parseFloat(taxableAmount) || 0;
  const calculatedTax = parsedTaxable > 0 ? parsedTaxable * 0.18 : 0;
  const calculatedTotal = parsedTaxable + calculatedTax;

  const handleFileRead = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInvoiceImage(ev.target?.result as string);
      setImageFileName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileRead(file);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (!vendor || !invoiceNumber || !invoiceDate || parsedTaxable <= 0) return;

    onSubmit({
      vendor,
      invoiceNumber,
      invoiceDate,
      taxableAmount: parsedTaxable,
      taxOption,
      taxAmount: calculatedTax,
      amount: calculatedTotal,
      poNumber,
      bankLast4,
      description,
      invoiceImage,
    });

    // Reset form
    setVendor('');
    setInvoiceNumber('');
    setInvoiceDate('');
    setTaxableAmount('');
    setTaxOption('IGST');
    setPoNumber('');
    setBankLast4('');
    setDescription('');
    setInvoiceImage(null);
    setImageFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const disabled = !currentUser;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h2 className="text-xl font-heading font-bold text-ink-dark flex items-center gap-2">
        <FilePlus size={18} className="text-brass" />
        Check In an Invoice
      </h2>

      {!currentUser && (
        <div className="border border-red/20 bg-red/5 p-4 rounded-lg text-xs sm:text-sm text-red font-medium flex items-start gap-2.5">
          <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
          <span>
            You must be logged in to check in an invoice.
          </span>
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="w-full bg-white border border-slate-200/60 rounded-lg p-6 sm:p-8 shadow-sm space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
              Vendor Name *
            </label>
            <input
              type="text"
              required
              disabled={disabled}
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="e.g. Acme Corp"
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-400 border border-slate-200/80 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass transition-all text-ink-dark placeholder-slate-400 shadow-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
              Invoice Number *
            </label>
            <input
              type="text"
              required
              disabled={disabled}
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="e.g. INV-2024-001"
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-400 border border-slate-200/80 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass transition-all text-ink-dark placeholder-slate-400 shadow-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
              Invoice Date *
            </label>
            <input
              type="date"
              required
              disabled={disabled}
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-400 border border-slate-200/80 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass transition-all text-ink-dark shadow-sm cursor-pointer"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
              Taxable Amount ({config.currency}) *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              disabled={disabled}
              value={taxableAmount}
              onChange={(e) => setTaxableAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-400 border border-slate-200/80 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass transition-all text-ink-dark placeholder-slate-400 shadow-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
              Tax Option *
            </label>
            <select
              disabled={disabled}
              value={taxOption}
              onChange={(e) => setTaxOption(e.target.value as TaxOption)}
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-400 border border-slate-200/80 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass transition-all text-ink-dark shadow-sm cursor-pointer"
            >
              <option value="IGST">IGST (18%)</option>
              <option value="CGST_SGST">CGST + SGST (9% + 9%)</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
              Total Amount (Calculated)
            </label>
            <input
              type="text"
              readOnly
              value={formatAmount(calculatedTotal, config.currency)}
              className="w-full bg-slate-100/90 text-ink-dark font-mono font-bold border border-slate-300 rounded px-3 py-2 text-xs sm:text-sm shadow-sm cursor-not-allowed select-none"
            />
            {parsedTaxable > 0 && (
              <p className="text-xs text-slate-600 mt-1 font-mono">
                {taxOption === 'IGST' ? (
                  <span>Tax (18% IGST): +{formatAmount(calculatedTax, config.currency)}</span>
                ) : (
                  <span>Tax (9% CGST + 9% SGST): +{formatAmount(calculatedTax / 2, config.currency)} + {formatAmount(calculatedTax / 2, config.currency)}</span>
                )}
              </p>
            )}
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
              PO Number (optional)
            </label>
            <input
              type="text"
              disabled={disabled}
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              placeholder="e.g. PO-99882"
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-400 border border-slate-200/80 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass transition-all text-ink-dark placeholder-slate-400 shadow-sm"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
              Vendor Bank — last 4 digits (optional)
            </label>
            <input
              type="text"
              disabled={disabled}
              value={bankLast4}
              onChange={(e) => setBankLast4(e.target.value)}
              maxLength={4}
              pattern="[0-9]{4}"
              placeholder="e.g. 1234"
              className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-400 border border-slate-200/80 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass transition-all text-ink-dark placeholder-slate-400 shadow-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
            Description
          </label>
          <textarea
            disabled={disabled}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Describe the transaction parameters..."
            className="w-full bg-white disabled:bg-slate-50 disabled:text-slate-400 border border-slate-200/80 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass transition-all text-ink-dark placeholder-slate-400 resize-y shadow-sm"
          />
        </div>

        {/* Invoice Image Upload */}
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 block">
            Invoice Image / Scan
          </label>
          {invoiceImage ? (
            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm bg-white">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-100">
                <span className="flex items-center gap-1.5 text-xs font-medium text-ink-dark">
                  <Image size={13} className="text-brass" />
                  {imageFileName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setInvoiceImage(null);
                    setImageFileName('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-slate hover:text-red transition-colors p-1 rounded cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>
              <img
                src={invoiceImage}
                alt="Invoice preview"
                className="max-h-52 w-full object-contain bg-white p-2"
              />
            </div>
          ) : (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => !disabled && fileInputRef.current?.click()}
              className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-8 transition-all cursor-pointer select-none ${
                dragOver
                  ? 'border-brass bg-brass/5'
                  : disabled
                  ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                  : 'border-slate-200 hover:border-brass hover:bg-brass/5 bg-white'
              }`}
            >
              <Upload size={22} className={dragOver ? 'text-brass' : 'text-slate-300'} />
              <span className="text-xs text-slate font-medium">
                {disabled
                  ? 'Login to upload'
                  : dragOver
                  ? 'Drop to upload'
                  : 'Click or drag & drop an invoice image'}
              </span>
              <span className="text-xs text-slate-600 font-medium">PNG, JPG, PDF preview supported</span>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={disabled}
          />
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="bg-brass hover:bg-brass-light disabled:opacity-40 text-white font-semibold text-xs px-5 py-2.5 rounded-md shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          Check In Invoice
        </button>
      </form>
    </div>
  );
};
