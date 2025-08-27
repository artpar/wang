/**
 * Wang Standard Library
 *
 * Core functions always available globally in Wang.
 * All functions are immutable and pipeline-friendly.
 */

// Array operations
export function sort_by(arr: any[], key?: string | ((item: any) => any)): any[] {
  const sorted = [...arr];
  if (!key) {
    return sorted.sort();
  }
  const keyFn = typeof key === 'string' ? (item: any) => item?.[key] : key;
  return sorted.sort((a, b) => {
    const aVal = keyFn(a);
    const bVal = keyFn(b);
    if (aVal < bVal) return -1;
    if (aVal > bVal) return 1;
    return 0;
  });
}

export function reverse(arr: any[]): any[] {
  return [...arr].reverse();
}

export function unique(arr: any[]): any[] {
  return [...new Set(arr)];
}

export function unique_by(arr: any[], key: string | ((item: any) => any)): any[] {
  const keyFn = typeof key === 'string' ? (item: any) => item?.[key] : key;
  const seen = new Set();
  const result: any[] = [];
  for (const item of arr) {
    const k = keyFn(item);
    if (!seen.has(k)) {
      seen.add(k);
      result.push(item);
    }
  }
  return result;
}

export function group_by(arr: any[], key: string | ((item: any) => any)): Record<string, any[]> {
  const keyFn = typeof key === 'string' ? (item: any) => item?.[key] : key;
  const groups: Record<string, any[]> = {};
  for (const item of arr) {
    const k = String(keyFn(item));
    if (!groups[k]) groups[k] = [];
    groups[k].push(item);
  }
  return groups;
}

