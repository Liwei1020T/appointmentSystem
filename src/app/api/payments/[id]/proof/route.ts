/**
 * 上传支付凭证 API
 * POST /api/payments/[id]/proof
 */

import { NextRequest } from 'next/server';
import { requireAuth } from '@/lib/server-auth';
import { failResponse, okResponse } from '@/lib/api-response';
import { saveFile } from '@/lib/upload';
import { isValidUUID } from '@/lib/utils';
import { isApiError } from '@/lib/api-errors';
import { recordPaymentProof } from '@/server/services/payment.service';
import { handleApiError } from '@/lib/api/handleApiError';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth();
    const paymentId = params.id;

    if (!isValidUUID(paymentId)) {
      return failResponse('BAD_REQUEST', 'Invalid payment id', 400);
    }

    // 获取上传的文件
    const formData = await request.formData();
    const file = formData.get('proof') as File;

    if (!file) {
      return failResponse('BAD_REQUEST', 'Payment proof file is required', 400);
    }

    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      return failResponse('UNPROCESSABLE_ENTITY', 'Only JPG and PNG files are supported', 422);
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      return failResponse('UNPROCESSABLE_ENTITY', 'File size must be 5MB or less', 422);
    }

    // 保存文件
    const filePath = await saveFile(file, 'payment-proofs', {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 85,
    });

    await recordPaymentProof({
      paymentId,
      userId: user.id,
      proofUrl: filePath,
    });

    return okResponse({ proofUrl: filePath });
  } catch (error) {
    return handleApiError(error);
  }
}
