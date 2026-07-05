import { describe, expect, it } from "vitest";
import { z } from "zod";
import { created, ok, parseBody, parseQuery, toErrorResponse } from "@server/api";
import { NotFoundError, ValidationError } from "@server/errors";

describe("api envelope helpers", () => {
  it("ok() wraps data with a null error and meta", async () => {
    const res = ok({ a: 1 }, { nextCursor: "x" });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ data: { a: 1 }, error: null, meta: { nextCursor: "x" } });
  });

  it("created() returns 201", async () => {
    const res = created({ id: "1" });
    expect(res.status).toBe(201);
  });

  it("maps AppError subclasses to their status + code", async () => {
    const res = toErrorResponse(new NotFoundError("nope"));
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.data).toBeNull();
    expect(body.error).toMatchObject({ code: "NOT_FOUND", message: "nope" });
  });

  it("maps unknown errors to a generic 500 without leaking details", async () => {
    const res = toErrorResponse(new Error("secret stack"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.code).toBe("INTERNAL");
    expect(JSON.stringify(body)).not.toContain("secret stack");
  });
});

describe("parseBody / parseQuery", () => {
  const schema = z.object({ title: z.string().min(3), limit: z.coerce.number().default(10) });

  it("parses a valid JSON body", async () => {
    const req = new Request("http://x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "hello" }),
    });
    await expect(parseBody(req, schema)).resolves.toEqual({ title: "hello", limit: 10 });
  });

  it("throws ValidationError on invalid body", async () => {
    const req = new Request("http://x", { method: "POST", body: JSON.stringify({ title: "no" }) });
    await expect(parseBody(req, schema)).rejects.toBeInstanceOf(ValidationError);
  });

  it("throws ValidationError on non-JSON body", async () => {
    const req = new Request("http://x", { method: "POST", body: "not json{" });
    await expect(parseBody(req, schema)).rejects.toBeInstanceOf(ValidationError);
  });

  it("coerces query params with defaults", () => {
    const params = new URLSearchParams("title=abc&limit=5");
    expect(parseQuery(params, schema)).toEqual({ title: "abc", limit: 5 });
  });
});
