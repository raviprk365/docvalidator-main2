import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent } from '@/components/ui/tabs'
import { Eye, EyeOff, FileText, Lock, Mail } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import { useToast } from '../ui/use-toast'

interface User {
  id: string;
  email: string;
  password: string;
  role: string;
  created_at: string;
}

const adminUser: User = {
  id: 'admin',
  email: 'admin@nexapproveiq.com.au',
  password: "NexAdmin@2025",
  role: 'admin',
  created_at: new Date().toISOString()
};
const user: User = {
  id: 'user',
  email: 'serviceaccount@nexapproveiq.com.au',
  password: "NexUser@2025",
  role: 'user',
  created_at: new Date().toISOString()
};
export function AuthForm() {

  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast()
  const router = useRouter()

  const setLogin = useAuthStore((state) => state.login)

  const handleSubmit = async (type: 'signin', e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const setCookie = async (user: User) => {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ "email": user.email, "role": user.role }),
      });
      return response;
    };
    if (email === adminUser.email && password === adminUser.password) {
      setLogin(adminUser.email, adminUser.role); // Set isLogin to true in zustand
      setCookie(adminUser);
      toast({
        title: "Signed in successfully",
        description: "Welcome back to EAI Document Intelligence."
      });
      router.push('/dashboard'); // Navigate to dashboard
    } else if (email === user.email && password === user.password) {
      setLogin(user.email, user.role);
      setCookie(user);
      toast({
        title: "Signed in successfully",
        description: "Welcome back to EAI Document Intelligence."
      });
      router.push('/dashboard'); // Navigate to dashboard
    } else {
      toast({
        title: "Authentication Failed",
        description: "Invalid email or password. Please try again.",
      });
      setError("Invalid email or password");
      setIsLoading(false);
    }

    // // Simulate loading time
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4 relative">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <svg className="animate-spin h-10 w-10 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
          </svg>
        </div>
      )}
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-semibold">EAI Document Intelligence</h1>
          <p className="text-muted-foreground">Azure-Native Platform</p>
        </div>

        <Card className="card-elevated">
          <CardHeader className="text-center">
            <CardTitle>Welcome</CardTitle>
            <CardDescription>
              Sign in to your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              {/* <TabsList className="grid w-full grid-cols-1 mb-6"> */}
              {/* <TabsTrigger value="signin">Sign In</TabsTrigger> */}
              {/* <TabsTrigger value="signup">Sign Up</TabsTrigger> */}
              {/* </TabsList> */}

              <TabsContent value="signin">
                {error && (
                  <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 rounded-md">
                    {error}
                  </div>
                )}
                <form onSubmit={(e) => handleSubmit('signin', e)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signin-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>

              {/* <TabsContent value="signup">
                <form onSubmit={(e) => handleSubmit('signup', e)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="your@email.com"
                        className="pl-10"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="signup-password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        className="pl-10 pr-10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 6 characters long
                    </p>
                  </div>

                  <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                    {isLoading ? "Creating account..." : "Create Account"}
                  </Button>
                </form>
              </TabsContent> */}
            </Tabs>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          EAI document validation with enterprise-grade authentication
        </p>
      </div>
    </div>
  )
}