import React, { useState, useEffect } from 'react'
import { FileText, ChevronDown, ChevronRight, AlertCircle, CheckCircle, XCircle, Clock, Info } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card'
import { Badge } from '@/app/components/ui/badge'
import { Button } from '@/app/components/ui/button'
import { Progress } from '@/app/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/app/components/ui/table'

interface DocumentAnalysis {
  id: string
  name: string
  type: string
  matchPercentage: number
  criteria: string
  approvalStatus: 'Approved' | 'Rejected' | 'Pending' | 'N/A'
  action: string
  isExpanded?: boolean
  details?: {
    extractedFields?: Array<{
      field: string
      value: string
      confidence: number
    }>
    issues?: string[]
    recommendations?: string[]
  }
}

interface AnalysisSummary {
  totalFiles: number
  matchedFiles: number
  majorErrors: number
  overallProgress: number
}

interface UnmappedFile {
  name: string
  type: string
  size: string
}

// Mock data matching the reference image
const mockAnalysisSummary: AnalysisSummary = {
  totalFiles: 6,
  matchedFiles: 6,
  majorErrors: 3,
  overallProgress: 100,
}

const mockUnmappedFiles: UnmappedFile[] = [
  { name: 'PQRS-defGHI.pdf', type: 'pdf', size: '2.4MB' },
  { name: 'PQRS-defGHI_09.pdf', type: 'pdf', size: '1.8MB' },
  { name: 'Image-upload_001.jpg', type: 'image', size: '856KB' },
  { name: 'TUVW.pdf', type: 'pdf', size: '3.2MB' },
]

const mockAnalysisResults: DocumentAnalysis[] = [
  {
    id: '1',
    name: 'BANK Certificate',
    type: 'Certificate',
    matchPercentage: 100,
    criteria: 'N/A',
    approvalStatus: 'N/A',
    action: '...',
    details: {
      extractedFields: [
        { field: 'Bank Name', value: 'First National Bank', confidence: 95 },
        { field: 'Account Number', value: '****1234', confidence: 98 },
        { field: 'Issue Date', value: '2024-01-15', confidence: 92 }
      ]
    }
  },
  {
    id: '2',
    name: 'Verification plan',
    type: 'Plan Document',
    matchPercentage: 92,
    criteria: '8/9',
    approvalStatus: 'Rejected',
    action: '...',
    details: {
      extractedFields: [
        { field: 'Plan Type', value: 'Verification Plan', confidence: 89 },
        { field: 'Version', value: 'v2.1', confidence: 94 }
      ],
      issues: ['Missing signature', 'Incomplete section 4.2']
    }
  },
  {
    id: '3',
    name: 'Owners consent',
    type: 'Consent Form',
    matchPercentage: 89,
    criteria: '8/9',
    approvalStatus: 'Approved',
    action: '...',
    details: {
      extractedFields: [
        { field: 'Owner Name', value: 'John Smith', confidence: 96 },
        { field: 'Property Address', value: '123 Main St', confidence: 91 },
        { field: 'Consent Date', value: '2024-01-10', confidence: 88 }
      ]
    }
  },
  {
    id: '4',
    name: 'Suitability report',
    type: 'Report',
    matchPercentage: 94,
    criteria: '9/9',
    approvalStatus: 'Approved',
    action: '...',
    details: {
      extractedFields: [
        { field: 'Report Type', value: 'Suitability Assessment', confidence: 97 },
        { field: 'Assessment Score', value: '8.5/10', confidence: 93 },
        { field: 'Reviewer', value: 'Jane Doe', confidence: 95 }
      ]
    }
  },
  {
    id: '5',
    name: 'Statement of environmental effects',
    type: 'Environmental Statement',
    matchPercentage: 0,
    criteria: 'N/A',
    approvalStatus: 'Approved',
    action: '...',
    details: {
      issues: ['Missing file - file not found or corrupted'],
      recommendations: ['Re-upload the document', 'Ensure file is not corrupted']
    }
  }
]

