import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

async function test() {
  const resolver = new InMemoryModuleResolver();
  const interpreter = new WangInterpreter({ moduleResolver: resolver });

  // Test simple optional chaining with array
  try {
    const result = await interpreter.execute(`
      let arr = [10, 20, 30]
      arr?.[1]
    `);
    console.log('Simple optional chaining with array:', result);
  } catch (e) {
    console.error('Simple test failed:', e.message);
  }

  // Test nested optional chaining
  try {
    const result = await interpreter.execute(`
      let data = { items: [1, 2, 3] }
      data?.items?.[0]
    `);
    console.log('Nested optional chaining:', result);
  } catch (e) {
    console.error('Nested test failed:', e.message);
  }
}

test();
