import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://liftoffkit.app/",
      lastModified: new Date("2026-10-14"),
      changeFrequency: "weekly",
      priority: 1,
    },
    { url: "https://liftoffkit.app/privacy", lastModified: new Date("2026-10-15"), changeFrequency: "yearly", priority: 0.3 },
    { url: "https://liftoffkit.app/terms", lastModified: new Date("2026-10-15"), changeFrequency: "yearly", priority: 0.3 },
  ];
}
