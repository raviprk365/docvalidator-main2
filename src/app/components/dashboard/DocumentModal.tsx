'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, Eye, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/app/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/app/components/ui/scroll-area'
import { Separator } from '@/app/components/ui/separator'

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

interface DocumentModalProps {
  isOpen: boolean
  onClose: () => void
  document: FileData | null
}

export function DocumentModal({ isOpen, onClose, document }: DocumentModalProps) {
  const [markForRFI, setMarkForRFI] = useState(false)
  const [activeTab, setActiveTab] = useState('analysis')

  if (!document) return null

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
        
        // Enhanced parsing for complex JSON values
        try {
          const parsed = JSON.parse(group.value)
          
          // Handle date objects
          if (parsed.valueDate) {
            parsedValue = new Date(parsed.valueDate).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long', 
              day: 'numeric'
            })
          } 
          // Handle boolean objects
          else if (parsed.valueBoolean !== undefined) {
            parsedValue = parsed.valueBoolean ? 'Yes' : 'No'
          } 
          // Handle string objects
          else if (parsed.valueString !== undefined && parsed.valueString !== null) {
            parsedValue = parsed.valueString
          }
          // Handle number objects
          else if (parsed.valueNumber !== undefined && parsed.valueNumber !== null) {
            parsedValue = parsed.valueNumber.toString()
          }
          // Handle simple string values that are JSON encoded
          else if (typeof parsed === 'string') {
            parsedValue = parsed
          }
          // Handle objects with type property - extract meaningful data
          else if (parsed.type) {
            // Skip type-only objects without meaningful content
            if (Object.keys(parsed).length === 1 && parsed.type) {
              return // Skip this entry
            }
            // Try to find the actual value in the object
            const meaningfulValue = Object.entries(parsed)
              .find(([k, v]) => k !== 'type' && v !== null && v !== undefined && v !== '')
            if (meaningfulValue) {
              parsedValue = meaningfulValue[1] as string
            } else {
              return // Skip if no meaningful value found
            }
          }
        } catch {
          // If not valid JSON, check if it starts with complex object notation
          if (group.value.startsWith('{"type":')) {
            return // Skip complex type objects that couldn't be parsed
          }
          // Keep original value if not JSON
          parsedValue = group.value
        }
        
        // Clean up the value
        parsedValue = parsedValue?.toString().trim()
        
        // Only add if the value is meaningful
        if (parsedValue && 
            parsedValue !== 'null' && 
            parsedValue !== 'undefined' && 
            parsedValue !== '{}' &&
            parsedValue !== '[]' &&
            !parsedValue.includes('{"type":') &&
            parsedValue.length > 0) {
          
          // Format key for better readability
          let formattedKey = group.key
          if (formattedKey) {
            // Convert camelCase to Title Case
            formattedKey = formattedKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())
            // Handle common abbreviations
            formattedKey = formattedKey
              .replace(/\bGst\b/g, 'GST')
              .replace(/\bDoc Type\b/g, 'Document Type')
              .replace(/\bLga\b/g, 'Local Government Area')
              .replace(/\bId\b/g, 'ID')
          }
          
          kvPairs.push({
            key: formattedKey,
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


  const isPdf = document.name.toLowerCase().endsWith('.pdf')
  const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(document.name)

  // Generate criteria based on actual document data
  const generateCriteriaItems = () => {
    const criteria = []
    
    // Check if document is less than 3 months old
    const dateOfIssue = keyValuePairs.find(kv => kv.key.toLowerCase().includes('date'))?.value
    let isRecent = false
    if (dateOfIssue && dateOfIssue !== 'N/A') {
      try {
        const issueDate = new Date(dateOfIssue)
        if (!isNaN(issueDate.getTime())) {
          const threeMonthsAgo = new Date()
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3)
          isRecent = issueDate > threeMonthsAgo
        }
      } catch {
        isRecent = false
      }
    }
    criteria.push({ label: 'Less than 3 months old', checked: isRecent })
    
    // Check if validity is true (for documents that have validity field)
    const validityKV = keyValuePairs.find(kv => kv.key.toLowerCase().includes('validity'))
    let isValid = true
    if (validityKV && validityKV.value.toLowerCase() === 'no') {
      isValid = false
    }
    criteria.push({ label: 'Valid certificate format', checked: isValid })
    
    // Check if certificate number is present and has value
    const hasCertNumber = keyValuePairs.some(kv => 
      (kv.key.toLowerCase().includes('certificate') || kv.key.toLowerCase().includes('number')) &&
      kv.value && kv.value.trim() && kv.value !== 'N/A'
    )
    criteria.push({ label: 'Certificate number present', checked: hasCertNumber })
    
    // Check if document type is identified
    const hasDocType = documentType && documentType !== 'Document' && documentType !== 'Unknown'
    criteria.push({ label: 'Document type identified', checked: hasDocType })
    
    // Check if local government area is present
    const hasLGA = keyValuePairs.some(kv => 
      kv.key.toLowerCase().includes('local') && 
      kv.value && kv.value.trim() && kv.value !== 'N/A'
    )
    if (hasLGA) {
      criteria.push({ label: 'Local Government Area present', checked: true })
    }
    
    return criteria
  }

  const criteriaItems = generateCriteriaItems()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!max-w-[95vw] max-h-[95vh] w-[95vw] xl:!max-w-[95vw] xl:w-[95vw] 2xl:!max-w-[95vw] 2xl:w-[95vw] flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="flex-1 flex flex-row items-center justify-between p-6 pb-4 space-y-0">
          <div className="flex items-center space-x-4">
            <DialogTitle className="text-xl font-semibold">
              {documentType}
            </DialogTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                {Math.round(confidence * 100)}%
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              Delete
            </Button>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="mark-rfi" 
                checked={markForRFI}
                onCheckedChange={(checked) => setMarkForRFI(checked === true)}
              />
              <label htmlFor="mark-rfi" className="text-sm font-medium">
                Mark for RFI
              </label>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        <div className="text-center pb-2">
          <p className="text-sm text-muted-foreground">{document.name}</p>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-y-auto flex-col lg:flex-row">
          {/* Document Viewer - Left Side */}
          <div className="flex-1 bg-gray-100 p-4 lg:p-6 overflow-y-auto min-h-[300px] lg:min-h-0">
            <div className="h-full flex items-center justify-center">
              {isPdf ? (
                <div className="w-full h-full bg-white shadow-lg rounded-lg overflow-y-auto">
                  <iframe
                    src={document.url || '/api/placeholder-pdf'}
                    className="w-full h-full border-0"
                    title={document.name}
                  />
                </div>
              ) : isImage ? (
                <div className="max-w-full max-h-full bg-white shadow-lg rounded-lg p-4">
                  <Image
                    src={document.url || '/api/placeholder-image'}
                    alt={document.name}
                    width={800}
                    height={600}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Eye className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Preview not available</h3>
                  <p className="text-gray-600">This file type cannot be previewed</p>
                </div>
              )}
            </div>
            
            {/* Navigation dots */}
            <div className="flex justify-center mt-4 space-x-2">
              <div className="w-3 h-3 bg-black rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            </div>
          </div>

          {/* Properties Panel - Right Side */}
          <div className="w-full lg:w-80 xl:w-96 2xl:w-[420px] bg-background border-t lg:border-t-0 lg:border-l flex flex-col min-h-[400px] lg:min-h-0">
            {/* AI Rating Header - Fixed */}
            <div className="flex-shrink-0 p-6 pb-4 border-b bg-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">AI Rating</h3>
                <Badge className="bg-green-50 text-green-700 border-green-200">
                  {Math.round(confidence * 100)}%
                </Badge>
              </div>
              
              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                  <TabsTrigger value="approvals">Approvals</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <TabsContent value="analysis" className="h-full p-0 mt-0">
                  <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                      {/* Document Information Section */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                        <h4 className="text-base font-semibold text-gray-900 flex items-center">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                          Document Information
                        </h4>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-600">Document Type</label>
                            <Badge className="bg-green-50 text-green-700 border-green-200 text-xs">
                              {Math.round(confidence * 100)}% confidence
                            </Badge>
                          </div>
                          <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
                            <div className="text-sm font-medium text-gray-900">{documentType}</div>
                          </div>
                        </div>

                        {/* Criteria */}
                        <div>
                          <h5 className="text-sm font-medium text-gray-700 mb-3">Validation Criteria</h5>
                          <div className="space-y-2">
                            {criteriaItems.map((item, index) => (
                              <div key={index} className="flex items-center space-x-2">
                                <CheckCircle className={`w-4 h-4 ${item.checked ? 'text-green-600' : 'text-gray-300'}`} />
                                <span className="text-sm text-gray-700">{item.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Extracted Data Section */}
                      {keyValuePairs.length > 0 && (
                        <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <h4 className="text-base font-semibold text-gray-900 flex items-center">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                              Extracted Information
                            </h4>
                            <Badge variant="outline" className="text-xs px-2 py-1">
                              {keyValuePairs.length} fields
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 max-h-64 overflow-y-auto pr-2">
                            {keyValuePairs.map((pair, index) => (
                              <div key={index} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                <div className="space-y-2">
                                  <div className="flex justify-between items-start">
                                    <label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                      {pair.key}
                                    </label>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs px-1.5 py-0.5 ${
                                        pair.confidence >= 0.9 
                                          ? 'bg-green-50 text-green-700 border-green-200' 
                                          : pair.confidence >= 0.7 
                                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                          : 'bg-red-50 text-red-700 border-red-200'
                                      }`}
                                    >
                                      {Math.round(pair.confidence * 100)}%
                                    </Badge>
                                  </div>
                                  <div className="bg-white border border-gray-200 rounded-md p-2">
                                    <div className="text-sm font-medium text-gray-900 break-all">
                                      {pair.value || 'No value detected'}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Raw Analysis Data Section */}
                      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-base font-semibold text-gray-900 flex items-center">
                            <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                            Raw Analysis Results
                          </h4>
                          <Badge variant="outline" className="text-xs">JSON</Badge>
                        </div>
                        <div className="bg-slate-950 text-slate-100 rounded-lg border border-slate-200 overflow-y-auto">
                          <div className="bg-slate-900 px-3 py-2 border-b border-slate-700">
                            <span className="text-xs text-slate-300 font-medium">Analysis Response</span>
                          </div>
                          <div className="p-3 max-h-48 overflow-auto">
                            <pre className="text-xs whitespace-pre-wrap break-words font-mono leading-relaxed text-slate-100">
                              {document.analysisResult ? 
                                JSON.stringify(document.analysisResult, null, 2) : 
                                'No analysis results available'
                              }
                            </pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="approvals" className="h-full p-0 mt-0">
                  <div className="p-6 h-full flex items-center justify-center">
                    <div className="text-center py-8">
                      <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No approval workflow configured</p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>

        {/* Footer with Play Button */}
        <div className="absolute bottom-6 right-6">
          <Button size="lg" className="rounded-full w-12 h-12 p-0">
            <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent ml-1"></div>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
