'use client'
import { Button } from '@/components/ui/button'
import { FileText, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../ui/use-toast'
import { PageNavigation } from './PageNavigation'

// ...existing code...

export function Header() {
  const { toast } = useToast()
  const router = useRouter()
  const isLogin = useAuthStore((state) => state.isLogin)
  const logout = useAuthStore((state) => state.logout)

  const handleSignOut = () => {
    logout()
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of EAI Document Intelligence."
    })
    router.push('/')
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard" className='ssr-only'>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">EAI Document Intelligence</h1>
                <p className="text-sm text-muted-foreground">Azure-Native Platform</p>
              </div>
            </div>
          </Link>
          {isLogin && <PageNavigation />}
        </div>

        {isLogin ? (
          <>
            {/* Desktop logout button */}
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="hidden md:flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
            {/* Mobile logout button, right side */}
            {/* <div className="fixed top-4 right-4 z-50 sm:hidden">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div> */}
          </>
        ) : (
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/auth')}
              className="btn-primary text-sm lg:text-lg px-8 py-3"
            >
              Get Started
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}