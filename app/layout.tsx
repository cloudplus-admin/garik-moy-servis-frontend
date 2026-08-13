import type { Metadata } from "next";
import { Golos_Text, Inter, Unbounded } from "next/font/google";
import "./globals.css";
import "./history.css";

const inter = Inter({ subsets: ["latin", "cyrillic"], variable: "--font-body" });
const golos = Golos_Text({ subsets: ["latin", "cyrillic"], variable: "--font-mid" });
const unbounded = Unbounded({ subsets: ["latin", "cyrillic"], variable: "--font-display" });

export const metadata: Metadata = {
  title: "GARIK MOY SERVIS - ERP",
  description: "Склад, продажи, долги и управленческий учет в одной системе",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body className={`${inter.variable} ${golos.variable} ${unbounded.variable}`}>{children}</body>
    </html>
  );
}
