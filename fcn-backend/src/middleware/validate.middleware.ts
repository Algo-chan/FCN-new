import type { NextFunction, Request, Response } from "express";
import type { ZodError, ZodType } from "zod";

function isEnvelopeSchema(schema: ZodType): boolean {
  const def = (schema as unknown as { _def?: { shape?: () => unknown } })._def;
  if (!def || typeof def.shape !== "function") return false;
  const shape = def.shape();
  if (!shape || typeof shape !== "object") return false;
  const keys = Object.keys(shape as object);
  return keys.some((k) => k === "body" || k === "query" || k === "params");
}

export const validate =
  (schema: ZodType) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (isEnvelopeSchema(schema)) {
        const parsed = schema.parse({
          body: req.body,
          query: req.query,
          params: req.params
        });
        if (parsed.body !== undefined) req.body = parsed.body;
        if (parsed.query !== undefined) req.query = parsed.query;
        if (parsed.params !== undefined) req.params = parsed.params;
      } else {
        req.body = schema.parse(req.body);
      }
      next();
    } catch (error) {
      next(error as ZodError);
    }
  };