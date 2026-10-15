import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "LiftoffKit — Paste a URL, get your launch kit";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px 80px",
          background: "#f3efe6",
          fontFamily: "Archivo, sans-serif",
          position: "relative",
        }}
      >
        {/* Grid background pattern */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage:
              "linear-gradient(#d5ccb9 1px, transparent 1px), linear-gradient(90deg, #d5ccb9 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            opacity: 0.5,
          }}
        />

        {/* Logo/wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          {/* Icon mark */}
          <svg viewBox="0 0 32 32" width="56" height="56">
            <rect width="32" height="32" rx="9" fill="#14120f" />
            <path
              d="M16 6.5c3.6 2.6 5 6.3 4.3 11.2l-2.1 2.1h-4.4l-2.1-2.1C11 12.8 12.4 9.1 16 6.5Z"
              fill="#ff4d1a"
            />
            <circle cx="16" cy="13.2" r="1.7" fill="#f3efe6" />
            <path d="M14.2 21.6h3.6L16 26.2Z" fill="#f3efe6" opacity="0.85" />
          </svg>
          <span
            style={{
              color: "#14120f",
              fontSize: "42px",
              fontWeight: 700,
              letterSpacing: "-0.03em",
            }}
          >
            LiftoffKit
          </span>
        </div>

        {/* Headline */}
        <h1
          style={{
            margin: 0,
            fontSize: "84px",
            fontWeight: 750,
            letterSpacing: "-0.045em",
            lineHeight: 1.0,
            color: "#14120f",
            maxWidth: "900px",
          }}
        >
          Paste a URL,
          <br />
          <span
            style={{
              color: "#ff4d1a",
              fontStyle: "italic",
              fontFamily: "Georgia, serif",
            }}
          >
            get your launch kit.
          </span>
        </h1>

        {/* Subtext */}
        <p
          style={{
            marginTop: "32px",
            fontSize: "28px",
            color: "#6b6457",
            maxWidth: "700px",
            lineHeight: 1.4,
          }}
        >
          Copy, logo, OG images, store shots, legal drafts, and a 7-day X plan.
          From $29.
        </p>

        {/* URL badge */}
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            right: "72px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            background: "#14120f",
            borderRadius: "999px",
            color: "#f3efe6",
            fontSize: "22px",
            fontFamily: "monospace",
          }}
        >
          liftoffkit.app
        </div>
      </div>
    ),
    { ...size }
  );
}
