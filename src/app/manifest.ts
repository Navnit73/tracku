import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Expenseliy - Expense & Finance Tracker",
    short_name: "Expenseliy",
    description: "Track expenses, monitor income, analyze budgets, and grow your wealth.",
    start_url: "/",
    display: "standalone",
    background_color: "#090d14",
    theme_color: "#10B981",
    icons: [
      {
        src: "/asset-management.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/asset-management.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
