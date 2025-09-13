import type React from "react"
import type { Metadata } from "next"
import { Inter, Montserrat, Lato } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-montserrat",
})

const lato = Lato({
  subsets: ["latin"],
  weight: ["300", "400", "700"],
  variable: "--font-lato",
})

export const metadata: Metadata = {
  title: "Papayoo - Sistema de Rifa",
  description: "Sistema de rifa para clientes de Papayoo",
    generator: 'v0.app'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className={`${inter.variable} ${montserrat.variable} ${lato.variable} font-lato`}>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
