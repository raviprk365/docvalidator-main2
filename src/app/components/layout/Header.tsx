import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, LogOut, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '../ui/use-toast'

type DummyUser = {
  id: string
  email: string
  created_at: string
}

export function Header() {
  const [user, setUser] = useState<DummyUser | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    // Get dummy user from localStorage
    const dummyUserData = localStorage.getItem('dummy-user')
    if (dummyUserData) {
      setUser(JSON.parse(dummyUserData))
    }
  }, [])

  const handleSignOut = () => {
    localStorage.removeItem('dummy-user')
    setUser(null)
    
    toast({
      title: "Signed out successfully",
      description: "You have been logged out of DocValidator."
    })
    
    router.push('/')
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">DocValidator</h1>
            <p className="text-sm text-muted-foreground">Sydney Document Validation</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">{user.email}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="flex items-center space-x-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}