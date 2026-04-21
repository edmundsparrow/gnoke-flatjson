'use strict';

const flatJson = require('./index.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  ✓', name);
    passed++;
  } catch (e) {
    console.error('  ✗', name);
    console.error('   ', e.message);
    failed++;
  }
}

function eq(actual, expected) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  if (a !== b) throw new Error('Expected ' + b + '\n    Got      ' + a);
}

/* ─────────────────────────────────────────── */
console.log('\nCase 0 — entity-wrapped array of arrays');

test('detects entity key and uses first row as headers', () => {
  const r = flatJson({ people: [['name','age'], ['Alice',30], ['Bob',25]] });
  eq(r.headers, ['name','age']);
  eq(r.rows, [['Alice',30], ['Bob',25]]);
});

test('entity-wrapped header/row object', () => {
  const r = flatJson({ people: { header: ['name','age'], row: [['Alice',30]] } });
  eq(r.headers, ['name','age']);
  eq(r.rows, [['Alice',30]]);
});

/* ─────────────────────────────────────────── */
console.log('\nCase 2 — explicit { headers, rows }');

test('passes through headers and rows as-is', () => {
  const r = flatJson({ headers: ['x','y'], rows: [['1','2']] });
  eq(r.headers, ['x','y']);
  eq(r.rows, [['1','2']]);
});

test('preserves _schema if present', () => {
  const r = flatJson({ headers: ['x'], rows: [['1']], _schema: ['number'] });
  eq(r.schema, ['number']);
});

/* ─────────────────────────────────────────── */
console.log('\nCase 2b — bare array of arrays');

test('first row becomes headers, rest become rows', () => {
  const r = flatJson([['name','age'], ['Alice',30], ['Bob',25]]);
  eq(r.headers, ['name','age']);
  eq(r.rows[0], [30, 25].length === 2 ? ['Alice',30] : ['Alice',30]);
});

/* ─────────────────────────────────────────── */
console.log('\nCase 3 — array of objects');

test('extracts keys as headers', () => {
  const r = flatJson([{ name:'Alice', age:30 }, { name:'Bob', age:25 }]);
  eq(r.headers, ['name','age']);
  eq(r.rows, [['Alice','30'], ['Bob','25']]);
});

test('inconsistent keys — missing values become empty string', () => {
  const r = flatJson([
    { name:'Alice', age:30 },
    { name:'Bob',   age:25, email:'bob@example.com' }
  ]);
  eq(r.headers, ['name','age','email']);
  eq(r.rows[0], ['Alice','30','']);
  eq(r.rows[1], ['Bob','25','bob@example.com']);
});

test('nested objects are JSON-stringified', () => {
  const r = flatJson([{ name:'Alice', address:{ city:'Lagos' } }]);
  eq(r.rows[0][1], '{"city":"Lagos"}');
});

test('null values become empty string', () => {
  const r = flatJson([{ name:'Alice', age:null }]);
  eq(r.rows[0][1], '');
});

test('schema inferred from first row types', () => {
  const r = flatJson([{ name:'Alice', age:30, active:true }]);
  eq(r.schema, ['string','number','boolean']);
});

/* ─────────────────────────────────────────── */
console.log('\nCase 3 + flatten option');

test('flatten:true expands nested objects to dot-notation keys', () => {
  const r = flatJson([
    { name:'Alice', address:{ city:'Lagos',  zip:'100001' } },
    { name:'Bob',   address:{ city:'Abuja',  zip:'900001' } }
  ], { flatten: true });
  eq(r.headers, ['name','address.city','address.zip']);
  eq(r.rows[0], ['Alice','Lagos','100001']);
});

test('flatten:false (default) leaves nested objects as JSON strings', () => {
  const r = flatJson([{ name:'Alice', address:{ city:'Lagos' } }]);
  eq(r.headers, ['name','address']);
});

/* ─────────────────────────────────────────── */
console.log('\nCase 4 — single flat object');

test('keys become headers, values become single row', () => {
  const r = flatJson({ name:'Alice', age:30 });
  eq(r.headers, ['name','age']);
  eq(r.rows, [['Alice','30']]);
});

test('nested objects in single flat object are JSON-stringified', () => {
  const r = flatJson({
    name: 'Gnoke Reader',
    share_target: { action:'main/', method:'GET' },
    icons: [{ src:'a.png' }, { src:'b.png' }]
  });
  eq(r.rows[0][1], '{"action":"main/","method":"GET"}');
  eq(r.rows[0][2], '[{"src":"a.png"},{"src":"b.png"}]');
});

test('null values in single object become empty string', () => {
  const r = flatJson({ name:'Alice', age:null });
  eq(r.rows[0][1], '');
});

/* ─────────────────────────────────────────── */
console.log('\nCase 5 — array of primitives');

test('one value per row under a single "Value" header', () => {
  const r = flatJson(['Apple','Mango','Orange']);
  eq(r.headers, ['Value']);
  eq(r.rows, [['Apple'],['Mango'],['Orange']]);
});

test('numbers are stringified', () => {
  const r = flatJson([1, 2, 3]);
  eq(r.rows, [['1'],['2'],['3']]);
});

/* ─────────────────────────────────────────── */
console.log('\nCase 7 — fallback');

test('bare string returns single Value row', () => {
  const r = flatJson('hello');
  eq(r.headers, ['Value']);
  eq(r.rows, [['hello']]);
});

test('number returns single Value row', () => {
  const r = flatJson(42);
  eq(r.headers, ['Value']);
  eq(r.rows, [['42']]);
});

/* ─────────────────────────────────────────── */
console.log('\n' + '─'.repeat(40));
console.log(`  ${passed} passed, ${failed} failed`);
console.log('─'.repeat(40) + '\n');

if (failed > 0) process.exit(1);

