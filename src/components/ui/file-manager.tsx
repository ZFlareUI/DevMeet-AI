'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from '@/components/ui/toast'

interface UploadedFile {
  id: string
  filename: string
  originalName: string
  size: number
  type: string
  uploadType: string
  url: string
  createdAt: string
  candidate?: {
    id: string
    name: string
    email: string
  }
}

interface FileManagerProps {
  type?: string
  candidateId?: string
  onFileDeleted?: (fileId: string) => void
  className?: string
}

const FileManager: React.FC<FileManagerProps> = ({
  type,
  candidateId,
  onFileDeleted,
  className = ''
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  const fetchFiles = async (pageNum: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '10'
      })

      if (type) params.append('type', type)
      if (candidateId) params.append('candidateId', candidateId)

      const response = await fetch(`/api/uploads?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch files')
      }

      const result = await response.json()
      
      if (result.success) {
        setFiles(result.files)
        setPagination(result.pagination)
        setPage(pageNum)
      } else {
        throw new Error(result.error || 'Failed to fetch files')
      }

    } catch (error) {
      console.error('Error fetching files:', error)
      setError(error instanceof Error ? error.message : 'Failed to fetch files')
    } finally {
      setLoading(false)
    }
  }

  const deleteFile = async (fileId: string) => {
    if (!confirm('Are you sure you want to delete this file?')) {
      return
    }

    try {
      setDeleting(fileId)

      const response = await fetch(`/api/uploads?id=${fileId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      const result = await response.json()
      
      if (result.success) {
        setFiles(prev => prev.filter(file => file.id !== fileId))
        onFileDeleted?.(fileId)
        toast.success('File deleted successfully')
        
        // Refresh list if current page becomes empty
        if (files.length === 1 && page > 1) {
          fetchFiles(page - 1)
        } else {
          fetchFiles(page)
        }
      } else {
        throw new Error(result.error || 'Failed to delete file')
      }

    } catch (error) {
      console.error('Error deleting file:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to delete file')
    } finally {
      setDeleting(null)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word')) return '📝'
    if (mimeType.includes('image')) return '🖼️'
    if (mimeType.includes('text')) return '📄'
    return '📁'
  }

  const downloadFile = (file: UploadedFile) => {
    window.open(file.url, '_blank')
  }

  useEffect(() => {
    fetchFiles()
  }, [type, candidateId])

  if (loading && files.length === 0) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-lg font-medium">Error loading files</p>
          <p className="text-sm text-gray-600">{error}</p>
        </div>
        <Button onClick={() => fetchFiles(page)} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (files.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-lg font-medium">No files uploaded</p>
          <p className="text-sm">Upload your first file to get started</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">
          Uploaded Files ({pagination.total})
        </h3>
        <Button 
          onClick={() => fetchFiles(page)} 
          variant="outline" 
          size="sm"
          disabled={loading}
        >
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {files.map((file) => (
          <Card key={file.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <span className="text-2xl">{getFileIcon(file.type)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.originalName}
                  </p>
                  <div className="text-xs text-gray-500 space-x-2">
                    <span>{formatFileSize(file.size)}</span>
                    <span>•</span>
                    <span>{formatDate(file.createdAt)}</span>
                    {file.candidate && (
                      <>
                        <span>•</span>
                        <span>{file.candidate.name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <Button
                  onClick={() => downloadFile(file)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Download
                </Button>
                <Button
                  onClick={() => deleteFile(file.id)}
                  variant="outline"
                  size="sm"
                  className="text-xs text-red-600 hover:text-red-700"
                  disabled={deleting === file.id}
                >
                  {deleting === file.id ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex justify-center items-center space-x-2 mt-6">
          <Button
            onClick={() => fetchFiles(page - 1)}
            disabled={page <= 1 || loading}
            variant="outline"
            size="sm"
          >
            Previous
          </Button>
          
          <span className="text-sm text-gray-600">
            Page {page} of {pagination.pages}
          </span>
          
          <Button
            onClick={() => fetchFiles(page + 1)}
            disabled={page >= pagination.pages || loading}
            variant="outline"
            size="sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}

export default FileManager