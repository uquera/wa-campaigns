import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import Link from "next/link"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "WA Campaigns",
  description: "Envío masivo de mensajes por WhatsApp",
}

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/contacts", label: "Contactos" },
  { href: "/templates", label: "Templates" },
  { href: "/campaigns", label: "Campañas" },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className={`${inter.className} min-h-full bg-zinc-50`}>
        <nav className="bg-white border-b border-zinc-200">
          <div className="max-w-6xl mx-auto px-4 flex items-center gap-6 h-14">
            <span className="font-semibold text-green-600 text-lg">WA Campaigns</span>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-zinc-600 hover:text-zinc-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  )
}
