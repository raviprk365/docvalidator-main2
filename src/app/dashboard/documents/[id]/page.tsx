'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, FileText, Download, Eye, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DocumentPDFViewer } from '@/app/components/dashboard/DocumentPDFViewer'
import { PropertiesPanel } from '@/app/components/dashboard/PropertiesPanel'

interface FileData {
  id: string
  name: string
  size: string
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'analyzed'
  uploadDate: string
  analysisResult?: {
    documentType?: string;
    confidence?: number;
    status?: string;
    processedAt?: string;
    extractedData?: {
      text?: string;
      keyValuePairs?: Array<{ key: string; value: string; confidence: number }>;
      tables?: Array<{ rowCount: number; columnCount: number }>;
    };
    error?: string;
    issues?: string[];
    approved?: boolean;
  }
  metadata?: Record<string, string>
  url?: string
}

const mockFiles: FileData[] = [
  {
    id: '1',
    name: 'contract_v2.pdf',
    size: '2.4 MB',
    status: 'approved',
    uploadDate: '2024-01-15 14:30',
    url: '/api/get-sas-url/contract_v2.pdf',
    analysisResult: {
      documentType: 'Contract',
      confidence: 0.95,
      status: 'completed',
      processedAt: '2024-01-15 14:35',
      extractedData: {
        text: 'This is a contract between Party A and Party B...',
        keyValuePairs: [
          { key: 'DocType', value: 'Contract', confidence: 0.95 },
          { key: 'Date', value: '2024-01-15', confidence: 0.92 },
          { key: 'Amount', value: '$10,000', confidence: 0.88 },
          { key: 'PartyA', value: 'ABC Corporation', confidence: 0.94 },
          { key: 'PartyB', value: 'XYZ Limited', confidence: 0.91 }
        ],
        tables: [
          { rowCount: 5, columnCount: 3 }
        ]
      },
      issues: [],
      approved: true
    },
    metadata: {
      'uploadedBy': 'john.doe@company.com',
      'department': 'Legal',
      'category': 'Contract'
    }
  },
  {
    id: '2',
    name: 'invoice_2024.pdf',
    size: '1.2 MB',
    status: 'processing',
    uploadDate: '2024-01-15 15:20',
    url: '/api/get-sas-url/invoice_2024.pdf',
    metadata: {
      'uploadedBy': 'jane.smith@company.com',
      'department': 'Finance'
    }
  }
]

export default function DocumentViewPage() {
  const params = useParams()
  const documentId = params.id as string
  const [document, setDocument] = useState<FileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchDocument = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // First get the list of files to find our document
        const filesResponse = await fetch('/api/get-files')
        if (!filesResponse.ok) {
          throw new Error('Failed to fetch files')
        }
        
        const filesData = await filesResponse.json()
        const foundDocument = filesData.files?.find((f: FileData) => f.id === documentId)
        
        if (foundDocument) {
          // If the document doesn't have a URL, generate one
          if (!foundDocument.url) {
            try {
              const sasResponse = await fetch(`/api/get-document-url?fileName=${encodeURIComponent(foundDocument.name)}`)
              if (sasResponse.ok) {
                const sasData = await sasResponse.json()
                foundDocument.url = sasData.url
              }
            } catch (sasError) {
              console.error('Error generating SAS URL:', sasError)
            }
          }
          setDocument(foundDocument)
        } else {
          // Fallback to mock data
          const mockDocument = mockFiles.find(f => f.id === documentId)
          if (mockDocument) {
            // Try to generate SAS URL for mock document too
            try {
              const sasResponse = await fetch(`/api/get-document-url?fileName=${encodeURIComponent(mockDocument.name)}`)
              if (sasResponse.ok) {
                const sasData = await sasResponse.json()
                mockDocument.url = sasData.url
              }
            } catch (sasError) {
              console.error('Error generating SAS URL for mock document:', sasError)
            }
            setDocument(mockDocument)
          } else {
            setError('Document not found')
          }
        }
      } catch (err) {
        console.error('Error fetching document:', err)
        // Final fallback to mock data
        const mockDocument = mockFiles.find(f => f.id === documentId)
        if (mockDocument) {
          setDocument(mockDocument)
        } else {
          setError('Document not found')
        }
      } finally {
        setLoading(false)
      }
    }

    if (documentId) {
      fetchDocument()
    }
  }, [documentId])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'analyzed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'processing':
        return <Clock className="w-4 h-4 text-yellow-500" />
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-gray-500" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-600 text-white hover:bg-green-700">Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-600 text-white hover:bg-red-700">Rejected</Badge>
      case 'processing':
        return <Badge className="bg-yellow-600 text-white hover:bg-yellow-700">Processing</Badge>
      case 'analyzed':
        return <Badge className="bg-green-600 text-white hover:bg-green-700">Analyzed</Badge>
      case 'pending':
        return <Badge className="bg-gray-600 text-white hover:bg-gray-700">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-medium mb-2">Loading document...</h3>
              <p className="text-muted-foreground">Please wait while we fetch the document details</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !document) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Document not found</h3>
              <p className="text-muted-foreground mb-4">{error || 'The requested document could not be found'}</p>
              <Link href="/dashboard">
                <Button>Back to Dashboard</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center space-x-2">
                {getStatusIcon(document.status)}
                <span>{document.name}</span>
              </h1>
              <p className="text-muted-foreground">
                Uploaded on {new Date(document.uploadDate).toLocaleDateString()} at {new Date(document.uploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(document.status)}
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-200px)]">
          {/* PDF Viewer - Left Side (2/3 width) */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Document Viewer</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 p-0">
                <DocumentPDFViewer 
                  fileUrl={document.url || ''}
                  fileName={document.name}
                />
              </CardContent>
            </Card>
          </div>

          {/* Properties Panel - Right Side (1/3 width) */}
          <div className="lg:col-span-1">
            <PropertiesPanel document={document} />
          </div>
        </div>
      </div>
    </div>
  )
}