import React, { useState, useEffect } from 'react';
import type { Invoice } from '../types';
import { Modal } from './Modal';
import { Landmark, CreditCard, Building2, UserCheck, Hash, Save } from 'lucide-react';

interface BankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  onSave: (invoiceId: string, data: {
    bankName: string;
    accountName: string;
    accountNumber: string;
    ifscCode: string;
  }) => void;
}

export const BankDetailsModal: React.FC<BankDetailsModalProps> = ({
  isOpen,
  onClose,
  invoice,
  onSave,
}) => {
  const [bankName, setBankName] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (invoice) {
      if (invoice.bankDetails) {
        setBankName(invoice.bankDetails.bankName || '');
        setAccountName(invoice.bankDetails.accountName || invoice.vendor);
        setAccountNumber(invoice.bankDetails.accountNumber || '');
        setIfscCode(invoice.bankDetails.ifscCode || '');
      } else {
        setBankName('');
        setAccountName(invoice.vendor || '');
        setAccountNumber('');
        setIfscCode('');
      }
      setError('');
    }
  }, [invoice]);

  if (!invoice) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedBank = bankName.trim();
    const trimmedAccountName = accountName.trim();
    const trimmedAccNum = accountNumber.trim();
    const trimmedIfsc = ifscCode.trim().toUpperCase();

    if (!trimmedBank) return setError('Bank name is required.');
    if (!trimmedAccountName) return setError('Account holder name is required.');
    if (!trimmedAccNum || trimmedAccNum.length < 6) return setError('Please enter a valid account number.');
    if (!trimmedIfsc || trimmedIfsc.length < 4) return setError('Please enter a valid IFSC / Swift code.');

    onSave(invoice.id, {
      bankName: trimmedBank,
      accountName: trimmedAccountName,
      accountNumber: trimmedAccNum,
      ifscCode: trimmedIfsc,
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Bank Account Details">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-indigo-50/70 border border-indigo-100 p-3.5 rounded-lg flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brass/10 flex items-center justify-center text-brass shrink-0">
            <Landmark size={18} />
          </div>
          <div>
            <p className="text-xs font-bold text-ink-dark">Approved Invoice Payout Setup</p>
            <p className="text-[11px] text-slate-600">
              Attach bank account credentials for <span className="font-semibold text-ink-dark">{invoice.vendor}</span> ({invoice.invoiceNumber})
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
              <Building2 size={13} className="text-brass" /> Bank Name *
            </label>
            <input
              type="text"
              required
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="e.g. HDFC Bank / ICICI Bank / State Bank of India"
              className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark shadow-sm"
            />
          </div>

          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
              <UserCheck size={13} className="text-brass" /> Account Holder Name *
            </label>
            <input
              type="text"
              required
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              placeholder="Full name on bank account"
              className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <CreditCard size={13} className="text-brass" /> Account Number *
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account number"
                className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs sm:text-sm font-mono focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark shadow-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center gap-1">
                <Hash size={13} className="text-brass" /> IFSC / Branch Code *
              </label>
              <input
                type="text"
                required
                value={ifscCode}
                onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                placeholder="e.g. HDFC0001234"
                className="w-full bg-white border border-slate-200 rounded px-3 py-2 text-xs sm:text-sm font-mono uppercase focus:outline-none focus:ring-1 focus:ring-brass focus:border-brass text-ink-dark shadow-sm"
              />
            </div>
          </div>
        </div>

        {error && <p className="text-xs text-red font-semibold">{error}</p>}

        <div className="pt-2 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold px-4 py-2 rounded transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-brass hover:bg-brass-light text-white text-xs font-semibold px-4 py-2 rounded shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Save size={14} /> Save Bank Account Details
          </button>
        </div>
      </form>
    </Modal>
  );
};
