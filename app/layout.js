import { Inter, Yatra_One } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
const yatraOne = Yatra_One({
  subsets: ["latin"],
  weight: ["400"], // Yatra One only has 400 weight
  variable: "--font-yatra",
});

export const metadata = {
  title: "Zubair Bin Shaukat",
  description:
    "I’m a Full Stack Developer from Lahore, Pakistan. I build high-performance websites, mobile apps (React Native), and scalable backend systems using Node.js, AdonisJS, and TypeScript.",

  openGraph: {
    title: "Zubair Bin Shaukat",
    description:
      "I’m a Full Stack Developer from Lahore, Pakistan. I build high-performance websites, mobile apps (React Native), and scalable backend systems using Node.js, AdonisJS, and TypeScript.",
    keywords: [
      "Zubair Bin Shaukat",
      "Full Stack Developer",
      "Web Developer Lahore",
      "React Native Developer",
      "Next.js Developer",
      "AdonisJS",
      "Node.js",
      "TypeScript",
    ],
    authors: [{ name: "Zubair Bin Shaukat" }],
    creator: "Zubair Bin Shaukat",
    url: "https://zubairbinshaukat.vercel.app",
    siteName: "Zubair Bin Shaukat",
    images: [
      {
        url: "https://zubairbinshaukat.vercel.app/og-image.png",
        width: 1700,
        height: 1030,
        alt: "Zubair Bin Shaukat – Software Developer Portfolio",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Zubair Bin Shaukat",
    description:
      "I’m a Full Stack Developer from Lahore, Pakistan. I build high-performance websites, mobile apps (React Native), and scalable backend systems using Node.js, AdonisJS, and TypeScript.",
    images: ["https://zubairbinshaukat.vercel.app"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} ${yatraOne.variable} 
        bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900
         font-sans`}
      >
        {/* bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 */}
        {children}
      </body>
    </html>
  );
}
