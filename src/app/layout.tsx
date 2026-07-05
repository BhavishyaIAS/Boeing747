import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "Bhavishya IAS",
    template: "%s · Bhavishya IAS",
  },
  description:
    "India's most comprehensive APPSC Group-1 preparation platform. Towards a Brighter Future.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
