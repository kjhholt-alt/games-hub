import type { MetadataRoute } from "next";

const BASE = "https://play.buildkit.store";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    {
      url: `${BASE}/tier-lists`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE}/news`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];
}
