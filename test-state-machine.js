import { WangInterpreter, InMemoryModuleResolver } from './dist/esm/index.js';

const resolver = new InMemoryModuleResolver();
const interpreter = new WangInterpreter({
  moduleResolver: resolver,
  functions: {
    log: console.log,
    push: (arr, item) => { arr.push(item); return arr; },
  }
});

async function test() {
  console.log('Testing state machine...');
  try {
    const result = await interpreter.execute(`
      class StateMachine {
        constructor(initialState) {
          this.state = initialState;
          this.transitions = {}
        }
        
        addTransition(fromState, event, to, action) {
          const key = fromState + ":" + event;
          this.transitions[key] = { to, action };
          return this
        }
        
        trigger(event) {
          const key = this.state + ":" + event;
          const transition = this.transitions[key];
          
          if (!transition) {
            throw "Invalid transition: " + key
          };
          
          if (transition.action) {
            transition.action()
          };
          
          this.state = transition.to;
          return this.state
        }
      };
      
      const sm = new StateMachine("idle");
      sm.addTransition("idle", "start", "running")
        .addTransition("running", "pause", "paused")
        .addTransition("paused", "resume", "running")
        .addTransition("running", "stop", "idle");
      
      const states = [];
      push(states, sm.state);
      push(states, sm.trigger("start"));
      push(states, sm.trigger("pause"));
      push(states, sm.trigger("resume"));
      push(states, sm.trigger("stop"));
      states
    `);
    console.log('Result:', result);
    console.log('Expected: ["idle", "running", "paused", "running", "idle"]');
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test().catch(console.error);