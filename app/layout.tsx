import type { Metadata, Viewport } from "next";
import { Geist, Playfair_Display } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Farewell Seating Planner | Find your table",
  description:
    "Find your table and see who is seated with you at the farewell. 22 tables, 153 seats.",
  applicationName: "Farewell Seating Planner",
};

export const viewport: Viewport = {
  themeColor: "#faf8f4",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      className={`${geistSans.variable} ${playfair.variable} h-full antialiased`}
      lang="en"
    >
      <body className="flex min-h-full flex-col text-ink">{children}</body>
    </html>
  );
}
