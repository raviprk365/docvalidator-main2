'use client'
import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '../ui/use-toast'

interface CreateFolderModalProps {
  onFolderCreated?: (folderName: string) => void
}

export function CreateFolderModal({ onFolderCreated }: CreateFolderModalProps) {
  const [open, setOpen] = useState(false)
  const [folderName, setFolderName] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { toast } = useToast()

  const handleCreate = async () => {
    if (!folderName.trim()) {
      toast({
        title: "Validation Error",
        description: "Please enter a folder name",
        variant: "destructive"
      })
      return
    }

    const sanitizedName = folderName.trim().replace(/[^a-zA-Z0-9\-_]/g, '')
    
    if (sanitizedName.length === 0) {
      toast({
        title: "Invalid Name",
        description: "Folder name must contain at least one alphanumeric character",
        variant: "destructive"
      })
      return
    }

    if (sanitizedName.length > 50) {
      toast({
        title: "Name Too Long",
        description: "Folder name must be 50 characters or less",
        variant: "destructive"
      })
      return
    }

    try {
      setIsCreating(true)
      
      const response = await fetch('/api/create-folder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ folderName: sanitizedName }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create folder')
      }

      toast({
        title: "Success",
        description: `Application "${result.folderName}" created successfully`
      })

      // Reset form and close modal
      setFolderName('')
      setOpen(false)
      
      // Notify parent component
      if (onFolderCreated) {
        onFolderCreated(result.folderName)
      }

    } catch (error) {
      console.error('Error creating folder:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create folder",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isCreating) {
      handleCreate()
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!isCreating) {
      setOpen(newOpen)
      if (!newOpen) {
        setFolderName('')
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Create New Application</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Application</DialogTitle>
          <DialogDescription>
            Create a new application folder to organize your documents. 
            Only letters, numbers, hyphens, and underscores are allowed.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="folder-name" className="text-right">
              Name
            </Label>
            <Input
              id="folder-name"
              placeholder="e.g., loan-applications"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyDown}
              className="col-span-3"
              disabled={isCreating}
              autoFocus
            />
          </div>
          {folderName && (
            <div className="text-sm text-muted-foreground px-4">
              <span className="font-medium">Preview:</span> {folderName.trim().replace(/[^a-zA-Z0-9\-_]/g, '')}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => handleOpenChange(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={isCreating || !folderName.trim()}
          >
            {isCreating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Create Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}