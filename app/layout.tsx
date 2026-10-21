import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Forma — Your sales workspace",
  description:
    "A thoughtful sales workspace. Manage leads, have better conversations, and make every follow-up count.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-[#c9cbdc] font-sans text-base text-[#282d27] antialiased selection:bg-[#c7c0ff] [&_button]:cursor-pointer [&_button]:transition-colors [&_button:disabled]:cursor-default [&_button:disabled]:opacity-50 [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-4 [&_button:focus-visible]:outline-[#6254cf] [&_a:focus-visible]:outline-2 [&_a:focus-visible]:outline-offset-4 [&_a:focus-visible]:outline-[#6254cf] [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-[#6254cf] [&_textarea:focus-visible]:outline-2 [&_textarea:focus-visible]:outline-[#6254cf] [&_select:focus-visible]:outline-2 [&_select:focus-visible]:outline-[#6254cf] [&_svg]:shrink-0 [&_input]:min-w-0 [&_textarea]:min-w-0">
        {children}
      </body>
    </html>
  );
}
