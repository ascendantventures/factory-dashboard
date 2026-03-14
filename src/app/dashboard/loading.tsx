export default function DashboardLoading() {
  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: 'var(--background)' }}
    >
      <div
        className="animate-skeleton"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: 'var(--surface-alt)',
        }}
      />
    </div>
  );
}
