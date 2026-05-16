import './globals.css'

export const metadata = {
  title: 'Lumen AI Ops - Enterprise AI Operations Platform',
  description: 'World-class AI operations for modern enterprise support teams.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  )
}
