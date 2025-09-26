import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { writeFile, mkdir, unlink } from 'fs/promises'
import { join } from 'path'
import { prisma } from '@/lib/prisma'
import { Analytics } from '@/lib/monitoring'
import { Prisma } from '@prisma/client'

// File upload configuration
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = {
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'text/plain': 'txt',
  'image/jpeg': 'jpg',
  'image/png': 'png'
}

// Helper function to validate file
function validateFile(file: File): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`
    }
  }

  // Check file type
  if (!ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES]) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed. Allowed types: ${Object.keys(ALLOWED_TYPES).join(', ')}`
    }
  }

  return { valid: true }
}

// Helper function to generate secure filename
function generateSecureFilename(originalName: string, userId: string): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2)
  const extension = originalName.split('.').pop()?.toLowerCase() || ''
  
  // Sanitize filename
  const sanitizedName = originalName
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .substring(0, 50)
  
  return `${userId}_${timestamp}_${random}_${sanitizedName}.${extension}`
}

// POST - Upload file
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'resume' | 'document' | 'avatar'
    const candidateId = formData.get('candidateId') as string

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      )
    }

    // Generate secure filename
    const secureFilename = generateSecureFilename(file.name, session.user.id)
    
    // Create upload directory if it doesn't exist
    const uploadDir = join(process.cwd(), 'uploads', type || 'documents')
    await mkdir(uploadDir, { recursive: true })
    
    // Write file to disk
    const filePath = join(uploadDir, secureFilename)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Create file record in database
    const fileRecord = await prisma.uploadedFile.create({
      data: {
        filename: secureFilename,
        originalName: file.name,
        filePath: filePath,
        fileSize: file.size,
        mimeType: file.type,
        uploadedBy: session.user.id,
        type: type || 'document',
        candidateId: candidateId || null
      }
    })

    // Update candidate with resume if applicable
    if (type === 'resume' && candidateId) {
      await prisma.candidate.update({
        where: { id: candidateId },
        data: { resume: `/api/files/${fileRecord.id}` }
      })
    }

    // Track upload event
    Analytics.trackUserAction('file_uploaded', {
      fileType: type,
      fileName: file.name,
      fileSize: file.size,
      candidateId: candidateId
    }, session.user.id)

    return NextResponse.json({
      success: true,
      file: {
        id: fileRecord.id,
        filename: secureFilename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: `/api/files/${fileRecord.id}`
      }
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to upload file' },
      { status: 500 }
    )
  }
}

// GET - List uploaded files
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const candidateId = searchParams.get('candidateId')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')

    // Build query
    const where: Prisma.UploadedFileWhereInput = {
      uploadedBy: session.user.id
    }

    if (type) {
      where.type = type
    }

    if (candidateId) {
      where.candidateId = candidateId
    }

    // Get files with pagination
    const [files, total] = await Promise.all([
      prisma.uploadedFile.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          candidate: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.uploadedFile.count({ where })
    ])

    return NextResponse.json({
      success: true,
      files: files.map(file => ({
        id: file.id,
        filename: file.filename,
        originalName: file.originalName,
        size: file.fileSize,
        type: file.mimeType,
        uploadType: file.type,
        url: `/api/files/${file.id}`,
        createdAt: file.createdAt,
        candidate: file.candidate
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching files:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch files' },
      { status: 500 }
    )
  }
}

// DELETE - Delete uploaded file
export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('id')

    if (!fileId) {
      return NextResponse.json(
        { success: false, error: 'File ID required' },
        { status: 400 }
      )
    }

    // Find file and verify ownership
    const file = await prisma.uploadedFile.findFirst({
      where: {
        id: fileId,
        uploadedBy: session.user.id
      }
    })

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // Delete physical file
    try {
      await unlink(file.filePath)
    } catch (fsError) {
      console.warn('Failed to delete physical file:', fsError)
      // Continue with database deletion even if physical file deletion fails
    }

    // Delete database record
    await prisma.uploadedFile.delete({
      where: { id: fileId }
    })

    // Track deletion event
    Analytics.trackUserAction('file_deleted', {
      fileId: fileId,
      fileName: file.originalName
    }, session.user.id)

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete file' },
      { status: 500 }
    )
  }
}