import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canPerformAction } from '@/lib/usage-tracking';
import { UserRole, InvitationStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { sendEmail } from '@/lib/email'; // You'll need to implement this

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins and recruiters can view invitations
    if (!['ADMIN', 'RECRUITER'].includes(user.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const invitations = await prisma.invitation.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invitations' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { email, role } = await req.json();

    if (!email || !role) {
      return NextResponse.json(
        { error: 'Email and role are required' },
        { status: 400 }
      );
    }

    if (!Object.values(UserRole).includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, organizationId: true, role: true, organization: true }
    });

    if (!user?.organization) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 404 });
    }

    // Only admins can invite users
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can send invitations' }, { status: 403 });
    }

    // Check if we can add another team member
    const canAdd = await canPerformAction(user.organizationId, 'teamMember');
    if (!canAdd.allowed) {
      return NextResponse.json(
        { error: canAdd.reason },
        { status: 400 }
      );
    }

    // Check if user already exists in the organization
    const existingUser = await prisma.user.findFirst({
      where: {
        email,
        organizationId: user.organizationId,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User is already a member of this organization' },
        { status: 400 }
      );
    }

    // Check if there's already a pending invitation
    const existingInvitation = await prisma.invitation.findFirst({
      where: {
        email,
        organizationId: user.organizationId,
        status: 'PENDING',
      },
    });

    if (existingInvitation) {
      return NextResponse.json(
        { error: 'Invitation already sent to this email' },
        { status: 400 }
      );
    }

    // Generate invitation token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    // Create invitation
    const invitation = await prisma.invitation.create({
      data: {
        organizationId: user.organizationId,
        email,
        role: role as UserRole,
        invitedBy: user.id,
        token,
        expiresAt,
        status: 'PENDING',
      },
    });

    // Send invitation email (implement this based on your email provider)
    try {
      await sendInvitationEmail(
        email,
        user.organization.name,
        session.user.name || 'A team member',
        token,
        req.nextUrl.origin
      );
    } catch (emailError) {
      console.error('Failed to send invitation email:', emailError);
      // Continue anyway, admin can manually send the invitation link
    }

    return NextResponse.json({
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
    });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json(
      { error: 'Failed to create invitation' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const invitationId = url.searchParams.get('id');

    if (!invitationId) {
      return NextResponse.json(
        { error: 'Invitation ID is required' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { organizationId: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Only admins can cancel invitations
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Only admins can cancel invitations' }, { status: 403 });
    }

    await prisma.invitation.delete({
      where: {
        id: invitationId,
        organizationId: user.organizationId, // Ensure user can only cancel their org's invitations
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling invitation:', error);
    return NextResponse.json(
      { error: 'Failed to cancel invitation' },
      { status: 500 }
    );
  }
}

// Helper function to send invitation email
async function sendInvitationEmail(
  email: string,
  organizationName: string,
  inviterName: string,
  token: string,
  baseUrl: string
) {
  const invitationUrl = `${baseUrl}/invite/accept?token=${token}`;
  
  const subject = `You've been invited to join ${organizationName} on DevMeet AI`;
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1>You're invited to join ${organizationName}</h1>
      <p>Hi there!</p>
      <p>${inviterName} has invited you to join <strong>${organizationName}</strong> on DevMeet AI, the AI-powered interview platform.</p>
      <p>Click the button below to accept the invitation and create your account:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${invitationUrl}" 
           style="background-color: #007bff; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 5px; display: inline-block;">
          Accept Invitation
        </a>
      </div>
      <p>Or copy and paste this link in your browser:</p>
      <p style="word-break: break-all; color: #666;">${invitationUrl}</p>
      <p><strong>Note:</strong> This invitation will expire in 7 days.</p>
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="font-size: 14px; color: #666;">
        If you didn't expect this invitation, you can safely ignore this email.
      </p>
    </div>
  `;

  // This would integrate with your email service (SendGrid, AWS SES, etc.)
  // For now, just log the email content
  console.log('Invitation email:', { to: email, subject, html });
  
  // Uncomment and implement based on your email provider:
  // await sendEmail({ to: email, subject, html });
}

async function sendEmail(params: { to: string; subject: string; html: string }) {
  // Implement this function based on your email provider
  // Example implementations:
  
  // SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // return await sgMail.send({ ...params, from: 'noreply@yourdomain.com' });
  
  // AWS SES:
  // const AWS = require('aws-sdk');
  // const ses = new AWS.SES({ region: 'us-east-1' });
  // return await ses.sendEmail({ ... }).promise();
  
  console.log('Email would be sent:', params);
}