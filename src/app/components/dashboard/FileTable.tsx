import { useState, useEffect } from 'react'
import { FileText, Eye, CheckCircle, XCircle, Clock, AlertCircle, ExternalLink, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DocumentViewer } from './DocumentViewer'
import { DocumentModal } from './DocumentModal'

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
    analysisResult: {
      documentType: 'Contract',
      confidence: 0.95,
      issues: [],
      approved: true
    }
  },
  {
    id: '2',
    name: 'invoice_2024.pdf',
    size: '1.2 MB',
    status: 'processing',
    uploadDate: '2024-01-15 15:20',
  },
  {
    id: '3',
    name: 'identity_doc.jpg',
    size: '856 KB',
    status: 'rejected',
    uploadDate: '2024-01-15 16:10',
    analysisResult: {
      documentType: 'Identity Document',
      confidence: 0.65,
      issues: ['Poor image quality', 'Partially obscured text'],
      approved: false
    }
  },
  {
    id: '4',
    name: 'bank_statement.pdf',
    size: '3.1 MB',
    status: 'pending',
    uploadDate: '2024-01-15 16:45',
  }
]

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
      return <Badge className="status-success">Approved</Badge>
    case 'rejected':
      return <Badge className="status-error">Rejected</Badge>
    case 'processing':
      return <Badge className="status-warning">Processing</Badge>
    case 'analyzed':
      return <Badge className="bg-green-600 text-white hover:bg-green-700">Analyzed</Badge>
    case 'pending':
      return <Badge className="status-pending">Pending</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function FileTable() {
  const [files, setFiles] = useState<FileData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<FileData | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDocument, setModalDocument] = useState<FileData | null>(null)
  const [isPolling, setIsPolling] = useState(false)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchFiles()
    startPolling()
    
    // Cleanup polling on unmount
    return () => {
      stopPolling()
    }
  }, [])

  // Restart polling when processing status changes
  useEffect(() => {
    const hasProcessingFiles = files.some(file => file.status === 'processing' || file.status === 'pending')
    
    if (hasProcessingFiles && !isPolling) {
      startPolling()
    } else if (!hasProcessingFiles && isPolling) {
      stopPolling()
    }
  }, [files, isPolling])

  const fetchFiles = async (isBackgroundRefresh = false) => {
    try {
      if (!isBackgroundRefresh) {
        setLoading(true)
        setError(null)
      }
      
      const response = await fetch('/api/get-files')
      
      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }
      
      const data = await response.json()
      const newFiles = data.files || []
      
      // Check if any file status has changed (for background refresh)
      if (isBackgroundRefresh && files.length > 0) {
        const hasStatusChanges = newFiles.some((newFile: FileData) => {
          const oldFile = files.find(f => f.id === newFile.id)
          return oldFile && oldFile.status !== newFile.status
        })
        
        if (hasStatusChanges) {
          console.log('File status changes detected, refreshing...')
        }
      }
      
      setFiles(newFiles)
    } catch (err) {
      console.error('Error fetching files:', err)
      if (!isBackgroundRefresh) {
        setError(err instanceof Error ? err.message : 'Unknown error')
        // Fallback to mock data if API fails
        setFiles(mockFiles)
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false)
      }
    }
  }

  const startPolling = () => {
    if (refreshInterval) return // Prevent multiple intervals
    
    setIsPolling(true)
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/get-files')
        if (response.ok) {
          const data = await response.json()
          const newFiles = data.files || []
          
          // Check if any processing files have completed
          const hasStatusChanges = newFiles.some((newFile: FileData) => {
            const currentFile = files.find(f => f.id === newFile.id)
            return currentFile && currentFile.status !== newFile.status
          })
          
          if (hasStatusChanges) {
            console.log('Analysis status changes detected, updating files...')
            setFiles(newFiles)
          }
        }
      } catch (error) {
        console.error('Polling error:', error)
      }
    }, 5000) // Poll every 5 seconds
    
    setRefreshInterval(interval)
  }

  const stopPolling = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval)
      setRefreshInterval(null)
      setIsPolling(false)
    }
  }

  // Manual refresh function
  const handleManualRefresh = () => {
    fetchFiles(false)
  }

  const handleViewDocument = (file: FileData) => {
    setSelectedFile(file)
    setViewerOpen(true)
  }

  const handleCloseViewer = () => {
    setViewerOpen(false)
    setSelectedFile(null)
  }

  const handleDelete = (id: string) => {
    // Handle file deletion
    console.log('Delete file:', id)
  }

  const handleDownload = (id: string) => {
    // Handle file download
    console.log('Download file:', id)
  }

  const handleOpenModal = (file: FileData) => {
    setModalDocument(file)
    setModalOpen(true)
  }

  const handleCloseModal = () => {
    setModalOpen(false)
    setModalDocument(null)
  }

  const getDocumentUrl = async (fileName: string): Promise<string | null> => {
    try {
      const response = await fetch(`/api/get-document-url?fileName=${encodeURIComponent(fileName)}`)
      if (!response.ok) {
        throw new Error('Failed to get document URL')
      }
      const data = await response.json()
      return data.url
    } catch (error) {
      console.error('Error getting document URL:', error)
      return null
    }
  }

  const handleViewDocumentWithSAS = async (file: FileData) => {
    // If the file already has a valid URL, use it
    if (file.url) {
      setSelectedFile(file)
      setViewerOpen(true)
      return
    }

    // Otherwise, generate a new SAS URL
    const url = await getDocumentUrl(file.name)
    if (url) {
      const fileWithUrl = { ...file, url }
      setSelectedFile(fileWithUrl)
      setViewerOpen(true)
    } else {
      alert('Unable to generate document URL. Please try again later.')
    }
  }

  const handleOpenModalWithSAS = async (file: FileData) => {
    // If the file already has a valid URL, use it
    if (file.url) {
      setModalDocument(file)
      setModalOpen(true)
      return
    }

    // Otherwise, generate a new SAS URL
    const url = await getDocumentUrl(file.name)
    if (url) {
      const fileWithUrl = { ...file, url }
      setModalDocument(fileWithUrl)
      setModalOpen(true)
    } else {
      alert('Unable to generate document URL. Please try again later.')
    }
  }

  return (
    <Card className="card-minimal">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <FileText className="w-5 h-5" />
            <span>Uploaded Documents</span>
            {isPolling && (
              <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3 animate-pulse" />
                <span>Auto-refreshing...</span>
              </div>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={loading}
            className="flex items-center space-x-1"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Loading documents...</h3>
            <p className="text-muted-foreground">Fetching your uploaded files</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error loading documents</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={fetchFiles}>Try Again</Button>
          </div>
        ) : (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document Name</TableHead>
                  <TableHead>Document Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => (
                <TableRow key={file.id} className="animate-fade-in">
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(file.status)}
                      <span className="font-medium">{file.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {file.analysisResult?.documentType || file.metadata?.documenttype || 'Unknown'}
                      </span>
                      {typeof file.analysisResult?.confidence === 'number' && (
                        <span className="text-xs text-muted-foreground">
                          {(file.analysisResult.confidence * 100).toFixed(1)}% confidence
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(file.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(file.uploadDate).toLocaleDateString()} {new Date(file.uploadDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {/* Modal View Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleOpenModalWithSAS(file)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>

                      {/* View Document Page Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(`/dashboard/documents/${file.id}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      
                      {/* Quick Preview Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewDocumentWithSAS(file)}
                      >
                        <FileText className="w-4 h-4" />
                      </Button>
                      
                      {/* Analysis Results Button */}
                      {file.analysisResult && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>Analysis Results</DialogTitle>
                              <DialogDescription>
                                Detailed validation results for {file.name}
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="p-4 bg-muted rounded-lg">
                                <h4 className="font-medium mb-2">Document Information</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <span className="text-muted-foreground">Type:</span>
                                    <span className="ml-2 font-medium">{file.analysisResult.documentType || 'Unknown'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Confidence:</span>
                                    <span className="ml-2 font-medium">
                                      {file.analysisResult.confidence ? 
                                        `${(file.analysisResult.confidence * 100).toFixed(1)}%` : 
                                        'N/A'}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Status:</span>
                                    <span className="ml-2 font-medium">{file.analysisResult.status || 'Unknown'}</span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Processed:</span>
                                    <span className="ml-2 font-medium">
                                      {file.analysisResult.processedAt ? 
                                        new Date(file.analysisResult.processedAt).toLocaleString() : 
                                        'N/A'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {file.analysisResult.extractedData?.keyValuePairs && file.analysisResult.extractedData.keyValuePairs.length > 0 && (
                                <div className="p-4 bg-card border rounded-lg">
                                  <h4 className="font-medium mb-2">Extracted Key-Value Pairs</h4>
                                  <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {file.analysisResult.extractedData.keyValuePairs.map((pair: { key: string; value: string; confidence: number }, index: number) => (
                                      <div key={index} className="flex justify-between items-start text-sm">
                                        <span className="font-medium text-muted-foreground min-w-0 flex-1 mr-2">
                                          {pair.key}:
                                        </span>
                                        <span className="text-right min-w-0 flex-2">
                                          {pair.value} 
                                          {pair.confidence && (
                                            <span className="text-xs text-muted-foreground ml-1">
                                              ({Math.round(pair.confidence * 100)}%)
                                            </span>
                                          )}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {file.analysisResult.extractedData?.tables && file.analysisResult.extractedData.tables.length > 0 && (
                                <div className="p-4 bg-card border rounded-lg">
                                  <h4 className="font-medium mb-2">Extracted Tables</h4>
                                  <p className="text-sm text-muted-foreground">
                                    Found {file.analysisResult.extractedData.tables.length} table(s)
                                  </p>
                                  {file.analysisResult.extractedData.tables.map((table: { rowCount: number; columnCount: number }, index: number) => (
                                    <div key={index} className="mt-2 text-xs">
                                      Table {index + 1}: {table.rowCount} rows × {table.columnCount} columns
                                    </div>
                                  ))}
                                </div>
                              )}

                              {file.analysisResult.extractedData?.text && (
                                <div className="p-4 bg-card border rounded-lg">
                                  <h4 className="font-medium mb-2">Extracted Text (Preview)</h4>
                                  <div className="text-xs bg-muted p-3 rounded max-h-40 overflow-y-auto">
                                    {file.analysisResult.extractedData.text.substring(0, 500)}
                                    {file.analysisResult.extractedData.text.length > 500 && '...'}
                                  </div>
                                </div>
                              )}
                              
                              {file.analysisResult.error && (
                                <div className="p-4 bg-destructive-muted rounded-lg">
                                  <h4 className="font-medium mb-2 text-destructive">Error</h4>
                                  <p className="text-sm text-destructive">{file.analysisResult.error}</p>
                                </div>
                              )}
                              
                              <div className="p-4 bg-card border rounded-lg">
                                <h4 className="font-medium mb-2">Raw Analysis Data</h4>
                                <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-60">
                                  {JSON.stringify(file.analysisResult, null, 2)}
                                </pre>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(file.id)}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button> */}
                    </div>
                  </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        
        {!loading && !error && files.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No documents uploaded</h3>
            <p className="text-muted-foreground">Upload your first document to get started</p>
          </div>
        )}
      </CardContent>
      
      {/* Document Viewer */}
      {selectedFile && (
        <DocumentViewer
          isOpen={viewerOpen}
          onClose={handleCloseViewer}
          fileUrl={selectedFile.url || ''}
          fileName={selectedFile.name}
        />
      )}

      {/* Document Modal */}
      <DocumentModal
        isOpen={modalOpen}
        onClose={handleCloseModal}
        document={modalDocument}
      />
    </Card>
  )
}