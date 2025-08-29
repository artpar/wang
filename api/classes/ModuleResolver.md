[**Wang Language v0.14.10**](../README.md)

***

[Wang Language](../globals.md) / ModuleResolver

# Abstract Class: ModuleResolver

Defined in: [resolvers/base.ts:14](https://github.com/artpar/wang/blob/61b057ca9085041eb45870b6832c37fc9af1ff26/src/resolvers/base.ts#L14)

Base interface for module resolvers
Implement this interface to provide custom module resolution

## Extended by

- [`InMemoryModuleResolver`](InMemoryModuleResolver.md)

## Constructors

### Constructor

> **new ModuleResolver**(): `ModuleResolver`

#### Returns

`ModuleResolver`

## Methods

### clearCache()?

> `optional` **clearCache**(): `void`

Defined in: [resolvers/base.ts:41](https://github.com/artpar/wang/blob/61b057ca9085041eb45870b6832c37fc9af1ff26/src/resolvers/base.ts#L41)

Clear any caches (optional)

#### Returns

`void`

***

### exists()

> `abstract` **exists**(`modulePath`, `fromPath?`): `Promise`\<`boolean`\>

Defined in: [resolvers/base.ts:29](https://github.com/artpar/wang/blob/61b057ca9085041eb45870b6832c37fc9af1ff26/src/resolvers/base.ts#L29)

Check if a module exists

#### Parameters

##### modulePath

`string`

The module path to check

##### fromPath?

`string`

The path of the importing module (for relative resolution)

#### Returns

`Promise`\<`boolean`\>

Promise resolving to true if module exists

***

### getMetadata()?

> `optional` **getMetadata**(`modulePath`): `Promise`\<`null` \| `Record`\<`string`, `any`\>\>

Defined in: [resolvers/base.ts:48](https://github.com/artpar/wang/blob/61b057ca9085041eb45870b6832c37fc9af1ff26/src/resolvers/base.ts#L48)

Get module metadata (optional)

#### Parameters

##### modulePath

`string`

The module path

#### Returns

`Promise`\<`null` \| `Record`\<`string`, `any`\>\>

Promise resolving to module metadata

***

### list()

> `abstract` **list**(`prefix?`): `Promise`\<`string`[]\>

Defined in: [resolvers/base.ts:36](https://github.com/artpar/wang/blob/61b057ca9085041eb45870b6832c37fc9af1ff26/src/resolvers/base.ts#L36)

List available modules (for autocomplete/suggestions)

#### Parameters

##### prefix?

`string`

Optional prefix to filter modules

#### Returns

`Promise`\<`string`[]\>

Promise resolving to array of available module paths

***

### resolve()

> `abstract` **resolve**(`modulePath`, `fromPath?`): `Promise`\<[`ModuleResolution`](../interfaces/ModuleResolution.md)\>

Defined in: [resolvers/base.ts:21](https://github.com/artpar/wang/blob/61b057ca9085041eb45870b6832c37fc9af1ff26/src/resolvers/base.ts#L21)

Resolve a module path to its source code

#### Parameters

##### modulePath

`string`

The module path to resolve (e.g., "./utils", "@wang/core", "https://...")

##### fromPath?

`string`

The path of the importing module (for relative resolution)

#### Returns

`Promise`\<[`ModuleResolution`](../interfaces/ModuleResolution.md)\>

Promise resolving to module code and resolved path
