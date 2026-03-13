'use client';

import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';

interface ExportButtonProps {
  filters: {
    email?: string;
    category?: string;
    action?: string;
    dateFrom?: string;
    dateTo?: string;
  };
}

export function ExportButton({ filters }: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.email) params.set('email', filters.email);
      if (filters.category) params.set('category', filters.category);
      if (filters.action) params.set('action', filters.action);
      if (filters.dateFrom) params.set('date_from', filters.dateFrom);
      if (filters.dateTo) params.set('date_to', filters.dateTo);

      const url = `/api/admin/audit/export?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Export failed');

      const blob = await res.blob();
      const today = new Date().toISOString().slice(0, 10);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `audit-log-${today}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch (err) {
      console.error('CSV export failed:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      data-testid="export-csv-btn"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '10px 20px',
        height: '40px',
        borderRadius: '8px',
        border: '1px solid #2A3038',
        background: 'transparent',
        color: '#F0F2F5',
        fontSize: '13px',
        fontWeight: 500,
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.6 : 1,
        transition: 'all 150ms cubic-bezier(0.25,1,0.5,1)',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => {
        if (!loading) {
          (e.currentTarget as HTMLButtonElement).style.background = '#1E2328';
          (e.currentTarget as HTMLButtonElement).style.borderColor = '#D4A534';
        }
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
        (e.currentTarget as HTMLButtonElement).style.borderColor = '#2A3038';
      }}
    >
      {loading ? (
        <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
      ) : (
        <Download style={{ width: '16px', height: '16px' }} />
      )}
      Export CSV
    </button>
  );
}
