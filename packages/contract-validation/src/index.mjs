const supportedSchemaTypes = new Set(['array', 'boolean', 'integer', 'null', 'number', 'object', 'string']);

export function assertJsonSchema(schema, location = '$') {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    throw new TypeError(`${location} must be a JSON Schema object`);
  }

  if ('type' in schema) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    for (const type of types) {
      if (!supportedSchemaTypes.has(type)) {
        throw new TypeError(`${location}.type contains unsupported JSON Schema type: ${type}`);
      }
    }
  }

  if ('properties' in schema) {
    if (!schema.properties || typeof schema.properties !== 'object' || Array.isArray(schema.properties)) {
      throw new TypeError(`${location}.properties must be an object`);
    }

    for (const [propertyName, propertySchema] of Object.entries(schema.properties)) {
      assertJsonSchema(propertySchema, `${location}.properties.${propertyName}`);
    }
  }

  if ('items' in schema && schema.items && typeof schema.items === 'object' && !Array.isArray(schema.items)) {
    assertJsonSchema(schema.items, `${location}.items`);
  }

  return true;
}

export function validateRequiredObjectFields(schema, payload) {
  assertJsonSchema(schema);

  if (schema.type === 'object' && (!payload || typeof payload !== 'object' || Array.isArray(payload))) {
    return { valid: false, errors: ['payload must be an object'] };
  }

  const missing = (schema.required ?? []).filter((fieldName) => !(fieldName in payload));
  return missing.length === 0
    ? { valid: true, errors: [] }
    : { valid: false, errors: missing.map((fieldName) => `missing required field: ${fieldName}`) };
}
