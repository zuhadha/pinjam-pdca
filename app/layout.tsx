import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/layout/navbar";
import { Toaster } from "@/components/ui/sonner";
import { CartProvider } from "@/components/cart/cart-context";
import { ItemDetailProvider } from "@/components/catalog/item-detail-context";
import { CartDrawer } from "@/components/cart/cart-drawer";

export const metadata: Metadata = {
  title: "INVENSA — Sistem Inventaris & Peminjaman Barang",
  description: "Aplikasi manajemen inventaris dan peminjaman barang internal",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased">
        <CartProvider>
          <ItemDetailProvider>
            <Navbar />
            {children}
            <CartDrawer />
            <Toaster />
          </ItemDetailProvider>
        </CartProvider>
      </body>
    </html>
  );
}

