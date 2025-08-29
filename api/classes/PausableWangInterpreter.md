[**Wang Language v0.14.7**](../README.md)

***

[Wang Language](../globals.md) / PausableWangInterpreter

# Class: PausableWangInterpreter

Defined in: [interpreter/pausable-interpreter.ts:55](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L55)

## Extends

- [`WangInterpreter`](WangInterpreter.md)

## Constructors

### Constructor

> **new PausableWangInterpreter**(`options`): `PausableWangInterpreter`

Defined in: [interpreter/pausable-interpreter.ts:63](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L63)

#### Parameters

##### options

[`PausableInterpreterOptions`](../interfaces/PausableInterpreterOptions.md) = `{}`

#### Returns

`PausableWangInterpreter`

#### Overrides

[`WangInterpreter`](WangInterpreter.md).[`constructor`](WangInterpreter.md#constructor)

## Properties

### consoleLogs

> `protected` **consoleLogs**: `object`[] = `[]`

Defined in: [interpreter/index.ts:38](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/index.ts#L38)

#### args

> **args**: `any`[]

#### timestamp

> **timestamp**: `number`

#### type

> **type**: `"log"` \| `"error"` \| `"warn"`

#### Inherited from

[`WangInterpreter`](WangInterpreter.md).[`consoleLogs`](WangInterpreter.md#consolelogs)

***

### currentContext

> `protected` **currentContext**: [`ExecutionContext`](../interfaces/ExecutionContext.md)

Defined in: [interpreter/index.ts:35](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/index.ts#L35)

#### Inherited from

[`WangInterpreter`](WangInterpreter.md).[`currentContext`](WangInterpreter.md#currentcontext)

***

### globalContext

> `protected` **globalContext**: [`ExecutionContext`](../interfaces/ExecutionContext.md)

Defined in: [interpreter/index.ts:34](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/index.ts#L34)

#### Inherited from

[`WangInterpreter`](WangInterpreter.md).[`globalContext`](WangInterpreter.md#globalcontext)

***

### globalModuleCache

> `protected` **globalModuleCache**: `Map`\<`string`, `any`\>

Defined in: [interpreter/index.ts:37](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/index.ts#L37)

#### Inherited from

[`WangInterpreter`](WangInterpreter.md).[`globalModuleCache`](WangInterpreter.md#globalmodulecache)

***

### lastPipelineValue

> `protected` **lastPipelineValue**: `any` = `undefined`

Defined in: [interpreter/index.ts:36](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/index.ts#L36)

#### Inherited from

[`WangInterpreter`](WangInterpreter.md).[`lastPipelineValue`](WangInterpreter.md#lastpipelinevalue)

***

### moduleResolver

> `protected` **moduleResolver**: [`ModuleResolver`](ModuleResolver.md)

Defined in: [interpreter/index.ts:33](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/index.ts#L33)

#### Inherited from

[`WangInterpreter`](WangInterpreter.md).[`moduleResolver`](WangInterpreter.md#moduleresolver)

## Methods

### bindFunction()

> **bindFunction**(`name`, `fn`): `void`

Defined in: [interpreter/index.ts:329](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/index.ts#L329)

#### Parameters

##### name

`string`

##### fn

`Function`

#### Returns

`void`

#### Inherited from

[`WangInterpreter`](WangInterpreter.md).[`bindFunction`](WangInterpreter.md#bindfunction)

***

### createContext()

> `protected` **createContext**(`parent?`): [`ExecutionContext`](../interfaces/ExecutionContext.md)

Defined in: [interpreter/index.ts:57](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/index.ts#L57)

#### Parameters

##### parent?

[`ExecutionContext`](../interfaces/ExecutionContext.md)

#### Returns

[`ExecutionContext`](../interfaces/ExecutionContext.md)

#### Inherited from

[`WangInterpreter`](WangInterpreter.md).[`createContext`](WangInterpreter.md#createcontext)

***

### evaluateNode()

> **evaluateNode**(`node`): `Promise`\<`any`\>

Defined in: [interpreter/pausable-interpreter.ts:117](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L117)

#### Parameters

##### node

`any`

#### Returns

`Promise`\<`any`\>

#### Overrides

[`WangInterpreter`](WangInterpreter.md).[`evaluateNode`](WangInterpreter.md#evaluatenode)

***

### execute()

> **execute**(`code`, `context?`): `Promise`\<`any`\>

Defined in: [interpreter/pausable-interpreter.ts:170](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L170)

#### Parameters

##### code

`string`

##### context?

[`ExecutionContext`](../interfaces/ExecutionContext.md)

#### Returns

`Promise`\<`any`\>

#### Overrides

[`WangInterpreter`](WangInterpreter.md).[`execute`](WangInterpreter.md#execute)

***

### getCallStackTrace()

> **getCallStackTrace**(): `string`[]

Defined in: [interpreter/pausable-interpreter.ts:473](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L473)

#### Returns

`string`[]

***

### getCurrentVariables()

> **getCurrentVariables**(): `Record`\<`string`, `any`\>

Defined in: [interpreter/pausable-interpreter.ts:480](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L480)

#### Returns

`Record`\<`string`, `any`\>

***

### getExecutionState()

> **getExecutionState**(): [`ExecutionState`](../interfaces/ExecutionState.md)

Defined in: [interpreter/pausable-interpreter.ts:231](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L231)

#### Returns

[`ExecutionState`](../interfaces/ExecutionState.md)

***

### hasError()

> **hasError**(): `boolean`

Defined in: [interpreter/pausable-interpreter.ts:508](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L508)

#### Returns

`boolean`

***

### isCompleted()

> **isCompleted**(): `boolean`

Defined in: [interpreter/pausable-interpreter.ts:504](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L504)

#### Returns

`boolean`

***

### isPaused()

> **isPaused**(): `boolean`

Defined in: [interpreter/pausable-interpreter.ts:496](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L496)

#### Returns

`boolean`

***

### isRunning()

> **isRunning**(): `boolean`

Defined in: [interpreter/pausable-interpreter.ts:500](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L500)

#### Returns

`boolean`

***

### pause()

> **pause**(): `void`

Defined in: [interpreter/pausable-interpreter.ts:73](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L73)

#### Returns

`void`

***

### resume()

> **resume**(): `Promise`\<`any`\>

Defined in: [interpreter/pausable-interpreter.ts:80](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L80)

#### Returns

`Promise`\<`any`\>

***

### serialize()

> **serialize**(): [`SerializedState`](../interfaces/SerializedState.md)

Defined in: [interpreter/pausable-interpreter.ts:236](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L236)

#### Returns

[`SerializedState`](../interfaces/SerializedState.md)

***

### setVariable()

> **setVariable**(`name`, `value`): `void`

Defined in: [interpreter/index.ts:333](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/index.ts#L333)

#### Parameters

##### name

`string`

##### value

`any`

#### Returns

`void`

#### Inherited from

[`WangInterpreter`](WangInterpreter.md).[`setVariable`](WangInterpreter.md#setvariable)

***

### deserialize()

> `static` **deserialize**(`state`, `options`): `Promise`\<`PausableWangInterpreter`\>

Defined in: [interpreter/pausable-interpreter.ts:252](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/interpreter/pausable-interpreter.ts#L252)

#### Parameters

##### state

[`SerializedState`](../interfaces/SerializedState.md)

##### options

###### functions?

`Record`\<`string`, `Function`\>

###### moduleResolver?

[`ModuleResolver`](ModuleResolver.md)

#### Returns

`Promise`\<`PausableWangInterpreter`\>
