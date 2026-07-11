export type Role = 'Admin' | 'User' | 'Verifier';
export type InvoiceStatus =
  | 'pending_verification'
  | 'pending_approval'
  | 'approved'
  | 'paid'
  | 'rejected';
export type FlagLevel = 'high' | 'medium' | 'low';

export interface Flag {
  level: FlagLevel;
  text: string;
}

export interface Approval {
  by: string;
  at: number;
}

export interface HistoryEntry {
  at: number;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: string;
  note: string;
}

export interface Invoice {
  id: string;
  vendor: string;
  invoiceNumber: string;
  invoiceDate: string;
  amount: number;
  poNumber: string;
  bankLast4: string;
  description: string;
  /** base64 data-URL of the uploaded invoice image, or null */
  invoiceImage: string | null;
  enteredBy: string;
  enteredAt: number;
  status: InvoiceStatus;
  approvals: Approval[];
  history: HistoryEntry[];
  flags: Flag[];
  /** Notes left by the Verifier during L1 verification */
  verificationNotes?: string;
}

export interface TeamMember {
  id: string;
  name: string;
  username: string;
  password: string;
  role: Role;
}

export interface AppConfig {
  threshold: number;
  currency: 'INR' | 'USD' | 'EUR';
}

export interface AuditEntry {
  at: number;
  actorName: string;
  actorRole: string;
  action: string;
  vendor: string;
  invoiceNumber: string;
  note: string;
}
