import type { Metadata } from "next";
import "./globals.css";
import CustomCursor from "./components/custom-cursor";

export const metadata: Metadata = {
  title: "Imran Pasha",
  description: "Imran Pasha Portfolio",
  icons: {
    icon: "/image.png",
    apple: "/image.png",
    other: [
      {
        rel: "icon",
        url: "/image.png",
      },
    ],
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
        <CustomCursor />
        {children}
      </body>
    </html>
  );
}
