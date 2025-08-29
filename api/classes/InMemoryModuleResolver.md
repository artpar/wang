[**Wang Language v0.14.7**](../README.md)

***

[Wang Language](../globals.md) / InMemoryModuleResolver

# Class: InMemoryModuleResolver

Defined in: [resolvers/memory.ts:7](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L7)

In-memory module resolver for testing and temporary modules

## Extends

- [`ModuleResolver`](ModuleResolver.md)

## Constructors

### Constructor

> **new InMemoryModuleResolver**(): `InMemoryModuleResolver`

Defined in: [resolvers/memory.ts:11](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L11)

#### Returns

`InMemoryModuleResolver`

#### Overrides

[`ModuleResolver`](ModuleResolver.md).[`constructor`](ModuleResolver.md#constructor)

## Accessors

### isEmpty

#### Get Signature

> **get** **isEmpty**(): `boolean`

Defined in: [resolvers/memory.ts:128](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L128)

Check if resolver has any modules

##### Returns

`boolean`

***

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: [resolvers/memory.ts:121](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L121)

Get the number of modules

##### Returns

`number`

## Methods

### addModule()

> **addModule**(`path`, `code`, `metadata?`): `this`

Defined in: [resolvers/memory.ts:20](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L20)

Add a module to the resolver

#### Parameters

##### path

`string`

##### code

`string`

##### metadata?

`Record`\<`string`, `any`\>

#### Returns

`this`

***

### addModules()

> **addModules**(`modules`): `this`

Defined in: [resolvers/memory.ts:34](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L34)

Add multiple modules at once

#### Parameters

##### modules

`Record`\<`string`, `string`\>

#### Returns

`this`

***

### clearCache()

> **clearCache**(): `void`

Defined in: [resolvers/memory.ts:107](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L107)

Clear any caches (optional)

#### Returns

`void`

#### Overrides

[`ModuleResolver`](ModuleResolver.md).[`clearCache`](ModuleResolver.md#clearcache)

***

### exists()

> **exists**(`modulePath`, `fromPath?`): `Promise`\<`boolean`\>

Defined in: [resolvers/memory.ts:88](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L88)

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

#### Overrides

[`ModuleResolver`](ModuleResolver.md).[`exists`](ModuleResolver.md#exists)

***

### exportModules()

> **exportModules**(): `Record`\<`string`, \{ `code`: `string`; `metadata?`: `Record`\<`string`, `any`\>; \}\>

Defined in: [resolvers/memory.ts:135](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L135)

Export all modules (useful for serialization)

#### Returns

`Record`\<`string`, \{ `code`: `string`; `metadata?`: `Record`\<`string`, `any`\>; \}\>

***

### getMetadata()

> **getMetadata**(`modulePath`): `Promise`\<`null` \| `Record`\<`string`, `any`\>\>

Defined in: [resolvers/memory.ts:113](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L113)

Get module metadata (optional)

#### Parameters

##### modulePath

`string`

The module path

#### Returns

`Promise`\<`null` \| `Record`\<`string`, `any`\>\>

Promise resolving to module metadata

#### Overrides

[`ModuleResolver`](ModuleResolver.md).[`getMetadata`](ModuleResolver.md#getmetadata)

***

### importModules()

> **importModules**(`modules`): `this`

Defined in: [resolvers/memory.ts:151](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L151)

Import modules (useful for deserialization)

#### Parameters

##### modules

`Record`\<`string`, \{ `code`: `string`; `metadata?`: `Record`\<`string`, `any`\>; \}\>

#### Returns

`this`

***

### list()

> **list**(`prefix?`): `Promise`\<`string`[]\>

Defined in: [resolvers/memory.ts:97](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L97)

List available modules (for autocomplete/suggestions)

#### Parameters

##### prefix?

`string`

Optional prefix to filter modules

#### Returns

`Promise`\<`string`[]\>

Promise resolving to array of available module paths

#### Overrides

[`ModuleResolver`](ModuleResolver.md).[`list`](ModuleResolver.md#list)

***

### removeModule()

> **removeModule**(`path`): `boolean`

Defined in: [resolvers/memory.ts:44](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L44)

Remove a module

#### Parameters

##### path

`string`

#### Returns

`boolean`

***

### resolve()

> **resolve**(`modulePath`, `fromPath?`): `Promise`\<[`ModuleResolution`](../interfaces/ModuleResolution.md)\>

Defined in: [resolvers/memory.ts:50](https://github.com/artpar/wang/blob/01335fe567f9c6e76135c61a1659d6d5a1b99bd1/src/resolvers/memory.ts#L50)

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

#### Overrides

[`ModuleResolver`](ModuleResolver.md).[`resolve`](ModuleResolver.md#resolve)
