import type { AppConfig, TeamMember, Invoice, Role } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/invoice-registration';

export const api = {
  // Config
  getConfig: async (): Promise<AppConfig | null> => {
    const res = await fetch(`${API_BASE}/config`);
    if (!res.ok) return null;
    const { data } = await res.json();
    return data;
  },
  saveConfig: async (config: AppConfig): Promise<void> => {
    await fetch(`${API_BASE}/config`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
  },

  // Team
  getTeam: async (): Promise<TeamMember[]> => {
    const res = await fetch(`${API_BASE}/team`);
    if (!res.ok) return [];
    const { data } = await res.json();
    return data;
  },
  addTeamMember: async (member: Omit<TeamMember, 'id'> & { id?: string }): Promise<TeamMember> => {
    const res = await fetch(`${API_BASE}/team`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
    const { data } = await res.json();
    return data;
  },
  updateTeamMember: async (id: string, member: Partial<TeamMember>): Promise<void> => {
    await fetch(`${API_BASE}/team/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(member),
    });
  },
  removeTeamMember: async (id: string): Promise<void> => {
    await fetch(`${API_BASE}/team/${id}`, {
      method: 'DELETE',
    });
  },

  // Invoices
  getInvoices: async (): Promise<Invoice[]> => {
    const res = await fetch(`${API_BASE}/invoices`);
    if (!res.ok) return [];
    const { data } = await res.json();
    return data;
  },
  addInvoice: async (invoice: Invoice): Promise<Invoice> => {
    const res = await fetch(`${API_BASE}/invoices`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoice),
    });
    const { data } = await res.json();
    return data;
  },
  updateInvoice: async (id: string, updates: Partial<Invoice>): Promise<Invoice> => {
    const res = await fetch(`${API_BASE}/invoices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    const { data } = await res.json();
    return data;
  }
};
