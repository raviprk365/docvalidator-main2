'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { ZoomIn, ZoomOut, RotateCw, Maximize2, FileText, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/app/components/ui/separator'

interface DocumentPDFViewerProps {
  fileUrl: string
  fileName: string
}

export function DocumentPDFViewer({ fileUrl, fileName }: DocumentPDFViewerProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const isPdf = fileName.toLowerCase().endsWith('.pdf')
  const isImage = /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(fileName)

  useEffect(() => {
    // Simulate loading time for demonstration
    const timer = setTimeout(() => {
      setIsLoading(false)
      if (!fileUrl) {
        setError('No file URL provided')
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [fileUrl])

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 300))
  }

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 25))
  }

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360)
  }

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  const resetView = () => {
    setZoom(100)
    setRotation(0)
  }

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Loading...</span>
          </div>
          <div className="flex items-center space-x-1 opacity-50">
            <Button variant="outline" size="sm" disabled>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2 border rounded">100%</span>
            <Button variant="outline" size="sm" disabled>
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {/* Loading Content */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading document...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-muted/30">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">Error</span>
          </div>
        </div>
        
        {/* Error Content */}
        <div className="flex-1 flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-8">
            <AlertTriangle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Failed to load document</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              Retry
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full h-full flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span className="text-sm font-medium truncate max-w-[200px]">{fileName}</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Zoom Controls */}
          <div className="flex items-center space-x-1 border rounded-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom <= 25}
              className="h-8 px-2"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm px-2 border-x min-w-[60px] text-center">{zoom}%</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom >= 300}
              className="h-8 px-2"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Rotation Control */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRotate}
            className="h-8"
          >
            <RotateCw className="w-4 h-4" />
          </Button>

          {/* Fullscreen Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleFullscreen}
            className="h-8"
          >
            <Maximize2 className="w-4 h-4" />
          </Button>

          {/* Reset View */}
          <Button
            variant="outline"
            size="sm"
            onClick={resetView}
            className="h-8"
          >
            Reset
          </Button>
        </div>
      </div>

      {/* Document Viewer */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="flex items-center justify-center min-h-full p-4">
          {isPdf ? (
            <div 
              className="bg-white shadow-lg rounded"
              style={{ 
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              <iframe
                src={fileUrl || '/api/placeholder-pdf'}
                className="w-full h-[80vh] border-0 rounded"
                title={fileName}
                onError={() => setError('Failed to load PDF document')}
              />
            </div>
          ) : isImage ? (
            <div 
              className="bg-white shadow-lg rounded p-4"
              style={{ 
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            >
              <Image
                src={fileUrl || '/api/placeholder-image'}
                alt={fileName}
                width={800}
                height={600}
                className="max-w-full max-h-full object-contain rounded"
                onError={() => setError('Failed to load image')}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium mb-2">Preview not available</h3>
              <p className="text-gray-600 mb-4">
                This file type cannot be previewed in the browser.
              </p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">File: {fileName}</p>
                <p className="text-sm text-muted-foreground">Type: {fileName.split('.').pop()?.toUpperCase()}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fullscreen close overlay */}
      {isFullscreen && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleFullscreen}
          className="absolute top-4 right-4 z-10"
        >
          Exit Fullscreen
        </Button>
      )}
    </div>
  )
}