export function chunk(arr: any[], size: number = 1): any[][] {
  const chunks: any[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function flatten(arr: any[], depth: number = 1): any[] {
  if (depth <= 0) return [...arr];
  return arr.reduce((acc, val) => {
    if (Array.isArray(val)) {
      return acc.concat(flatten(val, depth - 1));
    }
    return acc.concat(val);
  }, []);
}

export function first(arr: any[], n: number = 1): any {
  return n === 1 ? arr[0] : arr.slice(0, n);
}

export function last(arr: any[], n: number = 1): any {
  return n === 1 ? arr[arr.length - 1] : arr.slice(-n);
}

export function take(arr: any[], n: number): any[] {
  return arr.slice(0, n);
}

export function drop(arr: any[], n: number): any[] {
  return arr.slice(n);
}

export function shuffle(arr: any[]): any[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function sample(arr: any[], n: number = 1): any {
  const shuffled = shuffle(arr);
  return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}

export function zip(...arrays: any[][]): any[][] {
  const minLen = Math.min(...arrays.map((a) => a.length));
  const result: any[][] = [];
  for (let i = 0; i < minLen; i++) {
    result.push(arrays.map((arr) => arr[i]));
  }
  return result;
}

export function partition(arr: any[], pred: (item: any) => boolean): [any[], any[]] {
  const pass: any[] = [];
  const fail: any[] = [];
  for (const item of arr) {
    (pred(item) ? pass : fail).push(item);
  }
  return [pass, fail];
}

// Object operations
export function keys(obj: any): string[] {
  return Object.keys(obj || {});
}

export function values(obj: any): any[] {
  return Object.values(obj || {});
}

export function entries(obj: any): [string, any][] {
  return Object.entries(obj || {});
}

export function pick(obj: any, keys: string[]): any {
  const result: any = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function omit(obj: any, keys: string[]): any {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}

export function merge(...objects: any[]): any {
  return Object.assign({}, ...objects);
}

export function get(obj: any, path: string | number, defaultValue?: any): any {
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
    if (current == null) return defaultValue;
    current = current[key];
  }
  return current === undefined ? defaultValue : current;
}

export function set(obj: any, path: string, value: any): any {
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

export function clone(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map((item) => clone(item));
  const cloned: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      cloned[key] = clone(obj[key]);
    }
  }
  return cloned;
}

// String operations
export function split(str: string, sep: string = ''): string[] {
  return str.split(sep);
}

export function join(arr: any[], sep: string = ','): string {
  return arr.join(sep);
}

export function trim(str: string): string {
  return str.trim();
}

export function trim_start(str: string): string {
  return str.trimStart();
}

export function trim_end(str: string): string {
  return str.trimEnd();
}

export function replace_all(str: string, search: string, replace: string): string {
  return str.split(search).join(replace);
}

export function upper(str: string): string {
  return str.toUpperCase();
}

export function lower(str: string): string {
  return str.toLowerCase();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function starts_with(str: string, search: string): boolean {
  return str.startsWith(search);
}

export function ends_with(str: string, search: string): boolean {
  return str.endsWith(search);
}

export function includes(strOrArr: string | any[], search: any): boolean {
  return strOrArr.includes(search);
}

export function pad_start(str: string, length: number, char: string = ' '): string {
  return str.padStart(length, char);
}

export function pad_end(str: string, length: number, char: string = ' '): string {
  return str.padEnd(length, char);
}

export function truncate(str: string, length: number, suffix: string = '...'): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

// Functional operations
export async function map(arr: any[], fn: (item: any, index?: number) => any): Promise<any[]> {
  const results = [];
  for (let i = 0; i < arr.length; i++) {
    results.push(await fn(arr[i], i));
  }
  return results;
}

export async function filter(arr: any[], pred: (item: any, index?: number) => boolean): Promise<any[]> {
  const results = [];
  for (let i = 0; i < arr.length; i++) {
    if (await pred(arr[i], i)) {
      results.push(arr[i]);
    }
  }
  return results;
}

export async function reduce(
  arr: any[],
  fn: (acc: any, item: any, index?: number) => any,
  init?: any,
): Promise<any> {
  let acc = arguments.length > 2 ? init : arr[0];
  const startIdx = arguments.length > 2 ? 0 : 1;
  
  for (let i = startIdx; i < arr.length; i++) {
    acc = await fn(acc, arr[i], i);
  }
  return acc;
}

export async function find(arr: any[], pred: (item: any, index?: number) => boolean): Promise<any> {
  for (let i = 0; i < arr.length; i++) {
    if (await pred(arr[i], i)) {
      return arr[i];
    }
  }
  return undefined;
}

export async function find_index(arr: any[], pred: (item: any, index?: number) => boolean): Promise<number> {
  for (let i = 0; i < arr.length; i++) {
    if (await pred(arr[i], i)) {
      return i;
    }
  }
  return -1;
}

export async function every(arr: any[], pred: (item: any, index?: number) => boolean): Promise<boolean> {
  for (let i = 0; i < arr.length; i++) {
    if (!(await pred(arr[i], i))) {
      return false;
    }
  }
  return true;
}

export async function some(arr: any[], pred: (item: any, index?: number) => boolean): Promise<boolean> {
  for (let i = 0; i < arr.length; i++) {
    if (await pred(arr[i], i)) {
      return true;
    }
  }
  return false;
}

export async function count(arr: any[], pred?: (item: any) => boolean): Promise<number> {
  if (!pred) return arr.length;
  let count = 0;
  for (const item of arr) {
    if (await pred(item)) count++;
  }
  return count;
}

// Type checking
export function is_array(val: any): boolean {
  return Array.isArray(val);
}

export function is_object(val: any): boolean {
  return val !== null && typeof val === 'object' && !Array.isArray(val);
}

export function is_string(val: any): boolean {
  return typeof val === 'string';
}

export function is_number(val: any): boolean {
  return typeof val === 'number' && !isNaN(val);
}

export function is_boolean(val: any): boolean {
  return typeof val === 'boolean';
}

export function is_function(val: any): boolean {
  return typeof val === 'function';
}

export function is_null(val: any): boolean {
  return val === null;
}

export function is_empty(val: any): boolean {
  if (val == null) return true;
  if (Array.isArray(val) || typeof val === 'string') return val.length === 0;
  if (typeof val === 'object') return Object.keys(val).length === 0;
  return false;
}

// Math operations
export function min(arr: number[]): number {
  if (arr.length === 0) return Infinity;
  return Math.min(...arr);
}

export function max(arr: number[]): number {
  if (arr.length === 0) return -Infinity;
  return Math.max(...arr);
}

export function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

export function avg(arr: number[]): number {
  return arr.length === 0 ? 0 : sum(arr) / arr.length;
}

export function median(arr: number[]): number {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function round(n: number, decimals: number = 0): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}

export function floor(n: number): number {
  return Math.floor(n);
}

export function ceil(n: number): number {
  return Math.ceil(n);
}

export function abs(n: number): number {
  return Math.abs(n);
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

// Utility functions
export function range(start: number, end?: number, step: number = 1): number[] {
  if (end === undefined) {
    end = start;
    start = 0;
  }
  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
  } else if (step < 0) {
    for (let i = start; i > end; i += step) {
      result.push(i);
    }
  }
  return result;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function wait(ms: number): Promise<void> {
  return sleep(ms);
}

export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function to_json(obj: any, pretty: boolean = false): string {
  return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
}

export function from_json(str: string): any {
  return JSON.parse(str);
}

export function to_base64(str: string): string {
  // Node.js compatible base64 encoding
  if (typeof btoa !== 'undefined') {
    return btoa(str);
  } else {
    return Buffer.from(str, 'utf8').toString('base64');
  }
}

export function from_base64(str: string): string {
  // Node.js compatible base64 decoding
  if (typeof atob !== 'undefined') {
    return atob(str);
  } else {
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
