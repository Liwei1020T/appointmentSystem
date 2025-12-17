import { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/server-auth';
import { errorResponse } from '@/lib/api-response';

/**
 * Export report placeholder - returns CSV header only
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
    const reportType = request.nextUrl.searchParams.get('reportType') || 'report';
    const csv = `type,date,value\n${reportType},,`;
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${reportType}.csv"`,
      },
    });
  } catch (error: any) {
    console.error('Export report error:', error);
    return errorResponse(error.message || 'Failed to export report', 500);
  }
}
