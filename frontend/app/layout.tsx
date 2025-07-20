import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '../styles/main.scss'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/hooks/useAuth'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { cookies } from 'next/headers'


const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Poker Planning App',
  description: 'A comprehensive real-time poker planning application',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies();
  const colorScheme = cookieStore.get('color_scheme');
  const baseColor = colorScheme?.value === 'dark' ? 'dark' : 'light';
  return (
    <html lang="en" className={baseColor} >
      <body className={inter.className}>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster 
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#10b981',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
} 