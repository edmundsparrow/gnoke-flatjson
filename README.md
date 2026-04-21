# gnoke-flatjson

Normalize any JSON structure into a consistent `{ headers, rows }` format.

No dependencies. Works in Node.js and the browser.

---

## The problem

JSON comes in many shapes. An API returns an array of objects. A database export wraps rows inside an entity key. A spreadsheet export uses an array of arrays. Every project ends up writing its own detection logic — badly.

This module handles all of them with one function call.

---

## Install

```bash
npm install gnoke-flatjson
```

---

## Usage

```js
const flatJson = require('gnoke-flatjson');

const result = flatJson(data);
// result.headers — string[]     column names
// result.rows    — string[][]   all rows, all cells as strings
// result.schema  — array|null   type hints if present in source data
```

---

## What it handles

### Array of objects
```js
flatJson([
  { name: "Alice", age: 30 },
  { name: "Bob",   age: 25 }
]);
// headers: ["name", "age"]
// rows:    [["Alice","30"], ["Bob","25"]]
```

### Array of arrays (spreadsheet style)
```js
flatJson([
  ["name", "age"],
  ["Alice", 30],
  ["Bob",   25]
]);
// headers: ["name", "age"]
// rows:    [["Alice","30"], ["Bob","25"]]
```

### Entity-wrapped (DataForge / Gnoke format)
```js
flatJson({
  "people": [["name","age"], ["Alice",30], ["Bob",25]]
});
// headers: ["name", "age"]
// rows:    [["Alice","30"], ["Bob","25"]]
```

### Explicit headers + rows
```js
flatJson({
  headers: ["name", "age"],
  rows: [["Alice", 30], ["Bob", 25]]
});
// headers: ["name", "age"]
// rows:    [["Alice","30"], ["Bob","25"]]
```

### Single flat object
```js
flatJson({ name: "Alice", age: 30 });
// headers: ["name", "age"]
// rows:    [["Alice", "30"]]
```

### Array of primitives
```js
flatJson(["Alice", "Bob", "Carol"]);
// headers: ["Column 1", "Column 2", "Column 3"]
// rows:    [["Alice", "Bob", "Carol"]]
```

### Inconsistent object keys
Missing keys become empty strings. No columns are silently dropped.
```js
flatJson([
  { name: "Alice", age: 30 },
  { name: "Bob",   age: 25, email: "bob@example.com" }
]);
// headers: ["name", "age", "email"]
// rows:    [["Alice","30",""], ["Bob","25","bob@example.com"]]
```

### Nested objects
Nested values are stringified as JSON rather than showing `[object Object]`.
```js
flatJson([
  { name: "Alice", address: { city: "Lagos", zip: "100001" } }
]);
// headers: ["name", "address"]
// rows:    [["Alice", '{"city":"Lagos","zip":"100001"}']]
```

---

## Browser (without npm)

```html
<script src="https://cdn.jsdelivr.net/gh/edmundsparrow/gnoke-flatjson/index.js"></script>
<script>
  const result = flatJson(data);
</script>
```

---

## Part of the Gnoke Suite

Built from [Gnoke DataForge](https://github.com/edmundsparrow/gnoke-dataforge) — offline-first tools for developers and independent builders.

---

## License

MIT © Edmund Sparrow
