import fs from 'fs';
const s = fs.readFileSync(new URL('./src/routes/orders.js', import.meta.url), 'utf8');

// find the orders INSERT (template literal)
const start = s.indexOf('INSERT INTO orders');
const tick2 = s.indexOf('`', start);          // closing backtick of the statement
const tick1 = s.lastIndexOf('`', start);      // opening backtick
const stmt = s.slice(tick1 + 1, tick2);

const colsMatch = stmt.match(/\(([^)]+)\)/s);
const cols = colsMatch[1].split(',').map(c => c.trim());
const vals = stmt.split(/VALUES/s)[1];

const ph = (vals.match(/\?/g) || []).length;
const quoted = (vals.match(/'[^']*'/g) || []).length;
const zeros = (vals.match(/(^|,)\s*0\s*(,|$)/g) || []).length;

console.log('columns   =', cols.length);
console.log('values    =', ph, 'placeholders +', quoted, 'quoted +', zeros, 'zero =', ph + quoted + zeros);
console.log('column list:', cols.join(' | '));
console.log('VALUES clause:', vals.trim().replace(/\s+/g, ' '));

// param array
const pStart = s.indexOf('[orderNumber', tick2);
const pEnd = s.indexOf(']', pStart);
const params = s.slice(pStart + 1, pEnd);
const nParams = params.split(',').length;
console.log('params    =', nParams);
