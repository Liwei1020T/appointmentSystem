/**
 * Complete Order Service
 * Handles order completion logic
 */

export async function completeOrder(
  orderId: string,
  notes?: string
): Promise<{ data: any; error: string | null }> {
  try {
    const response = await fetch(`/api/orders/${orderId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    const data = await response.json();
    if (!response.ok) {
      return { data: null, error: data.error || 'Failed to complete order' };
    }
    return { data, error: null };
  } catch (error: any) {
    console.error('Failed to complete order:', error);
    return { data: null, error: error.message || 'Failed to complete order' };
  }
}
