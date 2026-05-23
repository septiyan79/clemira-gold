import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

export const metadata: Metadata = {
  title: "Clemira Gold – Jual Beli Emas Antam Terpercaya",
  description: "Platform jual beli emas Antam bersertifikat. Transparan, aman, dan terpercaya.",
  icons: {
    icon: "/Logo CG.png",
    apple: "/Logo CG.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id" className={`${dmSans.variable} ${cormorant.variable}`}>
      <body style={{ position: "relative" }}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
