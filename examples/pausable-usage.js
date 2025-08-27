/**
 * Example usage of PausableWangInterpreter
 * Demonstrates pause/resume and state serialization capabilities
 */

import { PausableWangInterpreter, InMemoryModuleResolver } from '../dist/esm/index.js';
import fs from 'fs/promises';

async function main() {
  console.log('=== Pausable Wang Interpreter Example ===\n');

  // Create a pausable interpreter
  const moduleResolver = new InMemoryModuleResolver();
  const interpreter = new PausableWangInterpreter({
    moduleResolver,
    functions: {
      // Custom function to simulate work
      doWork: async (item) => {
        console.log(`Processing item: ${item}`);
        await new Promise((resolve) => setTimeout(resolve, 100));
        return item * 2;
      },
      // Function to check if we should pause
      shouldPause: () => {
        // In a real app, this could check user input, system load, etc.
        return Math.random() > 0.7;
      },
    },
  });

  // Example 1: Basic pause/resume
  console.log('Example 1: Basic Pause/Resume');
  console.log('-----------------------------');
  const code1 = `
    let total = 0
    for (let i = 1; i <= 10; i = i + 1) {
      log("Processing", i)
      total = total + i
      
      // Check if we should pause
      if (shouldPause()) {
        log("Pause requested at iteration", i)
      }
    }
    log("Final total:", total)
    total
  `;

  // Start execution
  const promise1 = interpreter.execute(code1);
  // Simulate pause request after a short delay
  setTimeout(() => {
    if (interpreter.isRunning()) {
      console.log('\n>>> Pausing execution...');
      interpreter.pause();
    }
  }, 200);

  // Wait for pause to take effect
  await new Promise((resolve) => setTimeout(resolve, 300));

  if (interpreter.isPaused()) {
    console.log('>>> Execution paused!');
    console.log('>>> Current variables:', interpreter.getCurrentVariables());
    console.log('>>> Call stack:', interpreter.getCallStackTrace());
    // Resume after a delay
    console.log('>>> Resuming in 1 second...\n');
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const result = await interpreter.resume();
    console.log(`>>> Execution completed. Result: ${result}\n`);
  } else {
    const result = await promise1;
    console.log(`>>> Execution completed without pause. Result: ${result}\n`);
  }

  // Example 2: State serialization
  console.log('\nExample 2: State Serialization');
  console.log('-------------------------------');
  // Set up some state
  await interpreter.execute(`
    let userData = {
      name: "Alice",
      score: 100,
      items: ["sword", "shield", "potion"]
    }
    
    function updateScore(points) {
      userData.score = userData.score + points
      return userData.score
    }
    
    let gameState = "playing"
  `);

  console.log('Initial state created');

  // Start a long-running process
  const code2 = `
    log("Starting game simulation...")
    for (let round = 1; round <= 20; round = round + 1) {
      log("Round", round)
      let points = round * 10
      updateScore(points)
      
      if (round === 10) {
        log(">>> Checkpoint reached!")
      }
    }
    log("Game complete! Final score:", userData.score)
    userData
  `;

  const promise2 = interpreter.execute(code2);

  // Pause at checkpoint
  setTimeout(() => {
    if (interpreter.isRunning()) {
      console.log('\n>>> Pausing at checkpoint...');
      interpreter.pause();
    }
  }, 500);

  await new Promise((resolve) => setTimeout(resolve, 600));

  if (interpreter.isPaused()) {
    console.log('>>> Saving state to file...');

    // Serialize the interpreter state
    const serializedState = interpreter.serialize();

    // Save to file
    await fs.writeFile('interpreter-state.json', JSON.stringify(serializedState, null, 2));

    console.log('>>> State saved! Size:', JSON.stringify(serializedState).length, 'bytes');
    console.log('>>> Current game state:', interpreter.getCurrentVariables().userData);

    // Simulate loading from saved state
    console.log('\n>>> Simulating restart from saved state...');

    // Create a new interpreter from saved state
    const restoredInterpreter = await PausableWangInterpreter.deserialize(serializedState, {
      moduleResolver,
      functions: {
        doWork: async (item) => {
          console.log(`Processing item: ${item}`);
          await new Promise((resolve) => setTimeout(resolve, 100));
          return item * 2;
        },
        shouldPause: () => Math.random() > 0.7,
      },
    });

    console.log('>>> Interpreter restored from saved state');
    console.log('>>> Resuming execution...\n');

    // Resume from saved state
    const result = await restoredInterpreter.resume();
    console.log('>>> Final result:', result);

    // Clean up
    await fs.unlink('interpreter-state.json').catch(() => {});
  } else {
    const result = await promise2;
    console.log('>>> Completed without pause. Result:', result);
  }

  // Example 3: Handling async operations
  console.log('\n\nExample 3: Async Operations with Pause/Resume');
  console.log('----------------------------------------------');

  const interpreter3 = new PausableWangInterpreter({
    moduleResolver,
    functions: {
      fetchData: async (id) => {
        console.log(`Fetching data for ID: ${id}`);
        await new Promise((resolve) => setTimeout(resolve, 200));
        return { id, data: `Data for ${id}` };
      },
    },
  });

  const code3 = `
    let results = []
    let ids = [1, 2, 3, 4, 5]
    
    async function processAll() {
      for (let id of ids) {
        log("Processing ID:", id)
        let data = await fetchData(id)
        results.push(data)
      }
      return results
    }
    
    await processAll()
  `;

  const promise3 = interpreter3.execute(code3);

  // Pause during async operations
  setTimeout(() => {
    if (interpreter3.isRunning()) {
      console.log('\n>>> Pausing during async operations...');
      interpreter3.pause();
    }
  }, 350);

  await new Promise((resolve) => setTimeout(resolve, 500));

  if (interpreter3.isPaused()) {
    const vars = interpreter3.getCurrentVariables();
    console.log('>>> Paused! Processed so far:', vars.results?.length || 0, 'items');
    console.log('>>> Resuming...\n');

    const result = await interpreter3.resume();
    console.log('>>> All items processed:', result);
  } else {
    const result = await promise3;
    console.log('>>> Completed without pause:', result);
  }

  console.log('\n=== Examples Complete ===');
}

// Run the examples
main().catch(console.error);
