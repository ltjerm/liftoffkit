import { ImageResponse } from "next/og";
import { palette } from "./data/colors";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <svg viewBox="0 0 32 32" width="32" height="32">
        <rect width="32" height="32" rx="9" fill={palette.ink} />
        <path
          d="M16 6.5c3.6 2.6 5 6.3 4.3 11.2l-2.1 2.1h-4.4l-2.1-2.1C11 12.8 12.4 9.1 16 6.5Z"
          fill={palette.accent}
        />
        <circle cx="16" cy="13.2" r="1.7" fill={palette.cream} />
        <path d="M14.2 21.6h3.6L16 26.2Z" fill={palette.cream} opacity="0.85" />
      </svg>
    ),
    { ...size }
  );
}
