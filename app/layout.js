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
  description: "A Passionate Website Developer From Lahore, Pakistan.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${inter.className} ${yatraOne.variable} bg-gradient-to-r from-purple-500 via-violet-500 to-pink-500 font-sans`}
      >
        {children}
      </body>
    </html>
  );
}
