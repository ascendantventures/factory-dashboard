'use client';

import { Download } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BulkDownloadBarProps {
  selectedIds: string[];
  onClear: () => void;
}

export function BulkDownloadBar({ selectedIds, onClear }: BulkDownloadBarProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const tooMany = selectedIds.length > 50;

  const handleDownload = async () => {
    if (tooMany) {
      toast.error('Max 50 files per download');
      return;
    }
    setIsDownloading(true);
    try {
      const res = await fetch('/api/uat/attachments/zip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attachment_ids: selectedIds }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error ?? 'Download failed');
        return;
      }
      const blob = await res.blob();
      const ts = format(new Date(), 'yyyyMMdd-HHmm');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uat-attachments-${ts}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${selectedIds.length} file${selectedIds.length !== 1 ? 's' : ''}`);
    } catch {
      toast.error('Download failed');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div
      data-testid="bulk-download-bar"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        height: '64px', background: '#18181B', borderTop: '1px solid #3F3F46',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', zIndex: 40,
        animation: 'slideUp 200ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <p data-testid="selected-count" style={{ fontSize: '14px', fontWeight: 500, color: '#FAFAFA', margin: 0 }}>
          <strong style={{ color: '#6366F1', fontWeight: 700 }}>{selectedIds.length}</strong>
          {' '}attachment{selectedIds.length !== 1 ? 's' : ''} selected
        </p>
        <button
          onClick={onClear}
          style={{ fontSize: '13px', color: '#A1A1AA', background: 'none', border: 'none', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' }}
        >
          Clear selection
        </button>
        {tooMany && (
          <span style={{ fontSize: '13px', color: '#EF4444' }}>Max 50 files per download</span>
        )}
      </div>
      <button
        data-testid="download-zip-btn"
        onClick={handleDownload}
        disabled={isDownloading || tooMany}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          height: '36px', padding: '0 16px', background: tooMany ? '#3F3F46' : '#6366F1',
          color: '#FFFFFF', fontSize: '14px', fontWeight: 600, borderRadius: '8px', border: 'none',
          cursor: (isDownloading || tooMany) ? 'not-allowed' : 'pointer', opacity: isDownloading ? 0.7 : 1,
        }}
      >
        <Download size={16} />
        {isDownloading ? 'Downloading...' : 'Download ZIP'}
      </button>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
