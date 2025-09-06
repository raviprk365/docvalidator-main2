import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileText, Upload, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileTable } from './FileTable'
import { UploadArea } from '../upload/UploadArea'
import { CardFooter } from '../ui/card'
import { Button } from '../ui/button'
type DummyUser = {
  id: string
  email: string
  created_at: string
}

interface DashboardStats {
  totalFiles: number
  approvedFiles: number
  rejectedFiles: number
  pendingFiles: number
  analyzedFiles: number
}

interface FileData {
  id: string
  name: string
  size: string
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'analyzed'
  uploadDate: string
  analysisResult?: Record<string, unknown>
  metadata?: Record<string, string>
  url?: string
}

export function Dashboard() {
  const [user, setUser] = useState<DummyUser | null>(null)
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats>({
    totalFiles: 0,
    approvedFiles: 0,
    rejectedFiles: 0,
    pendingFiles: 0,
    analyzedFiles: 0
  })
  const [, setFiles] = useState<FileData[]>([])
  const [, setLoading] = useState(true)

  useEffect(() => {
    // Get dummy user from localStorage
    const dummyUserData = localStorage.getItem('dummy-user')
    if (dummyUserData) {
      setUser(JSON.parse(dummyUserData))
    }
    fetchFilesAndUpdateStats()
  }, [])

  const fetchFilesAndUpdateStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/get-files')
      
      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }
      
      const data = await response.json()
      const filesList = data.files || []
      setFiles(filesList)
      
      // Calculate real stats from fetched files
      const newStats = filesList.reduce(
        (acc: DashboardStats, file: FileData) => {
          acc.totalFiles++
          switch (file.status) {
            case 'approved':
              acc.approvedFiles++
              break
            case 'rejected':
              acc.rejectedFiles++
              break
            case 'analyzed':
              acc.analyzedFiles++
              break
            case 'pending':
            case 'processing':
            default:
              acc.pendingFiles++
              break
          }
          return acc
        },
        { totalFiles: 0, approvedFiles: 0, rejectedFiles: 0, pendingFiles: 0, analyzedFiles: 0 }
      )
      
      setStats(newStats)
    } catch (error) {
      console.error('Error fetching files:', error)
      // Keep loading false but don't update stats in case of error
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Documents',
      value: stats.totalFiles,
      icon: FileText,
      color: 'text-primary',
      bgColor: 'bg-primary-muted'
    },
    {
      title: 'Analyzed',
      value: stats.analyzedFiles,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Approved',
      value: stats.approvedFiles,
      icon: CheckCircle,
      color: 'text-success',
      bgColor: 'bg-success-muted'
    },
    {
      title: 'Rejected',
      value: stats.rejectedFiles,
      icon: XCircle,
      color: 'text-destructive',
      bgColor: 'bg-destructive-muted'
    },
    {
      title: 'Pending',
      value: stats.pendingFiles,
      icon: Clock,
      color: 'text-warning',
      bgColor: 'bg-warning-muted'
    }
  ]

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Welcome Section */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-semibold mb-2">Upload and Validate Documents</h1>
        <p className="text-muted-foreground">
          Upload your documents for AI-powered validation and analysis
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 animate-slide-up">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="card-minimal" style={{ animationDelay: `${index * 100}ms` }}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`w-8 h-8 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload Section */}
      <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2 flex items-center space-x-2">
            <Upload className="w-5 h-5" />
            <span>Upload Options</span>
          </h2>
          <p className="text-muted-foreground">
            Choose single file upload or drag and drop multiple files for bulk processing
          </p>
        </div>
        <UploadArea />
      </div>

      {/**Analysis Section */}
        <Card className="card-minimal">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Document Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border p-4">
            <p className="text-muted-foreground">
              After uploading, documents are analyzed using AI to extract key information and validate authenticity.
              Results are displayed in the document management section below.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push('/analysis')}
          >
            View Analysis Results
          </Button>
        </CardFooter>
      </Card>

      {/* File Management Section */}
      <div className="animate-slide-up" style={{ animationDelay: '400ms' }}>
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Document Management</h2>
          <p className="text-muted-foreground">
            View, manage, and analyze your uploaded documents
          </p>
        </div>
        <FileTable />
      </div>
    </div>
  )
}