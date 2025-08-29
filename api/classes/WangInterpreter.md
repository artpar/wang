[**Wang Language v0.14.10**](../README.md)

***

[Wang Language](../globals.md) / WangInterpreter

# Class: WangInterpreter

Defined in: [interpreter/index.ts:32](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L32)

## Extended by

- [`PausableWangInterpreter`](PausableWangInterpreter.md)

## Constructors

### Constructor

> **new WangInterpreter**(`options`): `WangInterpreter`

Defined in: [interpreter/index.ts:41](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L41)

#### Parameters

##### options

[`InterpreterOptions`](../interfaces/InterpreterOptions.md) = `{}`

#### Returns

`WangInterpreter`

## Properties

### consoleLogs

> `protected` **consoleLogs**: `object`[] = `[]`

Defined in: [interpreter/index.ts:38](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L38)

#### args

> **args**: `any`[]

#### timestamp

> **timestamp**: `number`

#### type

> **type**: `"log"` \| `"error"` \| `"warn"`

***

### currentContext

> `protected` **currentContext**: [`ExecutionContext`](../interfaces/ExecutionContext.md)

Defined in: [interpreter/index.ts:35](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L35)

***

### globalContext

> `protected` **globalContext**: [`ExecutionContext`](../interfaces/ExecutionContext.md)

Defined in: [interpreter/index.ts:34](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L34)

***

### globalModuleCache

> `protected` **globalModuleCache**: `Map`\<`string`, `any`\>

Defined in: [interpreter/index.ts:37](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L37)

***

### lastPipelineValue

> `protected` **lastPipelineValue**: `any` = `undefined`

Defined in: [interpreter/index.ts:36](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L36)

***

### moduleResolver

> `protected` **moduleResolver**: [`ModuleResolver`](ModuleResolver.md)

Defined in: [interpreter/index.ts:33](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L33)

## Methods

### bindFunction()

> **bindFunction**(`name`, `fn`): `void`

Defined in: [interpreter/index.ts:329](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L329)

#### Parameters

##### name

`string`

##### fn

`Function`

#### Returns

`void`

***

### createContext()

> `protected` **createContext**(`parent?`): [`ExecutionContext`](../interfaces/ExecutionContext.md)

Defined in: [interpreter/index.ts:57](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L57)

#### Parameters

##### parent?

[`ExecutionContext`](../interfaces/ExecutionContext.md)

#### Returns

[`ExecutionContext`](../interfaces/ExecutionContext.md)

***

### evaluateNode()

> `protected` **evaluateNode**(`node`): `Promise`\<`any`\>

Defined in: [interpreter/index.ts:729](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L729)

#### Parameters

##### node

`any`

#### Returns

`Promise`\<`any`\>

***

### execute()

#### Call Signature

> **execute**(`code`, `context?`): `Promise`\<`any`\>

Defined in: [interpreter/index.ts:337](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L337)

##### Parameters

###### code

`string`

###### context?

[`ExecutionContext`](../interfaces/ExecutionContext.md)

##### Returns

`Promise`\<`any`\>

#### Call Signature

> **execute**(`code`, `context`, `options`): `Promise`\<\{ `metadata`: \{ `logs`: `object`[]; \}; `result`: `any`; \}\>

Defined in: [interpreter/index.ts:338](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L338)

##### Parameters

###### code

`string`

###### context

`undefined` | [`ExecutionContext`](../interfaces/ExecutionContext.md)

###### options

###### withMetadata

`true`

##### Returns

`Promise`\<\{ `metadata`: \{ `logs`: `object`[]; \}; `result`: `any`; \}\>

***

### setVariable()

> **setVariable**(`name`, `value`): `void`

Defined in: [interpreter/index.ts:333](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/interpreter/index.ts#L333)

#### Parameters

##### name

`string`

##### value

`any`

#### Returns

`void`
