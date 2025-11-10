// Deterministic stringify (keys sorted, no spaces)
function canonicalize(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(canonicalize).join(",") + "]";
  // object
  const keys = Object.keys(value).sort();
  const parts = keys.map(k => JSON.stringify(k) + ":" + canonicalize(value[k]));
  return "{" + parts.join(",") + "}";
}
module.exports = { canonicalize };
