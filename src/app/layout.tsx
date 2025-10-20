import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Voyana - Premium Digital Experience",
  description: "Elevate your digital presence with luxury design and exceptional results",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        layout: {
          logoImageUrl: "/VoyanaLogo.svg",
        },
      }}
      dynamic
    >
      <html lang="en">
        <body
          className={`${inter.variable} ${playfair.variable} antialiased scrollbar-hide`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
