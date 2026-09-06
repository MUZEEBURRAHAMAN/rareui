"use client";

export function Header() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        background: "var(--bg)",
        zIndex: 50,
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <path d="M17.5 14v7M14 17.5h7" />
        </svg>
        <span style={{ fontSize: 16, fontWeight: 600 }}>RareUI</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            padding: "2px 6px",
            borderRadius: 4,
            background: "var(--bg-elevated)",
            color: "var(--text-muted)",
          }}
        >
          Components
        </span>
      </div>

      <nav style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <a
          href="/admin"
          style={{
            fontSize: 13,
            color: "var(--text-secondary)",
            textDecoration: "none",
            padding: "6px 12px",
            borderRadius: 6,
            border: "1px solid var(--border)",
          }}
        >
          Admin
        </a>
      </nav>
    </header>
  );
}
