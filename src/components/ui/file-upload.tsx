'use client'

import React, { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface FileUploadProps {
  onUploadComplete?: (file: UploadedFileInfo) => void
  onUploadError?: (error: string) => void
  acceptedTypes?: string[]
  maxSize?: number
  type?: 'resume' | 'document' | 'avatar'
  candidateId?: string
  multiple?: boolean
  className?: string
}

interface UploadedFileInfo {
  id: string
  filename: string
  originalName: string
  size: number
  type: string
  url: string
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  acceptedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  maxSize = 10 * 1024 * 1024, // 10MB
  type = 'document',
  candidateId,
  multiple = false,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum limit of ${formatFileSize(maxSize)}`
      }
    }

    // Check file type
    if (!acceptedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type ${file.type} is not allowed. Allowed types: ${acceptedTypes.join(', ')}`
      }
    }

    return { valid: true }
  }

  const uploadFile = async (file: File): Promise<void> => {
    const validation = validateFile(file)
    if (!validation.valid) {
      onUploadError?.(validation.error!)
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      if (candidateId) {
        formData.append('candidateId', candidateId)
      }

      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      if (result.success) {
        onUploadComplete?.(result.file)
      } else {
        throw new Error(result.error || 'Upload failed')
      }

    } catch (error) {
      console.error('Upload error:', error)
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    if (multiple) {
      // Upload multiple files
      for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i])
      }
    } else {
      // Upload single file
      await uploadFile(files[0])
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const getAcceptString = () => {
    return acceptedTypes.join(',')
  }

  const getTypeDescription = () => {
    switch (type) {
      case 'resume':
        return 'Upload your resume (PDF, DOC, DOCX)'
      case 'avatar':
        return 'Upload profile picture (JPG, PNG)'
      default:
        return 'Upload document (PDF, DOC, DOCX, TXT)'
    }
  }

  return (
    <div className={className}>
      <Card 
        className={`
          border-2 border-dashed p-6 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={getAcceptString()}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <div className="space-y-4">
          {uploading ? (
            <div className="space-y-2">
              <div className="w-16 h-16 mx-auto border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
              {uploadProgress > 0 && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <svg 
                className="w-16 h-16 mx-auto text-gray-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {getTypeDescription()}
                </p>
                <p className="text-sm text-gray-500">
                  Drag and drop your file here, or click to browse
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum file size: {formatFileSize(maxSize)}
                </p>
              </div>
            </div>
          )}
        </div>

        {!uploading && (
          <Button 
            type="button" 
            variant="outline" 
            className="mt-4"
            onClick={(e) => {
              e.stopPropagation()
              handleClick()
            }}
          >
            Choose File{multiple ? 's' : ''}
          </Button>
        )}
      </Card>
    </div>
  )
}

export default FileUpload