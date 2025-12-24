import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "Sistem Peminjaman Barang - Garuda Food",
  description: "Aplikasi peminjaman barang internal kantor Garuda Food",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}

