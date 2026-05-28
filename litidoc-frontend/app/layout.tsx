import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LitiDoc - Legal Document Processing",
  description: "Upload, analyze, and track legal document processing in LitiDoc.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} min-h-screen bg-gray-900 font-sans text-gray-100 antialiased`}>
        {children}
      </body>
    </html>
  );
}
