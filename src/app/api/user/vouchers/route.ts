/**
 * User vouchers API
 * GET /api/user/vouchers
 */
import { requireUser } from '@/lib/server-auth';
import { okResponse } from '@/lib/api-response';
import { getUserVouchers } from '@/server/services/voucher.service';
import { handleApiError } from '@/lib/api/handleApiError';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const user = await requireUser();
    const userVouchers = await getUserVouchers(user.id);
    const vouchers = userVouchers.map((uv) => {
      const v = uv.voucher;
      const now = new Date();
      const expiryDate = uv.expiry || v.validUntil;
      const isExpired = expiryDate ? new Date(expiryDate) < now : false;
      const isUsed = !!uv.usedAt;
      const discountValue =
        typeof v.value === 'object' && 'toNumber' in v.value ? v.value.toNumber() : Number(v.value);
      const minPurchase =
        typeof v.minPurchase === 'object' && 'toNumber' in v.minPurchase
          ? v.minPurchase.toNumber()
          : Number(v.minPurchase || 0);
      return {
        id: uv.id,
        voucherId: v.id,
        code: v.code,
        name: v.name,
        discountType: v.type,
        discountValue,
        minPurchase,
        maxDiscount: null,
        expiry: expiryDate,
        used: isUsed,
        usedAt: uv.usedAt,
        expired: isExpired,
        status: isUsed ? 'used' : isExpired ? 'expired' : 'active',
        createdAt: uv.createdAt,
      };
    });
    return okResponse({ vouchers });
  } catch (error) {
    return handleApiError(error);
  }
}
