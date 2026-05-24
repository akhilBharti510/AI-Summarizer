export function ok(res, data, meta) {
  return res.status(200).json({ success: true, data, ...(meta ? { meta } : {}) });
}
export function created(res, data, meta) {
  return res.status(201).json({ success: true, data, ...(meta ? { meta } : {}) });
}
export function noContent(res) {
  return res.status(204).send();
}
export function paginated(res, items, pagination) {
  return res.status(200).json({ success: true, data: items, meta: { pagination } });
}
