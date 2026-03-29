'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#000',
        color: '#fff',
        fontFamily: 'sans-serif',
        textAlign: 'center',
        padding: '20px',
      }}
    >
      <h2 style={{ fontSize: '2rem', marginBottom: '1rem' }}>
        We've Hit A Snag
      </h2>

      <p style={{ color: '#ccc', marginBottom: '2rem' }}>
        A critical system error occurred.
      </p>

      <button
        onClick={() => reset()}
        style={{
          padding: '0.75rem 2rem',
          backgroundColor: '#fff',
          color: '#000',
          border: 'none',
          cursor: 'pointer',
          textTransform: 'uppercase',
          letterSpacing: '2px',
          fontSize: '0.8rem',
        }}
      >
        Attempt Recovery
      </button>
    </div>
  );
}