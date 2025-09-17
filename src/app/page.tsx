'use client'
import { CheckCircle, FileText, Shield, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card'
import { useAuthStore } from './store/authStore'

type User = {
  email: string
  role: string
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  
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
          setUser({ email, role })
          router.push('/folders')
          return
        }

        // Check for user cookie via API
        const response = await fetch('/api/login')
        const data = await response.json()

        if (data.user?.email && data.user?.role) {
          // Set user in Zustand store
          login(data.user.email, data.user.role)
          setUser({ email: data.user.email, role: data.user.role })
          router.push('/folders')
          return
        }
        
        // No valid authentication found, stay on landing page
        setUser(null)
      } catch (error) {
        console.error('Error checking authentication:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuthentication()
  }, [router, isLogin, email, role, login])

  // Show loading while checking authentication
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

  const features = [
    {
      icon: Shield,
      title: 'Azure-Native Security',
      description: 'Enterprise-grade security with Azure\'s trusted infrastructure and encrypted data storage.'
    },
    {
      icon: Zap,
      title: 'AI Auto-Classification',
      description: 'Automatically classify documents and extract fields with high accuracy using Azure AI.'
    },
    {
      icon: CheckCircle,
      title: 'Business Rules Validation',
      description: 'Validate against custom business rules (dates, signatures, GST) with intuitive exception review.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      {/* <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">EAI Document Intelligence</h1>
              <p className="text-sm text-muted-foreground">Azure-Native Platform</p>
            </div>
          </div>
          <Button onClick={() => router.push('/auth')} className="btn-primary">
            Get Started
          </Button>
        </div>
      </header> */}

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            EAI Document Intelligence
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            EAI Document Intelligence is a secure, Azure-native platform that transforms unstructured content into trusted, actionable data. It auto-classifies documents, extracts fields with high accuracy, validates against your business rules (e.g., dates, signatures, GST), and highlights exceptions with an intuitive viewer for rapid human review.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => router.push('/auth')}
              className="btn-primary text-lg px-8 py-3"
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-3"
            >
              Learn More
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => (
            <Card
              key={feature.title}
              className="card-minimal animate-fade-in"
              style={{ animationDelay: `${index * 200}ms` }}
            >
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-primary-muted rounded-xl flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-center">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center animate-fade-in" style={{ animationDelay: '600ms' }}>
          <Card className="card-elevated max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold mb-4">Ready to get started?</h2>
              <p className="text-muted-foreground mb-6">
                Join thousands of organizations using EAI Document Intelligence for secure document processing.
              </p>
              <Button
                size="lg"
                onClick={() => router.push('/auth')}
                className="btn-primary"
              >
                Create Your Account
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold">EAI Document Intelligence</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Secure, Azure-native document intelligence platform. Built with React, TypeScript, and Azure AI.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
