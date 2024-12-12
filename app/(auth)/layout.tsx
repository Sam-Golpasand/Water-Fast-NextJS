import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Navbar from "@/components/Navbar"

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      {children}
    </div>
  )
}