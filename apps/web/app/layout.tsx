import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegistration } from "@/components/pwa-registration";

export const metadata: Metadata = {
  title: { default: "MaliktBoard", template: "%s | MaliktBoard" },
  description: "Shipment request, dispatch batch, QR scanning, and customer tracking for domestic delivery companies.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#102c32", width: "device-width", initialScale: 1 };

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}<PwaRegistration/></body></html>;
}
