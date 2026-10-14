import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://liftoffkit.app/",
      lastModified: new Date("2026-10-14"),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
