import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MIDILAB — Virtual MIDI Controller",
  description: "A tactile 25-key browser MIDI controller with live input monitoring and editable mappings.",
  openGraph: {
    title: "MIDILAB — Virtual MIDI Controller",
    description: "Play, map, and monitor a tactile 25-key MIDI controller in your browser.",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "MIDILAB virtual MIDI controller" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MIDILAB — Virtual MIDI Controller",
    description: "Play, map, and monitor a tactile 25-key MIDI controller in your browser.",
    images: ["/og.png"],
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
