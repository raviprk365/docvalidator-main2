'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Eye, FileText, Folder } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CreateFolderModal } from './CreateFolderModal'

interface BlobFolder {
  name: string
  displayName: string
  fileCount: number
  totalSize: string
  lastModified: string
}

export function FolderGrid() {
  const [folders, setFolders] = useState<BlobFolder[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasFetched, setHasFetched] = useState(false)
  const router = useRouter()


  useEffect(() => {
    if (!hasFetched) {
      fetchFolders()
    }
  }, [hasFetched])

  const fetchFolders = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/get-blob-folders')
      if (!response.ok) {
        throw new Error('Failed to fetch folders')
      }

      const data = await response.json()
      setFolders(data.folders || [])
      setHasFetched(true)
    } catch (err) {
      console.error('Error fetching folders:', err)
      setError('Failed to load folders')
    } finally {
      setLoading(false)
    }
  }

  const handleViewFolder = (folderName: string) => {
    if (folderName === 'root') {
      router.push('/dashboard')
    } else {
      router.push(`/dashboard?folder=${encodeURIComponent(folderName)}`)
    }
  }

  const handleFolderCreated = (folderName: string) => {
    // Add the new folder to the existing list instead of refetching all folders
    const newFolder: BlobFolder = {
      name: folderName,
      displayName: folderName,
      fileCount: 0,
      totalSize: '0 Bytes',
      lastModified: new Date().toISOString(),
    }

    setFolders(prev => {
      // Check if folder already exists to avoid duplicates
      if (prev.some(folder => folder.name === folderName)) {
        return prev
      }
      // Add new folder and sort alphabetically
      const updatedFolders = [...prev, newFolder]
      return updatedFolders.sort((a, b) => a.name.localeCompare(b.name))
    })
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      if (date.getTime() === 0) return 'No files'
      return date.toLocaleDateString()
    } catch {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading folders...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={fetchFolders} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="animate-fade-in">
        <div className="flex flex-col items-start md:flex-row md:items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-semibold mb-2">Applications</h1>
            <p className="text-muted-foreground">
              Select an application to view and manage your documents, or create a new one
            </p>
          </div>
          <CreateFolderModal onFolderCreated={handleFolderCreated} />
        </div>
      </div>

      {/* Folders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-slide-up">
        {folders.map((folder, index) => (
          <Card
            key={folder.name}
            className="card-minimal hover:shadow-md transition-shadow cursor-pointer"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-muted rounded-lg flex items-center justify-center">
                  <Folder className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{folder.displayName}</CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Stats */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Files:</span>
                  </div>
                  <span className="font-medium">{folder.fileCount}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Size:</span>
                  </div>
                  <span className="font-medium">{folder.totalSize}</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Last modified:</span>
                  <span className="font-medium">{formatDate(folder.lastModified)}</span>
                </div>
              </div>

              {/* View Button */}
              <Button
                onClick={() => handleViewFolder(folder.name)}
                className="w-full"
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Files
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {folders.length === 0 && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Folder className="w-12 h-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-2">No applications found</h3>
          <p className="text-muted-foreground mb-4">
            Create your first application to start organizing your documents.
          </p>
          <CreateFolderModal onFolderCreated={handleFolderCreated} />
        </div>
      )}
    </div>
  )
}