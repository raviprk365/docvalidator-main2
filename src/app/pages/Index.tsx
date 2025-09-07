import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle, FileText, Shield, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const Index = () => {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Check if user is already authenticated
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push('/dashboard')
      } else {
        setUser(null)
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          router.push('/dashboard')
        } else {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  const features = [
    {
      icon: Shield,
      title: 'Secure Authentication',
      description: 'Enterprise-grade security with encrypted data storage and secure sessions.'
    },
    {
      icon: Zap,
      title: 'AI-Powered Validation',
      description: 'Advanced document analysis using Azure AI Content Understanding technology.'
    },
    {
      icon: CheckCircle,
      title: 'Real-time Processing',
      description: 'Instant feedback on document validation with detailed analysis results.'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">DocValidator</h1>
              <p className="text-sm text-muted-foreground">EAI Document Validation</p>
            </div>
          </div>
          <Button onClick={() => router.push('/auth')} className="btn-primary">
            Get Started
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
            EAI Document Validation Platform
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Upload, validate, and analyze your documents with AI-powered technology. 
            Built with EAI precision for enterprise security and reliability.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => router.push('/auth')}
              className="btn-primary text-lg px-8 py-3"
            >
              Start Validating
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
                Join thousands of organizations using DocValidator for secure document processing.
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
            <span className="font-semibold">DocValidator</span>
          </div>
          <p className="text-sm text-muted-foreground">
          EAI document validation with enterprise-grade security. Built with React, TypeScript, and Supabase.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
