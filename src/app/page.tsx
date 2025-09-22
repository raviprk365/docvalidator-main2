'use client'

import { ArrowRight, Brain, Gauge, Lock, Shield, Sparkles } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from './components/ui/button'
import { useAuthStore } from './store/authStore'

type User = {
  email: string
  role: string
}

const Index = () => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const isLogin = useAuthStore((state) => state.isLogin)
  const email = useAuthStore((state) => state.email)
  const role = useAuthStore((state) => state.role)
  const login = useAuthStore((state) => state.login)

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        if (isLogin && email && role) {
          setUser({ email, role })
          router.push('/folders')
          return
        }

        const response = await fetch('/api/login')
        const data = await response.json()

        if (data.user?.email && data.user?.role) {
          login(data.user.email, data.user.role)
          setUser({ email: data.user.email, role: data.user.role })
          router.push('/folders')
          return
        }

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

  const capabilities = [
    {
      number: "01",
      title: 'Intelligent Document Processing',
      description: 'Advanced machine learning algorithms automatically understand document structure, extract key information, and categorize content with unmatched precision.',
      highlight: 'Smart Recognition'
    },
    {
      number: "02",
      title: 'Zero-Trust Security Framework',
      description: 'Military-grade encryption and Azure cloud infrastructure ensure your sensitive documents remain protected with end-to-end security protocols.',
      highlight: 'Bank-Level Security'
    },
    {
      number: "03",
      title: 'Lightning-Fast Validation Engine',
      description: 'Real-time processing with custom business logic validation delivers instant results while maintaining accuracy across complex document workflows.',
      highlight: 'Instant Results'
    }
  ]

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-accent/5 rounded-full blur-2xl"></div>
        </div>

        <div className="container mx-auto px-6 py-20 lg:py-32">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-16">
            {/* Left: Text Content */}
            <div className="flex-1 text-center lg:text-left space-y-8 animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center space-x-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 px-6 py-3 text-sm backdrop-blur-sm">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-primary font-medium">Powered by Azure AI</span>
              </div>

              {/* Main Heading */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  <span className="bg-gradient-to-r from-primary via-blue-600 to-indigo-600 bg-clip-text text-transparent font-black">
                    NexApprove
                  </span>
                  <br />
                  <span className="text-foreground">Document Intelligence</span>
                </h1>

                <div className="w-24 h-1 bg-gradient-to-r from-primary to-blue-500 rounded-full mx-auto lg:mx-0"></div>
              </div>

              {/* Description */}
              <p className="text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-2xl">
                Transform unstructured content into trusted, actionable data with
                <span className="text-primary font-semibold"> Azure-native AI</span>.
                Secure, fast, and built for enterprises.
              </p>

              {/* CTA Button */}
              <div className="flex justify-center lg:justify-start pt-4">
                <Button
                  size="lg"
                  onClick={() => router.push('/auth')}
                  className="btn-primary group px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Get Started
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </div>
            </div>

            {/* Right: Illustration */}
            <div className="flex-1 relative animate-fade-in" style={{ animationDelay: '300ms' }}>
              <div className="relative">
                {/* Main image container with modern styling */}
                <div className="relative bg-gradient-to-br from-card to-card/50 rounded-3xl shadow-2xl border border-border/50 backdrop-blur-sm overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent"></div>
                  <Image
                    src="/illustrative-image.png"
                    alt="Document Intelligence Illustration"
                    width={600}
                    height={400}
                    className="w-full h-auto rounded-3xl relative z-10"
                  />
                </div>

                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-primary/20 animate-bounce">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>

                <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-secondary/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-secondary/20 animate-pulse">
                  <Shield className="w-6 h-6 text-secondary" />
                </div>

                {/* Glow effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-blue-500/20 rounded-3xl blur-3xl -z-10 opacity-30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted/10 via-background to-primary/5"></div>

        <div className="container mx-auto px-6 relative">
          {/* Section Header */}
          <div className="text-center mb-20">
            <div className="inline-flex items-center space-x-2 rounded-full bg-primary/10 px-4 py-2 text-sm mb-6">
              <Brain className="w-4 h-4 text-primary" />
              <span className="text-primary font-medium">Core Capabilities</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Why choose <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">NexApprove</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Experience the next generation of document intelligence with our cutting-edge platform designed for modern enterprises.
            </p>
          </div>

          {/* Capabilities Grid */}
          <div className="space-y-16">
            {capabilities.map((capability, index) => (
              <div
                key={capability.number}
                className={`flex flex-col lg:flex-row items-center gap-12 ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''
                  }`}
              >
                {/* Content */}
                <div className="flex-1 space-y-6 text-center lg:text-left">
                  <div className="space-y-2">
                    <div className="inline-flex items-center space-x-3">
                      <span className="text-6xl font-black text-primary/20">{capability.number}</span>
                      <div className="bg-gradient-to-r from-primary to-blue-500 px-3 py-1 rounded-full text-xs font-semibold text-white">
                        {capability.highlight}
                      </div>
                    </div>
                    <h3 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
                      {capability.title}
                    </h3>
                  </div>
                  <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                    {capability.description}
                  </p>
                </div>

                {/* Visual Element */}
                <div className="flex-1 relative">
                  <div className="relative bg-gradient-to-br from-card to-muted/20 rounded-2xl p-8 border border-border/50 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl"></div>

                    {/* Icon representation */}
                    <div className="relative z-10 flex items-center justify-center h-48">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary/20 to-blue-500/20 rounded-2xl flex items-center justify-center">
                        {index === 0 && <Brain className="w-12 h-12 text-primary" />}
                        {index === 1 && <Lock className="w-12 h-12 text-primary" />}
                        {index === 2 && <Gauge className="w-12 h-12 text-primary" />}
                      </div>
                    </div>

                    {/* Floating elements */}
                    <div className="absolute top-4 right-4 w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center animate-pulse">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>

                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">
          Ready to automate document validation?
        </h2>
        <p className="mb-8 text-primary-foreground/80 max-w-2xl mx-auto">
          Join leading organizations that trust NexApprove to securely process
          and validate millions of documents every day.
        </p>
        {/* <Button
          size="lg"
          variant="secondary"
          onClick={() => router.push('/auth')}
          className="px-10 py-4 text-lg"
        >
          Create Your Account
        </Button> */}
      </section>
    </div>
  )
}

export default Index
