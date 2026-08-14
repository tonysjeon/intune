import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { SiteFooter } from "@/app/site-footer";
import "./app.css";

export const metadata: Metadata = {
  title: "InTune — See how your music tastes connect",
  description:
    "Compare Spotify listening habits, discover shared favorites, and find the perfect songs to send each other.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${GeistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div>{children}</div>
        <SiteFooter />
      </body>
    </html>
  );
}
