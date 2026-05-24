import { ApiError } from '../utils/ApiError.js';

/**
 * Validate `req[source]` against a zod schema and replace it with parsed data.
 * @param {import('zod').ZodTypeAny} schema
 * @param {'body'|'query'|'params'} source
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    return next(
      ApiError.validation(
        'Invalid input',
        result.error.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
      ),
    );
  }
  req[source] = result.data;
  next();
};
