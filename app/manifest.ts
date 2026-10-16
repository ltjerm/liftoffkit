import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LiftoffKit",
    short_name: "LiftoffKit",
    description:
      "Paste your app URL. Get landing copy, logo & favicon, OG images, store/Product Hunt shots, privacy & terms, and a 7-day X launch plan.",
    start_url: "/",
    display: "standalone",
    background_color: "#f3efe6",
    theme_color: "#14120f",
    icons: [
      {
        src: "/icon",
        sizes: "32x32",
        type: "image/png",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
