[**Wang Language v0.15.1**](../README.md)

***

[Wang Language](../globals.md) / ExecutionState

# Interface: ExecutionState

Defined in: [interpreter/pausable-interpreter.ts:10](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/interpreter/pausable-interpreter.ts#L10)

## Properties

### callStack

> **callStack**: [`CallFrame`](CallFrame.md)[]

Defined in: [interpreter/pausable-interpreter.ts:14](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/interpreter/pausable-interpreter.ts#L14)

***

### currentNode?

> `optional` **currentNode**: `any`

Defined in: [interpreter/pausable-interpreter.ts:13](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/interpreter/pausable-interpreter.ts#L13)

***

### error?

> `optional` **error**: `any`

Defined in: [interpreter/pausable-interpreter.ts:16](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/interpreter/pausable-interpreter.ts#L16)

***

### pauseRequested?

> `optional` **pauseRequested**: `boolean`

Defined in: [interpreter/pausable-interpreter.ts:12](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/interpreter/pausable-interpreter.ts#L12)

***

### result?

> `optional` **result**: `any`

Defined in: [interpreter/pausable-interpreter.ts:15](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/interpreter/pausable-interpreter.ts#L15)

***

### type

> **type**: `"error"` \| `"running"` \| `"paused"` \| `"completed"`

Defined in: [interpreter/pausable-interpreter.ts:11](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/interpreter/pausable-interpreter.ts#L11)
