import { NextRequest } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth';
import { db } from '@/lib/db';
import { rateLimiters, getClientIp, rateLimitResponse } from '@/lib/rate-limiter';
import { safeError, validationError, unauthorized, forbidden, success } from '@/lib/secure-handler';
import { securityLogger } from '@/lib/security-logger';

const kycSubmitSchema = z.object({
  aadhaarNumber: z.string().regex(/^\d{4}\s?\d{4}\s?\d{4}$/, 'Enter valid 12-digit Aadhaar number').optional().or(z.literal('')),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Enter valid PAN (e.g., ABCDE1234F)').optional().or(z.literal('')),
  gstNumber: z.string().regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Enter valid GSTIN').optional().or(z.literal('')),
  bankAccountNo: z.string().min(1, 'Bank account number is required').max(30).optional().or(z.literal('')),
  bankIfsc: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, 'Enter valid IFSC code').optional().or(z.literal('')),
  bankName: z.string().min(1).max(200).optional().or(z.literal('')),
  bankHolderName: z.string().min(1).max(200).optional().or(z.literal('')),
  aadhaarFrontUrl: z.string().max(2048).optional().or(z.literal('')),
  aadhaarBackUrl: z.string().max(2048).optional().or(z.literal('')),
  panCardUrl: z.string().max(2048).optional().or(z.literal('')),
  passbookUrl: z.string().max(2048).optional().or(z.literal('')),
  businessName: z.string().max(200).optional().or(z.literal('')),
  businessType: z.enum(['INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'COMPANY']).optional().or(z.literal('')),
  businessAddress: z.string().max(500).optional().or(z.literal('')),
});

const kycDraftSchema = z.object({
  aadhaarNumber: z.string().max(20).optional(),
  panNumber: z.string().max(20).optional(),
  gstNumber: z.string().max(30).optional(),
  bankAccountNo: z.string().max(30).optional(),
  bankIfsc: z.string().max(20).optional(),
  bankName: z.string().max(200).optional(),
  bankHolderName: z.string().max(200).optional(),
  aadhaarFrontUrl: z.string().max(2048).optional(),
  aadhaarBackUrl: z.string().max(2048).optional(),
  panCardUrl: z.string().max(2048).optional(),
  passbookUrl: z.string().max(2048).optional(),
  businessName: z.string().max(200).optional(),
  businessType: z.enum(['INDIVIDUAL', 'PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PRIVATE_LIMITED', 'COMPANY']).optional(),
  businessAddress: z.string().max(500).optional(),
}).strict();

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const user = await db.user.findUnique({
      where: { id: session.userId },
      select: { id: true, role: true, kycStatus: true },
    });

    if (!user) {
      return validationError('User not found');
    }

    if (user.role !== 'OWNER') {
      return forbidden('Only seller accounts require KYC');
    }

    if (user.kycStatus === 'VERIFIED') {
      return validationError('KYC already verified');
    }

    const body = await request.json();
    const parsed = kycSubmitSchema.safeParse(body);

    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const data = parsed.data;

    const cleanData = {
      aadhaarNumber: data.aadhaarNumber || undefined,
      panNumber: data.panNumber || undefined,
      gstNumber: data.gstNumber || undefined,
      bankAccountNo: data.bankAccountNo || undefined,
      bankIfsc: data.bankIfsc || undefined,
      bankName: data.bankName || undefined,
      bankHolderName: data.bankHolderName || undefined,
      aadhaarFrontUrl: data.aadhaarFrontUrl || undefined,
      aadhaarBackUrl: data.aadhaarBackUrl || undefined,
      panCardUrl: data.panCardUrl || undefined,
      passbookUrl: data.passbookUrl || undefined,
      businessName: data.businessName || undefined,
      businessType: data.businessType || undefined,
      businessAddress: data.businessAddress || undefined,
    };

    if (!cleanData.aadhaarNumber || !cleanData.panNumber) {
      return validationError('Aadhaar number and PAN number are mandatory');
    }

    if (!cleanData.aadhaarFrontUrl || !cleanData.aadhaarBackUrl || !cleanData.panCardUrl) {
      return validationError('Aadhaar (front & back) and PAN card photos are mandatory');
    }

    if (!cleanData.bankAccountNo || !cleanData.bankIfsc || !cleanData.bankHolderName) {
      return validationError('Bank account details are mandatory');
    }

    securityLogger.info('KYC_SUBMITTED', 'SellerKyc', session.userId, {
      hasAadhaar: !!cleanData.aadhaarNumber,
      hasPan: !!cleanData.panNumber,
      hasGst: !!cleanData.gstNumber,
      hasBankDetails: !!cleanData.bankAccountNo,
    });

    const kyc = await db.sellerKyc.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        ...cleanData,
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      update: {
        ...cleanData,
        status: 'SUBMITTED',
        submittedAt: new Date(),
        rejectedAt: null,
        rejectionReason: null,
        reviewedBy: null,
      },
    });

    await db.user.update({
      where: { id: session.userId },
      data: { kycStatus: 'SUBMITTED' },
    });

    return success({ kyc, message: 'KYC documents submitted successfully for review' });
  } catch (error: unknown) {
    return safeError(error, 'KYC_SUBMIT');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const session = await getSession(request);
    const rl = rateLimiters.api.check(session?.userId || ip);
    if (rl.limited) return rateLimitResponse(rl.retryAfterMs);

    if (!session) return unauthorized();

    const body = await request.json();
    const parsed = kycDraftSchema.safeParse(body);
    if (!parsed.success) {
      return validationError(parsed.error.issues[0].message);
    }

    const data = parsed.data;

    const kyc = await db.sellerKyc.upsert({
      where: { userId: session.userId },
      create: {
        userId: session.userId,
        aadhaarNumber: data.aadhaarNumber || undefined,
        panNumber: data.panNumber || undefined,
        gstNumber: data.gstNumber || undefined,
        bankAccountNo: data.bankAccountNo || undefined,
        bankIfsc: data.bankIfsc || undefined,
        bankName: data.bankName || undefined,
        bankHolderName: data.bankHolderName || undefined,
        aadhaarFrontUrl: data.aadhaarFrontUrl || undefined,
        aadhaarBackUrl: data.aadhaarBackUrl || undefined,
        panCardUrl: data.panCardUrl || undefined,
        passbookUrl: data.passbookUrl || undefined,
        businessName: data.businessName || undefined,
        businessType: data.businessType || undefined,
        businessAddress: data.businessAddress || undefined,
        status: 'DRAFT',
      },
      update: {
        aadhaarNumber: data.aadhaarNumber || undefined,
        panNumber: data.panNumber || undefined,
        gstNumber: data.gstNumber || undefined,
        bankAccountNo: data.bankAccountNo || undefined,
        bankIfsc: data.bankIfsc || undefined,
        bankName: data.bankName || undefined,
        bankHolderName: data.bankHolderName || undefined,
        aadhaarFrontUrl: data.aadhaarFrontUrl || undefined,
        aadhaarBackUrl: data.aadhaarBackUrl || undefined,
        panCardUrl: data.panCardUrl || undefined,
        passbookUrl: data.passbookUrl || undefined,
        businessName: data.businessName || undefined,
        businessType: data.businessType || undefined,
        businessAddress: data.businessAddress || undefined,
      },
    });

    return success({ kyc, message: 'Draft saved' });
  } catch (error: unknown) {
    return safeError(error, 'KYC_DRAFT_SAVE');
  }
}
