import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "MacroTrack", description: "Personal nutrition, macro and small-group fitness tracking." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
