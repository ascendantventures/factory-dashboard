'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import TotalsGrid from './components/TotalsGrid';
import ROIMetricsGrid from './components/ROIMetricsGrid';
import SpendByAppChart from './components/SpendByAppChart';
import SpendByStationChart from './components/SpendByStationChart';
import SpendByModelChart from './components/SpendByModelChart';
import SpendOverTimeChart from './components/SpendOverTimeChart';
import FilterBar from './components/FilterBar';
import ExportButton from './components/ExportButton';
import { useAnalyticsCosts } from './hooks/useAnalyticsCosts';
import { useAnalyticsROI } from './hooks/useAnalyticsROI';
import { useAnalyticsTrends, type Granularity } from './hooks/useAnalyticsTrends';

const DEFAULT_FROM = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
const DEFAULT_TO = new Date().toISOString();

export default function AnalyticsDashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [from, setFrom] = useState(() => searchParams.get('from') ?? DEFAULT_FROM);
  const [to, setTo] = useState(() => searchParams.get('to') ?? DEFAULT_TO);
  const [repo, setRepo] = useState(() => searchParams.get('repo') ?? '');
  const [granularity, setGranularity] = useState<Granularity>(() => (searchParams.get('granularity') as Granularity) ?? 'day');

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    params.set('from', from);
    params.set('to', to);
    if (repo) params.set('repo', repo);
    if (granularity !== 'day') params.set('granularity', granularity);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }, [from, to, repo, granularity, router, pathname]);

  const { data: costsData, loading: costsLoading } = useAnalyticsCosts(from, to, repo);
  const { data: roiData, loading: roiLoading } = useAnalyticsROI(from, to, repo);
  const { data: trendsData, loading: trendsLoading } = useAnalyticsTrends(from, to, repo, granularity);

  const handleReset = useCallback(() => {
    setFrom(DEFAULT_FROM);
    setTo(DEFAULT_TO);
    setRepo('');
    setGranularity('day');
  }, []);

  // Collect unique repos from by_app data
  const repos = costsData?.by_app?.map(a => a.repo) ?? [];

  const sectionGap = '32px';

  return (
    <div style={{
      maxWidth: '1400px',
      margin: '0 auto',
      padding: '24px 32px',
      display: 'flex',
      flexDirection: 'column',
      gap: sectionGap,
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <h1 style={{
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontSize: '40px',
          fontWeight: 700,
          lineHeight: 1.1,
          letterSpacing: '-0.02em',
          color: 'var(--text-primary)',
          margin: 0,
        }}>
          Analytics
        </h1>
        <ExportButton from={from} to={to} repo={repo} />
      </div>

      {/* Filter Bar */}
      <FilterBar
        from={from}
        to={to}
        repo={repo}
        repos={repos}
        onFromChange={setFrom}
        onToChange={setTo}
        onRepoChange={setRepo}
        onReset={handleReset}
      />

      {/* Totals Grid */}
      <section>
        <TotalsGrid totals={costsData?.totals ?? null} loading={costsLoading} />
      </section>

      {/* ROI Metrics */}
      <section>
        <h2 style={{
          fontFamily: '"Space Grotesk", system-ui, sans-serif',
          fontSize: '20px',
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: 'var(--text-primary)',
          margin: '0 0 16px 0',
        }}>
          ROI Metrics
        </h2>
        <ROIMetricsGrid data={roiData} loading={roiLoading} />
      </section>

      {/* Charts Row 1: Spend Over Time + Spend by Station */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
      }}>
        <SpendOverTimeChart
          data={trendsData?.series ?? []}
          loading={trendsLoading}
          granularity={granularity}
          onGranularityChange={setGranularity}
        />
        <SpendByStationChart
          data={costsData?.by_station ?? []}
          loading={costsLoading}
        />
      </section>

      {/* Charts Row 2: Spend by App + Spend by Model */}
      <section style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
        gap: '20px',
      }}>
        <SpendByAppChart
          data={costsData?.by_app ?? []}
          loading={costsLoading}
        />
        <SpendByModelChart
          data={costsData?.by_model ?? []}
          loading={costsLoading}
        />
      </section>
    </div>
  );
}
