import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  poweredByHeader: false, // ปิด Header 'X-Powered-By: Next.js' ตามมาตรฐาน OWASP
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // 1. ป้องกัน Clickjacking
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // 2. ป้องกัน MIME-type Sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // 3. ควบคุม Referrer Information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // 4. ป้องกัน XSS ในเบราว์เซอร์รุ่นเก่า
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // 5. Permissions-Policy จำกัดการเข้าถึงอุปกรณ์ฮาร์ดแวร์ที่ไม่จำเป็น
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // 6. Strict-Transport-Security (HSTS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
