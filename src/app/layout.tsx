import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iris Dashboard",
  description: "Task tracking & activity dashboard for Iris",
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
