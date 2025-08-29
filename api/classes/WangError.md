[**Wang Language v0.14.10**](../README.md)

***

[Wang Language](../globals.md) / WangError

# Class: WangError

Defined in: [utils/errors.ts:13](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/utils/errors.ts#L13)

## Extends

- `Error`

## Extended by

- [`ModuleNotFoundError`](ModuleNotFoundError.md)
- [`CircularDependencyError`](CircularDependencyError.md)
- [`TypeMismatchError`](TypeMismatchError.md)
- [`UndefinedVariableError`](UndefinedVariableError.md)
- [`FunctionNotFoundError`](FunctionNotFoundError.md)

## Constructors

### Constructor

> **new WangError**(`message`, `context`, `originalError?`): `WangError`

Defined in: [utils/errors.ts:17](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/utils/errors.ts#L17)

#### Parameters

##### message

`string`

##### context

[`ErrorContext`](../interfaces/ErrorContext.md) = `...`

##### originalError?

`Error`

#### Returns

`WangError`

#### Overrides

`Error.constructor`

## Properties

### context

> **context**: [`ErrorContext`](../interfaces/ErrorContext.md)

Defined in: [utils/errors.ts:14](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/utils/errors.ts#L14)

***

### originalError?

> `optional` **originalError**: `Error`

Defined in: [utils/errors.ts:15](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/utils/errors.ts#L15)

## Methods

### getFormattedMessage()

> **getFormattedMessage**(`_sourceCode?`): `string`

Defined in: [utils/errors.ts:40](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/utils/errors.ts#L40)

Get a formatted error message with suggestions

#### Parameters

##### \_sourceCode?

`string`

#### Returns

`string`

***

### toString()

> **toString**(): `string`

Defined in: [utils/errors.ts:33](https://github.com/artpar/wang/blob/914dd143e8b6182e76382164a1f196c5d1006f9d/src/utils/errors.ts#L33)

Returns a string representation of an object.

#### Returns

`string`
