[**Wang Language v0.15.6**](../README.md)

***

[Wang Language](../globals.md) / UndefinedVariableError

# Class: UndefinedVariableError

Defined in: [utils/errors.ts:149](https://github.com/artpar/wang/blob/58802c2cec3f70e57a34d12bc4273c48cb711f36/src/utils/errors.ts#L149)

## Extends

- [`WangError`](WangError.md)

## Constructors

### Constructor

> **new UndefinedVariableError**(`varName`, `availableVars`): `UndefinedVariableError`

Defined in: [utils/errors.ts:150](https://github.com/artpar/wang/blob/58802c2cec3f70e57a34d12bc4273c48cb711f36/src/utils/errors.ts#L150)

#### Parameters

##### varName

`string`

##### availableVars

`string`[]

#### Returns

`UndefinedVariableError`

#### Overrides

[`WangError`](WangError.md).[`constructor`](WangError.md#constructor)

## Properties

### context

> **context**: [`ErrorContext`](../interfaces/ErrorContext.md)

Defined in: [utils/errors.ts:14](https://github.com/artpar/wang/blob/58802c2cec3f70e57a34d12bc4273c48cb711f36/src/utils/errors.ts#L14)

#### Inherited from

[`WangError`](WangError.md).[`context`](WangError.md#context)

***

### originalError?

> `optional` **originalError**: `Error`

Defined in: [utils/errors.ts:15](https://github.com/artpar/wang/blob/58802c2cec3f70e57a34d12bc4273c48cb711f36/src/utils/errors.ts#L15)

#### Inherited from

[`WangError`](WangError.md).[`originalError`](WangError.md#originalerror)

## Methods

### getFormattedMessage()

> **getFormattedMessage**(`_sourceCode?`): `string`

Defined in: [utils/errors.ts:40](https://github.com/artpar/wang/blob/58802c2cec3f70e57a34d12bc4273c48cb711f36/src/utils/errors.ts#L40)

Get a formatted error message with suggestions

#### Parameters

##### \_sourceCode?

`string`

#### Returns

`string`

#### Inherited from

[`WangError`](WangError.md).[`getFormattedMessage`](WangError.md#getformattedmessage)

***

### toString()

> **toString**(): `string`

Defined in: [utils/errors.ts:33](https://github.com/artpar/wang/blob/58802c2cec3f70e57a34d12bc4273c48cb711f36/src/utils/errors.ts#L33)

Returns a string representation of an object.

#### Returns

`string`

#### Inherited from

[`WangError`](WangError.md).[`toString`](WangError.md#tostring)
