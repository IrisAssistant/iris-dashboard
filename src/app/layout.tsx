import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Iris Dashboard",
  description: "Kanban board and activity tracker for Iris",
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
