const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

export type CsrfFailureReason =
  | 'missing_origin'
  | 'invalid_origin'
  | 'origin_mismatch';

export interface CsrfVerificationResult {
  allowed: boolean;
  reason?: CsrfFailureReason;
}

export interface VerifyCsrfRequestOptions {
  pathname: string;
  trustedOrigins?: string[];
  exemptPathPrefixes?: string[];
}

function normalizeOrigin(value: string): string | null {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

function extractOrigin(request: Request): string | null {
  const originHeader = request.headers.get('origin');
  if (originHeader) {
    return normalizeOrigin(originHeader);
  }

  const refererHeader = request.headers.get('referer');
  if (refererHeader) {
    return normalizeOrigin(refererHeader);
  }

  return null;
}

function isExemptPath(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((prefix) => pathname.startsWith(prefix));
}

export function verifyCsrfRequest(
  request: Request,
  options: VerifyCsrfRequestOptions
): CsrfVerificationResult {
  if (SAFE_METHODS.has(request.method.toUpperCase())) {
    return { allowed: true };
  }

  const authorizationHeader = request.headers.get('authorization');
  if (authorizationHeader?.toLowerCase().startsWith('bearer ')) {
    return { allowed: true };
  }

  const exemptPathPrefixes = options.exemptPathPrefixes ?? [];
  if (isExemptPath(options.pathname, exemptPathPrefixes)) {
    return { allowed: true };
  }

  const expectedOrigin = normalizeOrigin(request.url);
  if (!expectedOrigin) {
    return { allowed: false, reason: 'invalid_origin' };
  }

  const requestOrigin = extractOrigin(request);
  if (!requestOrigin) {
    return { allowed: false, reason: 'missing_origin' };
  }

  if (requestOrigin === expectedOrigin) {
    return { allowed: true };
  }

  const trustedOrigins = new Set(
    (options.trustedOrigins ?? [])
      .map((origin) => normalizeOrigin(origin))
      .filter((origin): origin is string => Boolean(origin))
  );

  if (trustedOrigins.has(requestOrigin)) {
    return { allowed: true };
  }

  return { allowed: false, reason: 'origin_mismatch' };
}
