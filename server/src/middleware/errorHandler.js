export function errorHandler(error, _req, res, _next) {
  const status = error.statusCode || 500;
  if (status >= 500) console.error(error.message);
  res.status(status).json({
    success: false,
    error: {
      code: error.code || 'INTERNAL_SERVER_ERROR',
      message: status >= 500 ? 'Something went wrong. Please try again.' : error.message,
      details: error.details || [],
    },
  });
}

export function notFound(_req, res) {
  res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'That page could not be found.', details: [] } });
}
