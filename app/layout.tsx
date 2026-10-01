import type { Metadata } from "next";
import localFont from "next/font/local";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geist = localFont({ src: "../node_modules/next/dist/next-devtools/server/font/geist-latin.woff2", variable: "--font-geist-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Farm Tech",
  description: "Manajemen peternakan",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`h-full antialiased ${geist.variable}`}
    >
      <body className="min-h-full flex flex-col"><TooltipProvider>{children}</TooltipProvider><Toaster richColors position="top-right" /></body>
    </html>
  );
}
