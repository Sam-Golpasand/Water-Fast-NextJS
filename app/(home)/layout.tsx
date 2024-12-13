import Navbar2 from '@/components/Navbar2'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
      <>
        <Navbar2 />
        {children}
      </>
  )
}

