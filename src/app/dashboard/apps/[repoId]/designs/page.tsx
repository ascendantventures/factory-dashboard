'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Upload } from 'lucide-react';
import DesignGallery from '@/components/pencil/DesignGallery';

export default function DesignGalleryPage({
  params,
}: {
  params: Promise<{ repoId: string }>;
}) {
  const { repoId } = use(params);

  return (
    <div style={{
      background: '#FDFCFB',
      minHeight: '100vh',
      padding: '32px',
    }}>
      {/* Nav */}
      <Link
        href={`/dashboard/apps/${repoId}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '24px',
          fontFamily: '"Instrument Sans", system-ui, sans-serif',
          fontSize: '14px',
          fontWeight: 500,
          color: '#9C9792',
          textDecoration: 'none',
        }}
      >
        <ArrowLeft size={16} />
        {repoId}
      </Link>

      {/* Page header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '32px',
        paddingBottom: '24px',
        borderBottom: '1px solid #E8E5E1',
        flexWrap: 'wrap',
      }}>
        <div>
          <h1 style={{
            fontFamily: '"Instrument Serif", Georgia, serif',
            fontSize: '40px',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            fontWeight: 400,
            color: '#1F1E1C',
            margin: '0 0 8px 0',
          }}>
            Designs
          </h1>
          <p style={{
            fontFamily: '"Instrument Sans", system-ui, sans-serif',
            fontSize: '16px',
            color: '#5C5955',
            margin: 0,
            lineHeight: 1.6,
          }}>
            All .pen design files across issues for {repoId}
          </p>
        </div>
      </div>

      {/* Gallery */}
      <DesignGallery repoId={repoId} />
    </div>
  );
}
