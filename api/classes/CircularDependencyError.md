[**Wang Language v0.15.1**](../README.md)

***

[Wang Language](../globals.md) / CircularDependencyError

# Class: CircularDependencyError

Defined in: [utils/errors.ts:105](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/utils/errors.ts#L105)

## Extends

- [`WangError`](WangError.md)

## Constructors

### Constructor

> **new CircularDependencyError**(`cycle`): `CircularDependencyError`

Defined in: [utils/errors.ts:106](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/utils/errors.ts#L106)

#### Parameters

##### cycle

`string`[]

#### Returns

`CircularDependencyError`

#### Overrides

[`WangError`](WangError.md).[`constructor`](WangError.md#constructor)

## Properties

### context

> **context**: [`ErrorContext`](../interfaces/ErrorContext.md)

Defined in: [utils/errors.ts:14](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/utils/errors.ts#L14)

#### Inherited from

[`WangError`](WangError.md).[`context`](WangError.md#context)

***

### originalError?

> `optional` **originalError**: `Error`

Defined in: [utils/errors.ts:15](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/utils/errors.ts#L15)

#### Inherited from

[`WangError`](WangError.md).[`originalError`](WangError.md#originalerror)

## Methods

### getFormattedMessage()

> **getFormattedMessage**(`_sourceCode?`): `string`

Defined in: [utils/errors.ts:40](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/utils/errors.ts#L40)

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

Defined in: [utils/errors.ts:33](https://github.com/artpar/wang/blob/6fd47f3c686112dedb036605c4793069ac5c3882/src/utils/errors.ts#L33)

Returns a string representation of an object.

#### Returns

`string`

#### Inherited from

[`WangError`](WangError.md).[`toString`](WangError.md#tostring)
