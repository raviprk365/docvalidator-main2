'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Home, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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

  const handleHome = () => {
    router.push('/dashboard')
  }

  const handleAnalysis = () => {
    router.push('/analysis')
  }

  return (
    <div className="flex items-center space-x-1">
      {/* Back/Forward buttons */}
      <div className="flex items-center space-x-1 mr-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleBack}
          disabled={!canGoBack}
          className="p-2 h-8 w-8"
          title="Go back"
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleForward}
          disabled={!canGoForward}
          className="p-2 h-8 w-8"
          title="Go forward"
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Quick navigation buttons */}
      <div className="flex items-center space-x-1">
        <Button
          variant={pathname === '/dashboard' ? 'default' : 'outline'}
          size="sm"
          onClick={handleHome}
          className="p-2 h-8"
          title="Dashboard"
        >
          <Home className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>
        <Button
          variant={pathname === '/analysis' ? 'default' : 'outline'}
          size="sm"
          onClick={handleAnalysis}
          className="p-2 h-8"
          title="Analysis"
        >
          <BarChart3 className="w-4 h-4 mr-1" />
          <span className="hidden sm:inline">Analysis</span>
        </Button>
      </div>
    </div>
  )
}