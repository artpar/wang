/**
 * Wang Standard Library
 *
 * Core functions always available globally in Wang.
 * All functions are immutable and pipeline-friendly.
 */
// Array operations
export function sort_by(arr, key) {
    const sorted = [...arr];
    if (!key) {
        return sorted.sort();
    }
    const keyFn = typeof key === 'string' ? (item) => item?.[key] : key;
    return sorted.sort((a, b) => {
        const aVal = keyFn(a);
        const bVal = keyFn(b);
        if (aVal < bVal)
            return -1;
        if (aVal > bVal)
            return 1;
        return 0;
    });
}
export function reverse(arr) {
    return [...arr].reverse();
}
export function unique(arr) {
    return [...new Set(arr)];
}
export function unique_by(arr, key) {
    const keyFn = typeof key === 'string' ? (item) => item?.[key] : key;
    const seen = new Set();
    const result = [];
    for (const item of arr) {
        const k = keyFn(item);
        if (!seen.has(k)) {
            seen.add(k);
            result.push(item);
        }
    }
    return result;
}
export function group_by(arr, key) {
    const keyFn = typeof key === 'string' ? (item) => item?.[key] : key;
    const groups = {};
    for (const item of arr) {
        const k = String(keyFn(item));
        if (!groups[k])
            groups[k] = [];
        groups[k].push(item);
    }
    return groups;
}
export function chunk(arr, size = 1) {
    const chunks = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
}
export function flatten(arr, depth = 1) {
    if (depth <= 0)
        return [...arr];
    return arr.reduce((acc, val) => {
        if (Array.isArray(val)) {
            return acc.concat(flatten(val, depth - 1));
        }
        return acc.concat(val);
    }, []);
}
export function first(arr, n = 1) {
    return n === 1 ? arr[0] : arr.slice(0, n);
}
export function last(arr, n = 1) {
    return n === 1 ? arr[arr.length - 1] : arr.slice(-n);
}
export function take(arr, n) {
    return arr.slice(0, n);
}
export function drop(arr, n) {
    return arr.slice(n);
}
export function shuffle(arr) {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}
export function sample(arr, n = 1) {
    const shuffled = shuffle(arr);
    return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}
export function zip(...arrays) {
    const minLen = Math.min(...arrays.map((a) => a.length));
    const result = [];
    for (let i = 0; i < minLen; i++) {
        result.push(arrays.map((arr) => arr[i]));
    }
    return result;
}
export function partition(arr, pred) {
    const pass = [];
    const fail = [];
    for (const item of arr) {
        (pred(item) ? pass : fail).push(item);
    }
    return [pass, fail];
}
// Object operations
export function keys(obj) {
    return Object.keys(obj || {});
}
export function values(obj) {
    return Object.values(obj || {});
}
export function entries(obj) {
    return Object.entries(obj || {});
}
export function pick(obj, keys) {
    const result = {};
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}
export function omit(obj, keys) {
    const result = { ...obj };
    for (const key of keys) {
        delete result[key];
    }
    return result;
}
export function merge(...objects) {
    return Object.assign({}, ...objects);
}
export function get(obj, path, defaultValue) {
    // Handle numeric indices directly
    if (typeof path === 'number') {
        const result = obj?.[path];
        return result === undefined ? defaultValue : result;
    }
    // Convert path to string if needed
    const pathStr = String(path);
    const keys = pathStr.split('.');
    let current = obj;
    for (const key of keys) {
        if (current == null)
            return defaultValue;
        current = current[key];
    }
    return current === undefined ? defaultValue : current;
}
export function set(obj, path, value) {
    const keys = path.split('.');
    const result = { ...obj };
    let current = result;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current[key] = { ...current[key] };
        current = current[key];
    }
    current[keys[keys.length - 1]] = value;
    return result;
}
export function clone(obj) {
    if (obj === null || typeof obj !== 'object')
        return obj;
    if (obj instanceof Date)
        return new Date(obj.getTime());
    if (Array.isArray(obj))
        return obj.map((item) => clone(item));
    const cloned = {};
    for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            cloned[key] = clone(obj[key]);
        }
    }
    return cloned;
}
// String operations
export function split(str, sep = '') {
    return str.split(sep);
}
export function join(arr, sep = ',') {
    return arr.join(sep);
}
export function trim(str) {
    return str.trim();
}
export function trim_start(str) {
    return str.trimStart();
}
export function trim_end(str) {
    return str.trimEnd();
}
export function replace_all(str, search, replace) {
    return str.split(search).join(replace);
}
export function upper(str) {
    return str.toUpperCase();
}
export function lower(str) {
    return str.toLowerCase();
}
export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
export function starts_with(str, search) {
    return str.startsWith(search);
}
export function ends_with(str, search) {
    return str.endsWith(search);
}
export function includes(strOrArr, search) {
    return strOrArr.includes(search);
}
export function pad_start(str, length, char = ' ') {
    return str.padStart(length, char);
}
export function pad_end(str, length, char = ' ') {
    return str.padEnd(length, char);
}
export function truncate(str, length, suffix = '...') {
    if (str.length <= length)
        return str;
    return str.slice(0, length - suffix.length) + suffix;
}
// Functional operations
export async function map(arr, fn) {
    const results = [];
    for (let i = 0; i < arr.length; i++) {
        results.push(await fn(arr[i], i));
    }
    return results;
}
export async function filter(arr, pred) {
    const results = [];
    for (let i = 0; i < arr.length; i++) {
        if (await pred(arr[i], i)) {
            results.push(arr[i]);
        }
    }
    return results;
}
export async function reduce(arr, fn, init) {
    let acc = arguments.length > 2 ? init : arr[0];
    const startIdx = arguments.length > 2 ? 0 : 1;
    for (let i = startIdx; i < arr.length; i++) {
        acc = await fn(acc, arr[i], i);
    }
    return acc;
}
export async function find(arr, pred) {
    for (let i = 0; i < arr.length; i++) {
        if (await pred(arr[i], i)) {
            return arr[i];
        }
    }
    return undefined;
}
export async function find_index(arr, pred) {
    for (let i = 0; i < arr.length; i++) {
        if (await pred(arr[i], i)) {
            return i;
        }
    }
    return -1;
}
export async function every(arr, pred) {
    for (let i = 0; i < arr.length; i++) {
        if (!(await pred(arr[i], i))) {
            return false;
        }
    }
    return true;
}
export async function some(arr, pred) {
    for (let i = 0; i < arr.length; i++) {
        if (await pred(arr[i], i)) {
            return true;
        }
    }
    return false;
}
export async function count(arr, pred) {
    if (!pred)
        return arr.length;
    let count = 0;
    for (const item of arr) {
        if (await pred(item))
            count++;
    }
    return count;
}
// Type checking
export function is_array(val) {
    return Array.isArray(val);
}
export function is_object(val) {
    return val !== null && typeof val === 'object' && !Array.isArray(val);
}
export function is_string(val) {
    return typeof val === 'string';
}
export function is_number(val) {
    return typeof val === 'number' && !isNaN(val);
}
export function is_boolean(val) {
    return typeof val === 'boolean';
}
export function is_function(val) {
    return typeof val === 'function';
}
export function is_null(val) {
    return val === null;
}
export function is_empty(val) {
    if (val == null)
        return true;
    if (Array.isArray(val) || typeof val === 'string')
        return val.length === 0;
    if (typeof val === 'object')
        return Object.keys(val).length === 0;
    return false;
}
// Math operations
export function min(arr) {
    if (arr.length === 0)
        return Infinity;
    return Math.min(...arr);
}
export function max(arr) {
    if (arr.length === 0)
        return -Infinity;
    return Math.max(...arr);
}
export function sum(arr) {
    return arr.reduce((a, b) => a + b, 0);
}
export function avg(arr) {
    return arr.length === 0 ? 0 : sum(arr) / arr.length;
}
export function median(arr) {
    if (arr.length === 0)
        return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}
