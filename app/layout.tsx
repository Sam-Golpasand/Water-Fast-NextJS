import Navbar from '@/components/Navbar'
import './globals.css'


export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      
      <body className="be-vietnam">
        {children}
      </body>
    </html>
  )
}

