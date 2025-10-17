import "./globals.css";
import type { Metadata } from "next";
import { type ReactNode } from "react";
import Header from "@/components/Header";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Haruhikage",
  description: "Your gateway to decentralized insurance",
  icons: {
    icon: "/anon.png",
    apple: "/anon.png",
  },
};

export default function RootLayout(props: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/anon.png" />
      </head>
      <body className="bg-black min-h-screen">
        <Providers>
          <Header />
          {props.children}
        </Providers>
      </body>
    </html>
  );
}