export function round(n, decimals = 0) {
    const factor = Math.pow(10, decimals);
    return Math.round(n * factor) / factor;
}
export function floor(n) {
    return Math.floor(n);
}
export function ceil(n) {
    return Math.ceil(n);
}
export function abs(n) {
    return Math.abs(n);
}
export function clamp(n, min, max) {
    return Math.min(Math.max(n, min), max);
}
// Utility functions
export function range(start, end, step = 1) {
    if (end === undefined) {
        end = start;
        start = 0;
    }
    const result = [];
    if (step > 0) {
        for (let i = start; i < end; i += step) {
            result.push(i);
        }
    }
    else if (step < 0) {
        for (let i = start; i > end; i += step) {
            result.push(i);
        }
    }
    return result;
}
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
export function wait(ms) {
    return sleep(ms);
}
export function uuid() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
export function to_json(obj, pretty = false) {
    return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
}
export function from_json(str) {
    return JSON.parse(str);
}
export function to_base64(str) {
    // Node.js compatible base64 encoding
    if (typeof btoa !== 'undefined') {
        return btoa(str);
    }
    else {
        return Buffer.from(str, 'utf8').toString('base64');
    }
}
export function from_base64(str) {
    // Node.js compatible base64 decoding
    if (typeof atob !== 'undefined') {
        return atob(str);
    }
    else {
        return Buffer.from(str, 'base64').toString('utf8');
    }
}
// Export all functions as a single object for easy registration
export const stdlib = {
    // Array
    sort_by,
    reverse,
    unique,
    unique_by,
    group_by,
    chunk,
    flatten,
    first,
    last,
    take,
    drop,
    shuffle,
    sample,
    zip,
    partition,
    // Object
    keys,
    values,
    entries,
    pick,
    omit,
    merge,
    get,
    set,
    clone,
    // String
    split,
    join,
    trim,
    trim_start,
    trim_end,
    replace_all,
    upper,
    lower,
    capitalize,
    starts_with,
    ends_with,
    includes,
    pad_start,
    pad_end,
    truncate,
    // Functional
    map,
    filter,
    reduce,
    find,
    find_index,
    every,
    some,
    count,
    // Type checking
    is_array,
    is_object,
    is_string,
    is_number,
    is_boolean,
    is_function,
    is_null,
    is_empty,
    // Math
    min,
    max,
    sum,
    avg,
    median,
    round,
    floor,
    ceil,
    abs,
    clamp,
    // Utility
    range,
    sleep,
    wait,
    uuid,
    to_json,
    from_json,
    to_base64,
    from_base64,
};
//# sourceMappingURL=index.js.map