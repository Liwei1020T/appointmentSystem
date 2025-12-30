/**
 * 获取 TNG 收款码 URL
 */
export function getTngQrCodeUrl(): string {
  // 优先使用环境变量中配置的 URL
  const envUrl = process.env.NEXT_PUBLIC_TNG_QR_CODE_URL;

  if (envUrl) {
    return envUrl;
  }

  // 默认使用本地图片
  return '/images/tng-qr-code.png';
}

/**
 * 获取收款账户名称
 */
export function getPaymentAccountName(): string {
  return process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_NAME || 'LW String Studio';
}

/**
 * 获取收款电话号码
 */
export function getPaymentAccountPhone(): string {
  return process.env.NEXT_PUBLIC_PAYMENT_ACCOUNT_PHONE || '';
}

/**
 * 格式化金额显示
 */
export function formatAmount(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return 'RM 0.00';
  }
  return `RM ${Number(amount).toFixed(2)}`;
}

/**
 * 生成支付参考号（用于用户备注）
 */
export function generatePaymentReference(orderId: string, userId: string): string {
  const orderShort = orderId.slice(0, 8).toUpperCase();
  const userShort = userId.slice(0, 4).toUpperCase();
  return `${orderShort}-${userShort}`;
}

/**
 * 验证支付凭证文件
 */
export function validateProofFile(file: File): { valid: boolean; error?: string } {
  // 验证文件类型
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: '仅支持 JPG 和 PNG 格式' };
  }

  // 验证文件大小（5MB）
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: '文件大小不能超过 5MB' };
  }

  return { valid: true };
}

/**
 * 获取支付说明文本
 */
export function getPaymentInstructions(): string[] {
  return [
    '1. 打开 Touch \'n Go 电子钱包',
    '2. 扫描上方二维码',
    '3. 输入正确的金额',
    '4. 在备注中填写您的订单参考号',
    '5. 完成支付后截图保存',
    '6. 返回本页面上传支付凭证',
  ];
}

/**
 * 计算支付超时时间（默认30分钟）
 */
export function getPaymentTimeout(): number {
  const minutes = parseInt(process.env.PAYMENT_TIMEOUT_MINUTES || '30');
  return minutes * 60 * 1000; // 转换为毫秒
}

/**
 * 检查支付是否超时
 */
export function isPaymentExpired(createdAt: Date): boolean {
  const timeout = getPaymentTimeout();
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  return now - created > timeout;
}
