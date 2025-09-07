'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Header } from '../components/layout/Header'
import { FolderGrid } from '../components/landing/FolderGrid'

type DummyUser = {
  id: string
  email: string
  created_at: string
}

const ApplicationsPage = () => {
  const [user, setUser] = useState<DummyUser | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useRouter()

  useEffect(() => {
    // Check for dummy user
    const dummyUserData = localStorage.getItem('dummy-user')
    if (!dummyUserData) {
      navigate.push('/auth')
    } else {
      setUser(JSON.parse(dummyUserData))
    }
    setLoading(false)
  }, [navigate])

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
      <FolderGrid />
    </div>
  )
}

export default ApplicationsPage