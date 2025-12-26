import { z } from 'zod';

export type ParsedJson<T> =
  | { ok: true; data: T }
  | { ok: false; type: 'invalid_json' | 'validation'; error: z.ZodError };

export async function parseJson<T extends z.ZodTypeAny>(
  request: Request,
  schema: T,
  options?: { allowEmpty?: boolean }
): Promise<ParsedJson<z.infer<T>>> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    if (options?.allowEmpty) {
      const fallback = schema.safeParse({});
      if (fallback.success) {
        return { ok: true, data: fallback.data };
      }
    }
    return {
      ok: false,
      type: 'invalid_json',
      error: new z.ZodError([
        {
          code: 'custom',
          message: 'Invalid JSON body',
          path: [],
        },
      ]),
    };
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    return { ok: false, type: 'validation', error: result.error };
  }

  return { ok: true, data: result.data };
}
