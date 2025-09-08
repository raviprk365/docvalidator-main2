'use client'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { BarChart3, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export function PageNavigation() {
  const router = useRouter()
  const pathname = usePathname()
  const [navigationHistory, setNavigationHistory] = useState<string[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  useEffect(() => {
    // Initialize or update navigation history
    const initializeHistory = () => {
      if (currentIndex === -1) {
        // First time loading
        setNavigationHistory([pathname])
        setCurrentIndex(0)
      } else {
        // Check if current path is different from last entry
        const lastPath = navigationHistory[currentIndex]
        if (lastPath !== pathname) {
          // Add new path and remove any forward history
          const newHistory = [
            ...navigationHistory.slice(0, currentIndex + 1),
            pathname
          ]
          setNavigationHistory(newHistory)
          setCurrentIndex(newHistory.length - 1)
        }
      }
    }

    initializeHistory()
  }, [pathname, navigationHistory, currentIndex])

  const canGoBack = currentIndex > 0
  const canGoForward = currentIndex < navigationHistory.length - 1

  const handleBack = () => {
    if (canGoBack) {
      const newIndex = currentIndex - 1
      const targetPath = navigationHistory[newIndex]
      setCurrentIndex(newIndex)
      router.push(targetPath)
    }
  }

  const handleForward = () => {
    if (canGoForward) {
      const newIndex = currentIndex + 1
      const targetPath = navigationHistory[newIndex]
      setCurrentIndex(newIndex)
      router.push(targetPath)
    }
  }

  const handleApplications = () => {
    router.push('/folders')
  }

  const handleAnalysis = () => {
    router.push('/analysis')
  }

  const [menuOpen, setMenuOpen] = useState(false)

 const isLogin = useAuthStore((state) => state.isLogin);
  const logout = useAuthStore((state) => state.logout);


  return (
    <div className="flex items-center space-x-1">
      {/* Back/Forward buttons for medium and up */}
      <div className="flex items-center space-x-1 mr-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          disabled={!canGoBack}
          className="hidden p-2 h-8 w-8 md:inline"
          title="Go back"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleForward}
          disabled={!canGoForward}
          className="hidden p-2 h-8 w-8 md:inline"
          title="Go forward"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick navigation buttons for medium and up */}
      <div className="hidden md:flex items-center space-x-1">
        <Button
          variant={pathname === '/folders' ? 'default' : 'outline'}
          size="sm"
          onClick={handleApplications}
          className="p-2 h-8"
          title="Applications"
        >
          <FolderOpen className="w-4 h-4 mr-1" />
          <span className="hidden md:inline">Applications</span>
        </Button>
        <Button
          variant={pathname === '/analysis' ? 'default' : 'outline'}
          size="sm"
          onClick={handleAnalysis}
          className="p-2 h-8"
          title="Analysis"
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          <span className="hidden md:inline">Analysis</span>
        </Button>
      </div>

      {/* Shadcn DropdownMenu for small and medium devices, positioned at right */}
      <div className="md:hidden fixed top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="p-2 h-8"
              title="Menu"
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={handleApplications} className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              <span>Applications</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAnalysis} className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span>Analysis</span>
            </DropdownMenuItem>
            {isLogin && (
              <DropdownMenuItem onClick={logout} className="flex items-center gap-2 mt-2">
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24"><path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" /></svg>
                <span>Logout</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
