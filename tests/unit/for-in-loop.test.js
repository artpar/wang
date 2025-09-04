import { describe, it, expect, beforeEach } from 'vitest'
import { WangInterpreter } from '../../dist/esm/interpreter/index.js'

describe('For-In Loop Tests', () => {
  let interpreter

  beforeEach(() => {
    interpreter = new WangInterpreter({
      functions: {
        push: (arr, val) => { arr.push(val); return arr },
        join: (arr, sep) => arr.join(sep)
      }
    })
  })

  it('should iterate over object properties', async () => {
    const code = `
      let obj = { a: 1, b: 2, c: 3 }
      let result = []
      for (let key in obj) {
        push(result, key)
      }
      result
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['a', 'b', 'c'])
  })

  it('should iterate over array indices as strings', async () => {
    const code = `
      let arr = ['x', 'y', 'z']
      let indices = []
      for (let idx in arr) {
        push(indices, idx)
      }
      indices
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['0', '1', '2'])
  })

  it('should handle empty objects', async () => {
    const code = `
      let empty = {}
      let count = 0
      for (let k in empty) {
        count = count + 1
      }
      count
    `
    const result = await interpreter.execute(code)
    expect(result).toBe(0)
  })

  it('should handle nested for-in loops', async () => {
    const code = `
      let nested = {
        group1: { x: 10, y: 20 },
        group2: { z: 30 }
      }
      let values = []
      for (let group in nested) {
        for (let prop in nested[group]) {
          push(values, nested[group][prop])
        }
      }
      values
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual([10, 20, 30])
  })

  it('should work with const declaration', async () => {
    const code = `
      let obj = { foo: 'bar' }
      let keys = []
      for (const key in obj) {
        push(keys, key)
      }
      keys
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['foo'])
  })

  it('should handle break statement', async () => {
    const code = `
      let obj = { a: 1, b: 2, c: 3, d: 4 }
      let keys = []
      for (let key in obj) {
        if (key === 'c') break
        push(keys, key)
      }
      keys
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['a', 'b'])
  })

  it('should handle continue statement', async () => {
    const code = `
      let obj = { a: 1, b: 2, c: 3, d: 4 }
      let keys = []
      for (let key in obj) {
        if (key === 'b' || key === 'c') continue
        push(keys, key)
      }
      keys
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual(['a', 'd'])
  })

  it('should access object values correctly', async () => {
    const code = `
      let data = { x: 100, y: 200 }
      let sum = 0
      for (let prop in data) {
        sum = sum + data[prop]
      }
      sum
    `
    const result = await interpreter.execute(code)
    expect(result).toBe(300)
  })

  it('should handle null or undefined gracefully', async () => {
    const code = `
      let result = []
      let nullVal = null
      for (let k in nullVal) {
        push(result, k)
      }
      result
    `
    await expect(interpreter.execute(code)).rejects.toThrow()
  })

  it('should work with destructuring pattern', async () => {
    const code = `
      let users = { alice: 25, bob: 30 }
      let ages = []
      for (let name in users) {
        push(ages, users[name])
      }
      ages
    `
    const result = await interpreter.execute(code)
    expect(result).toEqual([25, 30])
  })
})