// ─── server/middleware/validateMiddleware.js ──────────────────────────────────

/**
 * Express middleware factory — validates req.body against a Zod schema.
 *
 * Usage:
 *   router.post("/orders", protect, validateBody(createOrderSchema), handler);
 *
 * On failure:  returns 400 with { success: false, errors: {...} }
 * On success:  req.body is replaced with the parsed (coerced) Zod output
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors:  result.error.flatten().fieldErrors,
      });
    }

    req.body = result.data; // use the coerced, validated data
    next();
  };
}

/**
 * Validates req.query against a Zod schema.
 */
export function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid query parameters",
        errors:  result.error.flatten().fieldErrors,
      });
    }

    req.query = result.data;
    next();
  };
}

/**
 * Validates req.params against a Zod schema.
 */
export function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: "Invalid route parameters",
        errors:  result.error.flatten().fieldErrors,
      });
    }

    req.params = result.data;
    next();
  };
}
