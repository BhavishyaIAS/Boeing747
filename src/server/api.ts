import { NextResponse } from "next/server";
import { z } from "zod";
import { AppError, ValidationError } from "./errors";

/**
 * Consistent response envelope: `{ data, error, meta }`. Every route handler
 * shapes success and failure through these helpers.
 */
export interface ResponseMeta {
  nextCursor?: string | null;
  [key: string]: unknown;
}

export function ok<T>(data: T, meta?: ResponseMeta): NextResponse {
  return NextResponse.json({ data, error: null, meta: meta ?? null }, { status: 200 });
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ data, error: null, meta: null }, { status: 201 });
}

export function toErrorResponse(err: unknown): NextResponse {
  if (err instanceof AppError) {
    return NextResponse.json(
      { data: null, error: { code: err.code, message: err.message, details: err.details ?? null } },
      { status: err.status },
    );
  }
  // Unexpected — log server-side, never leak internals to the client.
  console.error("[api] unhandled error", err);
  return NextResponse.json(
    { data: null, error: { code: "INTERNAL", message: "Something went wrong", details: null } },
    { status: 500 },
  );
}

/** Wrap a handler so thrown {@link AppError}s become well-formed responses. */
export async function handle(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  try {
    return await fn();
  } catch (err) {
    return toErrorResponse(err);
  }
}

export async function parseBody<T>(
  req: Request,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ValidationError("Request body must be valid JSON");
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    throw new ValidationError("Validation failed", result.error.flatten());
  }
  return result.data;
}

export function parseQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): T {
  const obj = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(obj);
  if (!result.success) {
    throw new ValidationError("Invalid query parameters", result.error.flatten());
  }
  return result.data;
}
