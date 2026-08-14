import type { Metadata } from "next";
import { Bricolage_Grotesque, DM_Sans } from "next/font/google";
import { SmoothScrollProvider } from "@/components/smooth-scroll";
import "./globals.css";

const fontBricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: 'swap',
});

const fontDmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: "What's Up! | Interactive Live Polling for Classrooms",
    template: "%s | What's Up!"
  },
  description: "Transform your presentations into interactive experiences. Host live polls, word clouds, and Q&A sessions with real-time leaderboards to engage your audience.",
  keywords: ["live polling", "student engagement", "interactive presentation", "classroom quiz", "audience interaction", "framer motion", "nextjs"],
  authors: [{ name: "What's Up Team" }],
  creator: "What's Up Team",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://whatsup-polling.com", // Replace with real domain when deployed
    title: "What's Up! | Interactive Live Polling for Classrooms",
    description: "Transform your presentations into interactive experiences with real-time live polling, word clouds, and leaderboards.",
    siteName: "What's Up!",
  },
  twitter: {
    card: "summary_large_image",
    title: "What's Up! | Interactive Live Polling",
    description: "Engage your audience with live interactive presentations and quizzes.",
    creator: "@whatsup_app"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fontBricolage.variable} ${fontDmSans.variable} antialiased`}
    >
      <body className="flex flex-col font-sans">
        <SmoothScrollProvider>
          {children}
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
