import Navbar from '@/components/Navbar'
import './globals.css'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="dark">
      
      <body className="be-vietnam">
        {children}
        <ToastContainer />
      </body>
    </html>
  )
}

