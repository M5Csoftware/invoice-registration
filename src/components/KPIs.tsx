import React from 'react';
import { ShieldAlert, Hourglass, Landmark, CheckCircle, AlertOctagon } from 'lucide-react';

interface KPIsProps {
  pendingL1: number;
  pendingL2: number;
  approved: number;
  paid: number;
  flagged: number;
}

export const KPIs: React.FC<KPIsProps> = ({
  pendingL1,
  pendingL2,
  approved,
  paid,
  flagged,
}) => {
  const cards = [
    {
      label: 'Awaiting First Approval',
      value: pendingL1,
      icon: Hourglass,
      colorClass: 'border-l-brass',
      textColor: 'text-ink',
    },
    {
      label: 'Awaiting Second Approval',
      value: pendingL2,
      icon: ShieldAlert,
      colorClass: 'border-l-brass',
      textColor: 'text-ink',
    },
    {
      label: 'Approved - Ready to Pay',
      value: approved,
      icon: Landmark,
      colorClass: 'border-l-brass',
      textColor: 'text-ink',
    },
    {
      label: 'Paid',
      value: paid,
      icon: CheckCircle,
      colorClass: 'border-l-green-600',
      textColor: 'text-green',
    },
    {
      label: 'Flagged For Review',
      value: flagged,
      icon: AlertOctagon,
      colorClass: 'border-l-red',
      textColor: 'text-red',
      highlight: flagged > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const isRed = card.textColor === 'text-red';
        const isGreen = card.textColor === 'text-green';

        let badgeBg = 'bg-slate-50 text-slate';
        if (isRed) badgeBg = 'bg-red/5 text-red border border-red/10';
        else if (isGreen) badgeBg = 'bg-green/5 text-green border border-green/10';
        else badgeBg = 'bg-indigo-50 text-brass border border-brass/10';

        return (
          <div
            key={index}
            className={`bg-card border border-slate-300 border-l-4 ${card.colorClass} rounded-lg p-4 flex flex-col justify-between shadow-md hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
              card.highlight ? 'bg-red-50/20' : ''
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={`font-heading text-2xl font-bold leading-none ${card.textColor}`}>
                {card.value}
              </span>
              <div className={`p-1.5 rounded-full flex items-center justify-center ${badgeBg}`}>
                <Icon size={13} />
              </div>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-4 block leading-tight">
              {card.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
