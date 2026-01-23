type ReviewSummary = {
  rating: number;
};

function resolveShareBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return '';
}

export function buildReviewShareMessage(review: ReviewSummary, referralCode?: string) {
  const ratingValue = Number(review.rating);
  const ratingText = Number.isFinite(ratingValue) ? `${ratingValue}★` : '5★';
  const baseUrl = resolveShareBaseUrl();
  const link = referralCode && baseUrl
    ? `${baseUrl}/signup?ref=${encodeURIComponent(referralCode)}`
    : '';
  const lines = [
    `我在 LW String Studio 的穿线体验很棒！评分 ${ratingText}`,
    referralCode ? `邀请码：${referralCode}` : '',
    link ? `注册链接：${link}` : '',
  ].filter(Boolean);

  return lines.join('\n');
}
