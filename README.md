# Gnoke FlatJSON

Normalize any JSON structure into a consistent `{ headers, rows }` format.  
Zero dependencies. Works in Node.js and the browser.

---

## The Problem

JSON data is inconsistent. Some APIs return arrays of objects, others wrap data in entity keys, and spreadsheet exports often use arrays of arrays.

**gnoke-flatjson** handles the detection logic automatically, so your UI always receives a predictable tabular format.

---

## Install

```bash
npm install gnoke-flatjson
```

---

## Usage

```javascript
const flatJson = require('gnoke-flatjson');

const data = [
  { name: "Alice", age: 30 },
  { name: "Bob",   age: 25, city: "Lagos" }
];

const result = flatJson(data);

// result.headers -> ["name", "age", "city"]
// result.rows    -> [["Alice", "30", ""], ["Bob", "25", "Lagos"]]
// result.schema  -> ["string", "number", "undefined"]
```

---

## Supported Formats

### 1. Array of Objects

Extracts all unique keys as headers. Missing values become empty strings.

```javascript
flatJson([
  { name: "Alice", age: 30 },
  { name: "Bob",   age: 25, city: "Lagos" }
]);
// headers: ["name", "age", "city"]
// rows:    [["Alice", "30", ""], ["Bob", "25", "Lagos"]]
```

### 2. Array of Arrays

Treats the first row as headers and the rest as data.

```javascript
flatJson([
  ["name", "age"],
  ["Alice", 30],
  ["Bob",   25]
]);
// headers: ["name", "age"]
// rows:    [["Alice", 30], ["Bob", 25]]
```

### 3. Entity-Wrapped (Gnoke Format)

Handles structures like:

```json
{ "users": [["name", "age"], ["Alice", 30]] }
```

### 4. Single Object

Converts `{ key: value }` into a one-row table. Nested objects are JSON-stringified.

```javascript
flatJson({ name: "Alice", age: 30 });
// headers: ["name", "age"]
// rows:    [["Alice", "30"]]
```

### 5. Array of Primitives

Each value becomes its own row.

```javascript
flatJson(["Apple", "Mango", "Orange"]);
// headers: ["Value"]
// rows:    [["Apple"], ["Mango"], ["Orange"]]
```

---

## Options

### `flatten` (default: `false`)

When `true`, nested objects in an array of objects are expanded using dot-notation keys instead of being JSON-stringified.

```javascript
flatJson([
  { name: "Alice", address: { city: "Lagos", zip: "100001" } }
], { flatten: true });

// headers: ["name", "address.city", "address.zip"]
// rows:    [["Alice", "Lagos", "100001"]]
```

---

## Schema Inference

For arrays of objects, `result.schema` contains the inferred `typeof` for each column based on the first row.

```javascript
const result = flatJson([{ name: "Alice", age: 30, active: true }]);
// result.schema -> ["string", "number", "boolean"]
```

---

## Browser Usage

```html
<script src="https://cdn.jsdelivr.net/gh/edmundsparrow/gnoke-flatjson/index.js"></script>
<script>
  const result = flatJson(myData);
  console.log(result.headers, result.rows);
</script>
```

---

## License

MIT © Edmund Sparrow