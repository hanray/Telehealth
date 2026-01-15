// Shared helpers to normalize Mongo _id to id for API payloads
// Works with Mongoose docs, lean objects, or plain objects.
function normalizeDoc(doc) {
  if (!doc) return null;
  const obj = typeof doc.toObject === 'function' ? doc.toObject() : doc;
  const { _id, id, ...rest } = obj;
  const normalizedId = _id?.toString?.() || id;
  return { id: normalizedId, ...rest };
}

function normalizeMany(docs) {
  if (!Array.isArray(docs)) return [];
  return docs.map(normalizeDoc).filter(Boolean);
}

module.exports = {
  normalizeDoc,
  normalizeMany,
};
