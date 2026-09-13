import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://valueafter-estimator.rubinj6.chatgpt.site"),
  title: "ValueAfter — Diminished Value Estimator",
  description: "A transparent educational estimate of potential automobile diminished value after an accident.",
  openGraph: { title: "ValueAfter", description: "Understand what your car may have lost.", images: ["/og.png"] },
  twitter: { card: "summary_large_image", title: "ValueAfter", description: "Understand what your car may have lost.", images: ["/og.png"] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
