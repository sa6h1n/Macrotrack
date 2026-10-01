import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MacroTrack",
  description:
    "Personal nutrition, macro and small-group fitness tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0b0d10] text-[#f5f7fa]">
        {children}
      </body>
    </html>
  );
}