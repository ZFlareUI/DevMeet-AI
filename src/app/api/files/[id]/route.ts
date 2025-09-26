import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { readFile } from 'fs/promises'
import { Analytics } from '@/lib/monitoring'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const fileId = id

    // Find file and verify access
    const file = await prisma.uploadedFile.findFirst({
      where: {
        id: fileId,
        OR: [
          { uploadedBy: session.user.id }, // Owner can access
          { candidate: { userId: session.user.id } } // Candidate can access their files
        ]
      },
      include: {
        candidate: true
      }
    })

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // Read file from disk
    const fileBuffer = await readFile(file.filePath)

    // Track file access
    Analytics.trackUserAction('file_accessed', {
      fileId: file.id,
      fileName: file.originalName,
      fileType: file.type
    }, session.user.id)

    // Return file with appropriate headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Content-Disposition': `inline; filename="${file.originalName}"`,
        'Content-Length': file.fileSize.toString(),
        'Cache-Control': 'private, max-age=31536000', // Cache for 1 year
        'ETag': `"${file.id}"`,
      },
    })

  } catch (error) {
    console.error('Error serving file:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to serve file' },
      { status: 500 }
    )
  }
}

// HEAD request for file metadata
export async function HEAD(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return new NextResponse(null, { status: 401 })
    }

    const fileId = params.id

    // Find file and verify access
    const file = await prisma.uploadedFile.findFirst({
      where: {
        id: fileId,
        OR: [
          { uploadedBy: session.user.id },
          { candidate: { userId: session.user.id } }
        ]
      }
    })

    if (!file) {
      return new NextResponse(null, { status: 404 })
    }

    // Return headers only
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': file.mimeType,
        'Content-Length': file.fileSize.toString(),
        'ETag': `"${file.id}"`,
      },
    })

  } catch (error) {
    console.error('Error getting file metadata:', error)
    return new NextResponse(null, { status: 500 })
  }
}