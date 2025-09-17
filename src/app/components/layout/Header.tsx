'use client'
import { Avatar, AvatarFallback } from '@/app/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/app/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { FileText, LogOut } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../ui/use-toast'
import { PageNavigation } from './PageNavigation'

export function Header() {
  const email = useAuthStore((state) => state.email)
  const { toast } = useToast()
  const router = useRouter()
  const isLogin = useAuthStore((state) => state.isLogin)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)

  // Check for existing cookie on component mount
  useEffect(() => {
    const checkUserCookie = async () => {
      try {
        const response = await fetch('/api/login');
        const data = await response.json();

        if (data.user && !isLogin) {
          // Verify the cookie has the required fields
          if (data.user.email && data.user.role) {
            // Set user in Zustand store
            login(data.user.email, data.user.role)
          }
        }
        // Note: We don't redirect to /auth here as this would interfere with the landing page
        // The redirect logic is handled by individual pages and middleware
      } catch (error) {
        console.error('Error checking user cookie:', error)
      }
    }

    checkUserCookie()
  }, [isLogin, login])

  const handleSignOut = async () => {
    // Clear the cookie
    await fetch('/api/logout', { method: 'POST' })
    // Clear Zustand store
    logout()

    toast({
      title: "Signed out successfully",
      description: "You have been logged out of EAI Document Intelligence."
    })
    router.push('/')
  }

  // Get first letter of email for avatar
  const getAvatarInitial = (email: string | null) => {
    if (!email) return 'U'
    return email.charAt(0).toUpperCase()
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
          <div className="flex items-center">
            {/* Mobile logout button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex md:hidden items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>

            {/* Desktop Avatar dropdown menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hidden md:flex h-10 w-10 rounded-full p-0">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {getAvatarInitial(email)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
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