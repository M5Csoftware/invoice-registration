import type { Invoice } from '../types';

export const exportInvoicesToCSV = (invoices: Invoice[], filename: string) => {
  if (invoices.length === 0) return;

  const headers = [
    'Invoice Number',
    'Vendor',
    'Date',
    'Amount',
    'Status',
    'PO Number',
    'Bank Account (Last 4)',
  ];

  const rows = invoices.map((inv) => [
    inv.invoiceNumber,
    `"${inv.vendor.replace(/"/g, '""')}"`, // escape quotes in vendor name
    inv.invoiceDate,
    inv.amount.toString(),
    inv.status,
    inv.poNumber || '',
    inv.bankLast4 || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