export function DocumentAnalysisView() {
  const [analysisResults, setAnalysisResults] = useState<DocumentAnalysis[]>([])
  const [analysisSummary, setAnalysisSummary] = useState<AnalysisSummary>(mockAnalysisSummary)
  const [unmappedFiles, setUnmappedFiles] = useState<UnmappedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalysisData()
  }, [])

  const fetchAnalysisData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/analysis-summary')
      
      if (!response.ok) {
        throw new Error('Failed to fetch analysis data')
      }
      
      const data = await response.json()
      
      // Update state with real data
      setAnalysisSummary({
        totalFiles: data.summary.totalFiles,
        matchedFiles: data.summary.analyzedFiles,
        majorErrors: data.summary.majorErrors,
        overallProgress: data.summary.overallProgress
      })
      
      setAnalysisResults(data.analysisResults || [])
      setUnmappedFiles(data.unmappedFiles || [])
      
    } catch (err) {
      console.error('Error fetching analysis data:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      // Fallback to mock data
      setAnalysisResults(mockAnalysisResults)
      setUnmappedFiles(mockUnmappedFiles)
    } finally {
      setLoading(false)
    }
  }

  const toggleExpand = (id: string) => {
    setAnalysisResults(prev =>
      prev.map(item =>
        item.id === id ? { ...item, isExpanded: !item.isExpanded } : item
      )
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'Rejected':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'Pending':
        return <Clock className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Approved</Badge>
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Rejected</Badge>
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pending</Badge>
      default:
        return <Badge variant="secondary">N/A</Badge>
    }
  }

  const getMatchBadge = (percentage: number) => {
    if (percentage >= 95) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{percentage}%</Badge>
    } else if (percentage >= 85) {
      return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">{percentage}%</Badge>
    } else if (percentage >= 70) {
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{percentage}%</Badge>
    } else if (percentage > 0) {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{percentage}%</Badge>
    } else {
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Missing file</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-spin" />
            <h3 className="text-lg font-medium mb-2">Loading Analysis Data...</h3>
            <p className="text-gray-500">Fetching document analysis results</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error Loading Analysis</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={fetchAnalysisData}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Document review</h1>
        <Button variant="outline" size="sm" onClick={fetchAnalysisData}>
          Refresh
        </Button>
      </div>

      {/* Analysis Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* AI Document Analysis */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">AI Document analysis</p>
                <p className="text-xs text-gray-500 mt-1">{analysisSummary.matchedFiles}/{analysisSummary.totalFiles} files matched</p>
                <p className="text-xs text-gray-500">{analysisSummary.majorErrors} major errors</p>
              </div>
              <div className="flex flex-col items-end">
                <Badge className="bg-green-100 text-green-800 hover:bg-green-100 mb-2">
                  {analysisSummary.overallProgress}%
                </Badge>
                <Progress value={analysisSummary.overallProgress} className="w-12 h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Status */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Review</p>
                <Button variant="outline" size="sm" className="mt-2 h-8 px-3 text-xs">
                  Review
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Unmapped Files */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Unmapped files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {unmappedFiles.map((file, index) => (
              <div
                key={index}
                className="flex flex-col items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 cursor-pointer"
              >
                <FileText className="w-8 h-8 text-gray-400 mb-2" />
                <p className="text-xs font-medium text-gray-900 text-center truncate w-full">{file.name}</p>
                <p className="text-xs text-gray-500">{file.size}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Document Analysis Results</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8"></TableHead>
                <TableHead>Document name</TableHead>
                <TableHead>Document type match</TableHead>
                <TableHead>Criteria</TableHead>
                <TableHead>Approval status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {analysisResults.map((item) => (
                <React.Fragment key={item.id}>
                  <TableRow 
                    className="cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleExpand(item.id)}
                  >
                      <TableCell>
                        {item.isExpanded ? (
                          <ChevronDown className="w-4 h-4" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-400" />
                          <div className="flex flex-col">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-xs text-gray-500">{item.type}</span>
                          </div>
                          <Info className="w-3 h-3 text-gray-400" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {getMatchBadge(item.matchPercentage)}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{item.criteria}</span>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.approvalStatus)}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          {item.action}
                        </Button>
                      </TableCell>
                    </TableRow>
                  
                  {item.isExpanded && (
                    <TableRow>
                      <TableCell colSpan={6} className="bg-gray-50 p-4">
                        <div className="space-y-4">
                          {/* Extracted Fields */}
                          {item.details?.extractedFields && (
                            <div>
                              <h4 className="font-medium text-sm mb-2">Extracted Information</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {item.details.extractedFields.map((field, index) => (
                                  <div key={index} className="bg-white p-3 rounded border">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <p className="font-medium text-sm">{field.field}</p>
                                        <p className="text-sm text-gray-600">{field.value}</p>
                                      </div>
                                      <Badge variant="outline" className="text-xs">
                                        {field.confidence}%
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Issues */}
                          {item.details?.issues && (
                            <div>
                              <h4 className="font-medium text-sm mb-2 text-red-700">Issues Found</h4>
                              <div className="bg-red-50 border border-red-200 rounded p-3">
                                <ul className="space-y-1">
                                  {item.details.issues.map((issue, index) => (
                                    <li key={index} className="text-sm text-red-700 flex items-start gap-2">
                                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                      {issue}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}

                          {/* Recommendations */}
                          {item.details?.recommendations && (
                            <div>
                              <h4 className="font-medium text-sm mb-2 text-blue-700">Recommendations</h4>
                              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                <ul className="space-y-1">
                                  {item.details.recommendations.map((rec, index) => (
                                    <li key={index} className="text-sm text-blue-700 flex items-start gap-2">
                                      <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                      {rec}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}