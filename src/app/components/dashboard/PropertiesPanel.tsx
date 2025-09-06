'use client'

import { useState } from 'react'
import { 
  FileText, 
  Hash, 
  Target, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  Database,
  Table,
  Key,
  Info,
  Settings,
  Tag
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/app/components/ui/separator'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/app/components/ui/collapsible'
import { ScrollArea } from '@/app/components/ui/scroll-area'

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

interface PropertiesPanelProps {
  document: FileData
}

export function PropertiesPanel({ document }: PropertiesPanelProps) {
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    analysis: true,
    extracted: false,
    metadata: false,
    raw: false
  })

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  // Parse blob metadata into structured key-value pairs
  const parseMetadataToKeyValuePairs = (metadata: Record<string, string>) => {
    const kvPairs: Array<{ key: string; value: string; confidence: number }> = []
    
    // Group metadata by key-value pairs (kv0key/kv0value/kv0confidence pattern)
    const kvGroups: Record<string, { key?: string; value?: string; confidence?: string }> = {}
    
    Object.entries(metadata).forEach(([key, value]) => {
      const kvMatch = key.match(/^kv(\d+)(key|value|confidence)$/)
      if (kvMatch) {
        const [, index, type] = kvMatch
        if (!kvGroups[index]) kvGroups[index] = {}
        kvGroups[index][type as keyof typeof kvGroups[string]] = value
      }
    })
    
    // Convert grouped data to key-value pairs
    Object.values(kvGroups).forEach(group => {
      if (group.key && group.value) {
        let parsedValue = group.value
        // Try to parse JSON values like dates and booleans
        try {
          const parsed = JSON.parse(group.value)
          if (parsed.valueDate) {
            parsedValue = new Date(parsed.valueDate).toLocaleDateString()
          } else if (parsed.valueBoolean !== undefined) {
            parsedValue = parsed.valueBoolean ? 'Yes' : 'No'
          } else if (parsed.valueString) {
            parsedValue = parsed.valueString
          }
        } catch {
          // Keep original value if not JSON
        }
        
        // Only add if the value is meaningful (not empty, not just type info)
        if (parsedValue && parsedValue.trim() && !parsedValue.includes('{"type":')) {
          kvPairs.push({
            key: group.key,
            value: parsedValue,
            confidence: parseFloat(group.confidence || '1') || 1
          })
        }
      }
    })
    
    return kvPairs
  }

  // Get actual key-value pairs from metadata or fallback to analysisResult
  const getKeyValuePairs = () => {
    if (document.metadata) {
      const metadataKVPairs = parseMetadataToKeyValuePairs(document.metadata)
      if (metadataKVPairs.length > 0) {
        return metadataKVPairs
      }
    }
    
    // Fallback to analysisResult
    if (document.analysisResult?.extractedData?.keyValuePairs) {
      return document.analysisResult.extractedData.keyValuePairs
    }
    
    return []
  }

  const keyValuePairs = getKeyValuePairs()
  
  // Get document type from DocType key-value pair first, then fallback to metadata
  const getDocumentType = () => {
    // First try to find DocType in the parsed key-value pairs
    const docTypeFromKV = keyValuePairs.find(kv => kv.key.toLowerCase() === 'doctype')?.value
    if (docTypeFromKV) return docTypeFromKV
    
    // Then try metadata fields
    if (document.metadata?.documenttype) return document.metadata.documenttype
    if (document.metadata?.doctype) return document.metadata.doctype
    
    // Finally fallback to analysisResult
    if (document.analysisResult?.documentType) return document.analysisResult.documentType
    
    return 'Document'
  }
  
  const documentType = getDocumentType()
  const confidence = parseFloat(document.metadata?.confidence || '1') || document.analysisResult?.confidence || 1
  const processedAt = document.metadata?.processedat || document.analysisResult?.processedAt

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
        return <AlertTriangle className="w-4 h-4 text-gray-500" />
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

  const formatFileSize = (size: string) => {
    return size
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return {
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    } catch {
      return { date: 'Invalid Date', time: '' }
    }
  }

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Properties</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <ScrollArea className="h-full px-6 pb-6">
            <div className="space-y-6">
              
              {/* Basic Information */}
              <Collapsible
                open={expandedSections.basic}
                onOpenChange={() => toggleSection('basic')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                    <div className="flex items-center space-x-2 text-sm font-medium">
                      {expandedSections.basic ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                      <Info className="w-4 h-4" />
                      <span>Basic Information</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3 space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <span className="text-sm font-medium text-right">{document.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(document.status)}
                        {getStatusBadge(document.status)}
                      </div>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Size:</span>
                      <span className="text-sm font-medium">{formatFileSize(document.size)}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">ID:</span>
                      <span className="text-sm font-mono text-right">{document.id}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <span className="text-sm text-muted-foreground">Uploaded:</span>
                      <div className="text-right">
                        <div className="text-sm font-medium">{formatDate(document.uploadDate).date}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(document.uploadDate).time}</div>
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Separator />

              {/* Analysis Results */}
              {(document.analysisResult || document.metadata?.status) && (
                <>
                  <Collapsible
                    open={expandedSections.analysis}
                    onOpenChange={() => toggleSection('analysis')}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                        <div className="flex items-center space-x-2 text-sm font-medium">
                          {expandedSections.analysis ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                          <Target className="w-4 h-4" />
                          <span>Analysis Results</span>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Document Type:</span>
                          <span className="text-sm font-medium text-right">
                            {documentType}
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Confidence:</span>
                          <span className="text-sm font-medium">
                            {(confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground">Analysis Status:</span>
                          <span className="text-sm font-medium text-right">
                            {document.metadata?.status || document.analysisResult?.status || 'Unknown'}
                          </span>
                        </div>
                        {processedAt && (
                          <div className="flex justify-between items-start">
                            <span className="text-sm text-muted-foreground">Processed:</span>
                            <div className="text-right">
                              <div className="text-sm font-medium">
                                {formatDate(processedAt).date}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(processedAt).time}
                              </div>
                            </div>
                          </div>
                        )}
                        {document.analysisResult?.issues && document.analysisResult.issues.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-sm text-muted-foreground">Issues:</span>
                            <div className="space-y-1">
                              {document.analysisResult.issues.map((issue, index) => (
                                <div key={index} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                                  {issue}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {document.analysisResult?.error && (
                          <div className="space-y-1">
                            <span className="text-sm text-muted-foreground text-red-600">Error:</span>
                            <div className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                              {document.analysisResult.error}
                            </div>
                          </div>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator />
                </>
              )}

              {/* Extracted Data */}
              {keyValuePairs.length > 0 && (
                <>
                  <Collapsible
                    open={expandedSections.extracted}
                    onOpenChange={() => toggleSection('extracted')}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                        <div className="flex items-center space-x-2 text-sm font-medium">
                          {expandedSections.extracted ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                          <Database className="w-4 h-4" />
                          <span>Extracted Data</span>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-4">
                      
                      {/* Key-Value Pairs */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Key className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Key-Value Pairs</span>
                          <Badge variant="secondary" className="text-xs">
                            {keyValuePairs.length}
                          </Badge>
                        </div>
                        <div className="space-y-1 max-h-48 overflow-y-auto">
                          {keyValuePairs.map((pair, index) => (
                            <div key={index} className="bg-card border rounded-lg p-2">
                              <div className="flex justify-between items-start text-xs mb-1">
                                <span className="font-medium text-muted-foreground">{pair.key}</span>
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(pair.confidence * 100)}%
                                </Badge>
                              </div>
                              <div className="text-sm font-medium break-all">{pair.value}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Tables */}
                      {document.analysisResult?.extractedData?.tables && 
                       document.analysisResult.extractedData.tables.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <Table className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Tables</span>
                            <Badge variant="secondary" className="text-xs">
                              {document.analysisResult.extractedData.tables.length}
                            </Badge>
                          </div>
                          <div className="space-y-1">
                            {document.analysisResult.extractedData.tables.map((table, index) => (
                              <div key={index} className="bg-card border rounded-lg p-2">
                                <div className="text-xs text-muted-foreground">Table {index + 1}</div>
                                <div className="text-sm">
                                  {table.rowCount} rows × {table.columnCount} columns
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Text Preview */}
                      {document.analysisResult?.extractedData?.text && (
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Extracted Text (Preview)</span>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-3 max-h-32 overflow-y-auto">
                            <pre className="text-xs whitespace-pre-wrap break-words">
                              {document.analysisResult.extractedData.text.substring(0, 300)}
                              {document.analysisResult.extractedData.text.length > 300 && '...'}
                            </pre>
                          </div>
                        </div>
                      )}
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator />
                </>
              )}

              {/* Metadata */}
              {document.metadata && Object.keys(document.metadata).length > 0 && (
                <>
                  <Collapsible
                    open={expandedSections.metadata}
                    onOpenChange={() => toggleSection('metadata')}
                  >
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                        <div className="flex items-center space-x-2 text-sm font-medium">
                          {expandedSections.metadata ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                          <Tag className="w-4 h-4" />
                          <span>Metadata</span>
                        </div>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-2">
                      {Object.entries(document.metadata).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-start">
                          <span className="text-sm text-muted-foreground capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-sm font-medium text-right">{value}</span>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>

                  <Separator />
                </>
              )}

              {/* Raw Data */}
              <Collapsible
                open={expandedSections.raw}
                onOpenChange={() => toggleSection('raw')}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-start p-0 h-auto">
                    <div className="flex items-center space-x-2 text-sm font-medium">
                      {expandedSections.raw ? 
                        <ChevronDown className="w-4 h-4" /> : 
                        <ChevronRight className="w-4 h-4" />
                      }
                      <Hash className="w-4 h-4" />
                      <span>Raw Data</span>
                    </div>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-3">
                  <div className="bg-muted/50 rounded-lg p-3 max-h-64 overflow-auto">
                    <pre className="text-xs whitespace-pre-wrap break-words">
                      {JSON.stringify(document, null, 2)}
                    </pre>
                  </div>
                </CollapsibleContent>
              </Collapsible>

            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}