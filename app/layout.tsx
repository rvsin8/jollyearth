import type { Metadata } from "next";
import "./globals.css";
// Shared section styles belong to the root, avoiding a CSS-only client chunk.
import "./jersey-city/jersey-city.css";
import "./style-system.css";
import "./fonts.css";
import "./redesign.css";
import "./animal-exhibit.css";
import "./museum-polish.css";
import "./learn/fonts.css";
import "./jersey-city/mobile-learning.css";
import "./mobile-field-guide.css";
import SiteShell from "./site-shell";

export const metadata: Metadata = {
  title: "Earthbound — A living field atlas",
  description: "Explore Earth’s 36 biodiversity hotspots in an interactive natural history atlas. Discover irreplaceable ecosystems and the life they shelter.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{__html:"try{document.documentElement.dataset.theme=localStorage.getItem('earthbound-theme')==='dark'?'dark':'light'}catch{document.documentElement.dataset.theme='light'}"}}/></head>
      <body className="antialiased"><SiteShell>{children}</SiteShell></body>
    </html>
  );
}
