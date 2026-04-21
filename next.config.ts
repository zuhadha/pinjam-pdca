import type { NextConfig } from "next";

const nextConfig = {
  basePath: "/peminjaman-barang",
  output: "standalone",  // penting untuk deployment efisien
  // ... konfigurasi lainnya
};
 
module.exports = nextConfig;


export default nextConfig;
