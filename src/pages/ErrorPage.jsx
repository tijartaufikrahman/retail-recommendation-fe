import { useEffect } from 'react';

/**
 * Native Browser Connection Refused Error Simulation
 * Displays 1:1 replica of Chromium / Google Chrome native neterror page (ERR_CONNECTION_REFUSED).
 * Completely obscures application structure from malicious probes or unauthorized URL injections.
 */
export default function ErrorPage() {
  const host = typeof window !== 'undefined' ? window.location.hostname || 'localhost' : 'localhost';

  useEffect(() => {
    const originalTitle = document.title;
    document.title = host;
    return () => {
      document.title = originalTitle;
    };
  }, [host]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div
      style={{
        margin: 0,
        padding: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: '#ffffff',
        color: '#202124',
        fontFamily: "'Segoe UI', Tahoma, sans-serif",
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 999999,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-start',
        boxSizing: 'border-box',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          paddingTop: '90px',
          paddingLeft: '24px',
          paddingRight: '24px',
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'left',
        }}
      >
        {/* Chromium Sad Document SVG Icon */}
        <div style={{ marginBottom: '20px' }}>
          <svg
            width="44"
            height="44"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: 'block' }}
          >
            {/* Page Outline */}
            <path
              d="M10 6C10 4.89543 10.8954 4 12 4H28L38 14V42C38 43.1046 37.1046 44 36 44H12C10.8954 44 10 43.1046 10 42V6Z"
              stroke="#5f6368"
              strokeWidth="2.5"
              fill="#ffffff"
            />
            {/* Folded Corner */}
            <path
              d="M28 4V14H38"
              stroke="#5f6368"
              strokeWidth="2.5"
              fill="#ffffff"
            />
            {/* Sad Face Left Eye */}
            <circle cx="19" cy="24" r="2" fill="#5f6368" />
            {/* Sad Face Right Eye */}
            <circle cx="29" cy="24" r="2" fill="#5f6368" />
            {/* Sad Mouth Inverted Arc */}
            <path
              d="M19 33C20.5 30.8 22.8 29.8 24 29.8C25.2 29.8 27.5 30.8 29 33"
              stroke="#5f6368"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Heading */}
        <h1
          style={{
            fontSize: '22px',
            fontWeight: 500,
            lineHeight: '28px',
            color: '#202124',
            margin: '0 0 16px 0',
            letterSpacing: 'normal',
          }}
        >
          This site can’t be reached
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontSize: '13px',
            lineHeight: '20px',
            color: '#5f6368',
            margin: '0 0 16px 0',
          }}
        >
          <strong style={{ fontWeight: 500, color: '#3c4043' }}>{host}</strong> refused to connect.
        </p>

        {/* Try steps */}
        <p
          style={{
            fontSize: '13px',
            lineHeight: '20px',
            color: '#5f6368',
            margin: '0 0 6px 0',
          }}
        >
          Try:
        </p>
        <ul
          style={{
            margin: '0 0 28px 0',
            paddingLeft: '22px',
            fontSize: '13px',
            lineHeight: '20px',
            color: '#5f6368',
          }}
        >
          <li style={{ marginBottom: '4px' }}>Checking the connection</li>
          <li style={{ marginBottom: '4px' }}>Checking the proxy and the firewall</li>
        </ul>

        {/* Error Code */}
        <div
          style={{
            fontSize: '12px',
            color: '#5f6368',
            letterSpacing: '0.2px',
            marginBottom: '28px',
          }}
        >
          ERR_CONNECTION_REFUSED
        </div>

        {/* Reload Button */}
        <div>
          <button
            type="button"
            onClick={handleReload}
            style={{
              backgroundColor: '#1a73e8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '4px',
              padding: '8px 16px',
              fontSize: '13px',
              fontWeight: 500,
              fontFamily: 'inherit',
              cursor: 'pointer',
              outline: 'none',
              boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3)',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#1b66c9';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#1a73e8';
            }}
          >
            Reload
          </button>
        </div>
      </div>
    </div>
  );
}
