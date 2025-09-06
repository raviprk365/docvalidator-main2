import { useState, useCallback } from 'react'
import { Upload, X, File, AlertCircle, Brain, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '../ui/use-toast'
import { Progress } from '../ui/progress'

interface FileWithProgress {
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'complete' | 'analyzing' | 'analyzed' | 'error'
  id: string
  uploadUrl?: string
  analysisResult?: {
    documentType?: string;
    confidence?: number;
    extractedData?: {
      keyValuePairs?: Array<{ key: string; value: string; confidence: number }>;
    };
  }
}

export function UploadArea() {
  const [files, setFiles] = useState<FileWithProgress[]>([])
  const [isDragOver, setIsDragOver] = useState(false)
  const { toast } = useToast()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      addFiles(selectedFiles)
    }
  }, [])

  const addFiles = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      // Validate file type (PDF, DOC, DOCX, etc.)
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png'
      ]
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type.`,
          variant: "destructive"
        })
        return false
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB.`,
          variant: "destructive"
        })
        return false
      }

      return true
    })

    const filesWithProgress: FileWithProgress[] = validFiles.map(file => ({
      file,
      progress: 0,
      status: 'pending',
      id: Math.random().toString(36).substr(2, 9)
    }))

    setFiles(prev => [...prev, ...filesWithProgress])
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const uploadFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending')
    
    for (const fileItem of pendingFiles) {
      try {
        // Step 1: Get SAS URL
        const sasRes = await fetch("/api/get-sas-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: fileItem.file.name }),
        });

        const { uploadUrl } = await sasRes.json();

        // Update status to uploading
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'uploading', uploadUrl } : f
        ))

        // Step 2: Upload file to Blob directly
        const uploadRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            "x-ms-blob-type": "BlockBlob",
            "Content-Type": fileItem.file.type,
          },
          body: fileItem.file,
        });

        if (!uploadRes.ok) {
          throw new Error(`Upload failed: ${uploadRes.status}`);
        }

        // Simulate upload progress
        for (let progress = 0; progress <= 100; progress += 20) {
          await new Promise(resolve => setTimeout(resolve, 200))
          setFiles(prev => prev.map(f => 
            f.id === fileItem.id ? { ...f, progress } : f
          ))
        }

        // Mark upload as complete
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'complete', progress: 100 } : f
        ))

        toast({
          title: "File uploaded",
          description: `${fileItem.file.name} has been uploaded successfully. Starting analysis...`
        })

        // Step 3: Start document analysis
        await analyzeDocument(fileItem.id, fileItem.file.name, uploadUrl);

      } catch (error) {
        setFiles(prev => prev.map(f => 
          f.id === fileItem.id ? { ...f, status: 'error' } : f
        ))
        
        toast({
          title: "Upload failed",
          description: `Failed to upload ${fileItem.file.name}.`,
          variant: "destructive"
        })
      }
    }
  }

  const analyzeDocument = async (fileId: string, fileName: string, fileUrl: string) => {
    try {
      // Update status to analyzing
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'analyzing' } : f
      ))

      // Call analysis API (only need fileName, API will generate read SAS URL)
      const analysisRes = await fetch("/api/anaylze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fileName
        }),
      });

      const analysisData = await analysisRes.json();

      if (!analysisRes.ok) {
        throw new Error(analysisData.error || 'Analysis failed');
      }

      // Update with analysis results
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'analyzed', 
          analysisResult: analysisData.analysisResult 
        } : f
      ))

      toast({
        title: "Analysis complete",
        description: `${fileName} has been analyzed successfully.`
      })

    } catch (error) {
      console.error('Analysis error:', error);
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, status: 'error' } : f
      ))
      
      toast({
        title: "Analysis failed",
        description: `Failed to analyze ${fileName}.`,
        variant: "destructive"
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card className="card-minimal">
        <CardContent className="p-6">
          <div
            className={`upload-area ${isDragOver ? 'upload-area-active' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Upload Documents</h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to browse
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={() => document.getElementById('file-input')?.click()}
                className="btn-primary"
              >
                Browse Files
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('multiple-file-input')?.click()}
              >
                Upload Multiple
              </Button>
            </div>
            
            <input
              id="file-input"
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <input
              id="multiple-file-input"
              type="file"
              className="hidden"
              multiple
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            
            <p className="text-xs text-muted-foreground mt-4">
              Supported formats: PDF, DOC, DOCX, JPG, PNG (max 10MB each)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="card-minimal">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Selected Files ({files.length})</h3>
              {files.some(f => f.status === 'pending') && (
                <Button onClick={uploadFiles} className="btn-primary">
                  Upload All
                </Button>
              )}
            </div>
            
            <div className="space-y-3">
              {files.map(fileItem => (
                <div
                  key={fileItem.id}
                  className="flex items-center space-x-4 p-3 border border-border rounded-lg"
                >
                  <div className="flex-shrink-0">
                    {fileItem.status === 'error' ? (
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    ) : fileItem.status === 'analyzing' ? (
                      <Brain className="w-8 h-8 text-blue-500 animate-pulse" />
                    ) : fileItem.status === 'analyzed' ? (
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    ) : fileItem.status === 'uploading' ? (
                      <Clock className="w-8 h-8 text-orange-500" />
                    ) : (
                      <File className="w-8 h-8 text-primary" />
                    )}
                  </div>
                  
                  <div className="flex-grow min-w-0">
                    <p className="font-medium truncate">{fileItem.file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(fileItem.file.size)}
                    </p>
                    
                    {fileItem.status === 'uploading' && (
                      <div className="mt-2">
                        <Progress value={fileItem.progress} className="h-2" />
                        <p className="text-xs text-muted-foreground mt-1">
                          {fileItem.progress}% uploaded
                        </p>
                      </div>
                    )}
                    
                    {fileItem.status === 'complete' && (
                      <p className="text-xs text-success mt-1">Upload complete</p>
                    )}
                    
                    {fileItem.status === 'analyzing' && (
                      <p className="text-xs text-blue-500 mt-1">Analyzing document...</p>
                    )}
                    
                    {fileItem.status === 'analyzed' && fileItem.analysisResult && (
                      <div className="mt-2 text-xs">
                        <p className="text-green-600 font-medium">Analysis complete</p>
                        <p className="text-muted-foreground">
                          Type: {fileItem.analysisResult.documentType || 'Unknown'} 
                          {fileItem.analysisResult.confidence && 
                            ` (${Math.round(fileItem.analysisResult.confidence * 100)}% confidence)`}
                        </p>
                        {fileItem.analysisResult.extractedData?.keyValuePairs?.length > 0 && (
                          <p className="text-muted-foreground">
                            Extracted {fileItem.analysisResult.extractedData.keyValuePairs.length} key-value pairs
                          </p>
                        )}
                      </div>
                    )}
                    
                    {fileItem.status === 'error' && (
                      <p className="text-xs text-destructive mt-1">Processing failed</p>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeFile(fileItem.id)}
                    className="flex-shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}