'use strict';

/**
 * gnoke-flatjson
 *
 * flatJson(data, options?)
 *
 * Accepts any JSON structure and returns a consistent
 * { headers, rows, schema } object suitable for rendering
 * as a table or processing as tabular data.
 *
 * headers  — string[]        column names
 * rows     — string[][]      all cell values as strings
 * schema   — string[]|null   inferred JS typeof per column (array of objects only)
 *
 * options.flatten — boolean (default false)
 *   When true, nested objects in array-of-objects input are dot-expanded:
 *   { address: { city: "Lagos" } } → { "address.city": "Lagos" }
 *
 * Handles these input shapes automatically:
 *   - { entity: [["h1","h2"], ["v1","v2"]] }   entity-wrapped array of arrays
 *   - { entity: { header:[], row:[[]] } }       entity-wrapped header/row object
 *   - { headers:[], rows:[[]] }                 explicit headers + rows
 *   - [["h1","h2"], ["v1","v2"]]                bare array of arrays
 *   - [{ name:"Alice", age:30 }]                array of objects
 *   - { name:"Alice", age:30 }                  single flat object
 *   - ["Alice", "Bob"]                          array of primitives → one row per value
 *   - mixed arrays and fallback values
 */
function flatJson(data, options) {
  const opts = options || {};
  const doFlatten = opts.flatten === true;

  // Case 0: entity-wrapped array of arrays or header/row object
  if (isObject(data) && singleKey(data)) {
    const k = Object.keys(data)[0];
    const v = data[k];
    if (Array.isArray(v) && Array.isArray(v[0]) && v.slice(1).every(r => Array.isArray(r))) {
      return { headers: v[0], rows: v.slice(1), schema: data._schema || null };
    }
    if (v && Array.isArray(v.header) && Array.isArray(v.row)) {
      return { headers: v.header, rows: v.row, schema: v._schema || null };
    }
  }

  // Case 2: explicit { headers:[], rows:[[]] }
  if (data && Array.isArray(data.headers) && Array.isArray(data.rows)) {
    return { headers: data.headers, rows: data.rows, schema: data._schema || null };
  }

  // Case 2b: bare array of arrays — first row is headers
  if (Array.isArray(data) && data.length && Array.isArray(data[0])) {
    return { headers: data[0].map(String), rows: data.slice(1), schema: null };
  }

  // Case 3: array of objects
  if (Array.isArray(data) && data.length && isObject(data[0])) {
    const source = doFlatten ? data.map(o => isObject(o) ? flattenObj(o) : o) : data;
    const allKeys = new Set();
    source.forEach(o => { if (isObject(o)) Object.keys(o).forEach(k => allKeys.add(k)); });
    const headers = [...allKeys];
    const rows = source.map(o => headers.map(h => {
      const v = o[h];
      if (v === undefined || v === null) return '';
      if (isObject(v)) return JSON.stringify(v);
      return String(v);
    }));
    const schema = headers.map(h => typeof source[0][h]);
    return { headers, rows, schema };
  }

  // Case 4: single flat object
  if (isObject(data) && !Array.isArray(data)) {
    const headers = Object.keys(data);
    const rows = [Object.values(data).map(v => {
      if (v === undefined || v === null) return '';
      if (isObject(v)) return JSON.stringify(v);
      return String(v);
    })];
    return { headers, rows, schema: null };
  }

  // Case 5: array of primitives — one value per row
  if (Array.isArray(data) && data.every(i => typeof i !== 'object' || i === null)) {
    return {
      headers: ['Value'],
      rows: data.map(v => [String(v)]),
      schema: null
    };
  }

  // Case 6: mixed array
  if (Array.isArray(data)) {
    const allKeys = new Set();
    data.forEach(item => {
      if (isObject(item) && !Array.isArray(item)) Object.keys(item).forEach(k => allKeys.add(k));
    });
    const headers = allKeys.size > 0 ? [...allKeys] : data.map((_, i) => `Column ${i + 1}`);
    const rows = data.map(item => {
      if (isObject(item) && !Array.isArray(item)) return headers.map(h => {
        const v = item[h];
        if (v === undefined || v === null) return '';
        if (isObject(v)) return JSON.stringify(v);
        return String(v);
      });
      return [String(item)];
    });
    return { headers, rows, schema: null };
  }

  // Case 7: fallback — anything else
  return { headers: ['Value'], rows: [[String(data)]], schema: null };
}

function isObject(v) { return typeof v === 'object' && v !== null; }
function singleKey(o) { return Object.keys(o).length === 1; }
function flattenObj(obj, prefix, res) {
  prefix = prefix || '';
  res    = res    || {};
  for (var k in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, k)) continue;
    var key = prefix ? prefix + '.' + k : k;
    if (isObject(obj[k]) && !Array.isArray(obj[k])) {
      flattenObj(obj[k], key, res);
    } else {
      res[key] = obj[k];
    }
  }
  return res;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = flatJson;
} else if (typeof window !== 'undefined') {
  window.flatJson = flatJson;
}

