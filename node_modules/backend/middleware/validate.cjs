// backend/middleware/validate.cjs
const Ajv = require("ajv");
const addFormats = require("ajv-formats");

const ajv = new Ajv({
  coerceTypes: true,
  useDefaults: true,
  removeAdditional: "failing", // you can switch to "all" if you prefer stripping unknown props
  allErrors: true,
});
addFormats(ajv);

function validate(schema) {
  const compiled = ajv.compile(schema);
  return (req, res, next) => {
    const ok = compiled(req.body);
    if (!ok) {
      console.error("❌ validation_failed:", compiled.errors);
      return res.status(400).json({
        error: "validation_failed",
        details: compiled.errors,
      });
    }
    next();
  };
}

module.exports = { validate };
