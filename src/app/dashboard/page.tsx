'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { Dashboard as DashboardComponent } from '../components/dashboard/Dashboard'
import { useAuthStore } from '../store/authStore'

type User = {
  id: string
  email: string
  role: string
}

const DashboardContent = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useRouter()
  const searchParams = useSearchParams()
  const folder = searchParams.get('folder')
  
  // Use auth store
  const isLogin = useAuthStore((state) => state.isLogin)
  const email = useAuthStore((state) => state.email)
  const role = useAuthStore((state) => state.role)
  const login = useAuthStore((state) => state.login)

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        // Check if user is already logged in via auth store
        if (isLogin && email && role) {
          setUser({ id: '1', email, role })
          // If no folder parameter, redirect to folders page
          if (!folder) {
            navigate.push('/folders')
            return
          }
          setLoading(false)
          return
        }

        // Check for user cookie via API
        const response = await fetch('/api/login')
        const userCookie = await response.text()

        if (userCookie && userCookie !== 'No user cookie found') {
          try {
            // Parse the cookie data
            const userData = JSON.parse(decodeURIComponent(userCookie))

            if (userData.user?.email && userData.user?.role) {
              // Set user in Zustand store
              login(userData.user.email, userData.user.role)
              setUser({ id: '1', email: userData.user.email, role: userData.user.role })
              
              // If no folder parameter, redirect to folders page
              if (!folder) {
                navigate.push('/folders')
                return
              }
            } else {
              navigate.push('/auth')
              return
            }
          } catch (error) {
            console.error('Error parsing user cookie:', error)
            navigate.push('/auth')
            return
          }
        } else {
          navigate.push('/auth')
          return
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        navigate.push('/auth')
        return
      }

      setLoading(false)
    }

    checkAuthentication()
  }, [navigate, folder, isLogin, email, role, login])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* <Header /> */}
      <DashboardComponent folder={folder || undefined} />
    </div>
  )
}

const Dashboard = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}

export default Dashboard