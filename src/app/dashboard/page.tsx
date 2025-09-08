'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Header } from '../components/layout/Header'
import { Dashboard as DashboardComponent } from '../components/dashboard/Dashboard'
type DummyUser = {
  id: string
  email: string
  created_at: string
}

const DashboardContent = () => {
  const [user, setUser] = useState<DummyUser | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useRouter()
  const searchParams = useSearchParams()
  const folder = searchParams.get('folder')

  useEffect(() => {
    // Check for dummy user
    const dummyUserData = localStorage.getItem('dummy-user')
    if (!dummyUserData) {
      navigate.push('/auth')
      return
    } else {
      setUser(JSON.parse(dummyUserData))
    }
    
    // If no folder parameter, redirect to applications page
    if (!folder) {
      navigate.push('/folders')
      return
    }
    
    setLoading(false)
  }, [navigate, folder])

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
      <Header />
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