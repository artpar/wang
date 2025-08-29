[**Wang Language v0.14.10**](../README.md)

***

[Wang Language](../globals.md) / WangValidator

# Class: WangValidator

Defined in: [parser/wang-validator.ts:25](https://github.com/artpar/wang/blob/61b057ca9085041eb45870b6832c37fc9af1ff26/src/parser/wang-validator.ts#L25)

## Constructors

### Constructor

> **new WangValidator**(): `WangValidator`

#### Returns

`WangValidator`

## Methods

### checkSyntaxPatterns()

> **checkSyntaxPatterns**(`code`): `object`

Defined in: [parser/wang-validator.ts:160](https://github.com/artpar/wang/blob/61b057ca9085041eb45870b6832c37fc9af1ff26/src/parser/wang-validator.ts#L160)

Check if code has specific syntax patterns

#### Parameters

##### code

`string`

#### Returns

`object`

##### hasAsyncAwait

> **hasAsyncAwait**: `boolean`

##### hasClasses

> **hasClasses**: `boolean`

##### hasModules

> **hasModules**: `boolean`

##### hasMultilineArrows

> **hasMultilineArrows**: `boolean`

##### hasPipelines

> **hasPipelines**: `boolean`

***

### suggestFixes()

> **suggestFixes**(`code`): `string`[]

Defined in: [parser/wang-validator.ts:179](https://github.com/artpar/wang/blob/61b057ca9085041eb45870b6832c37fc9af1ff26/src/parser/wang-validator.ts#L179)

Suggest fixes for common issues

#### Parameters

##### code

`string`

#### Returns

`string`[]

***

### validate()

> **validate**(`code`, `options`): [`ValidationResult`](../interfaces/ValidationResult.md)

Defined in: [parser/wang-validator.ts:29](https://github.com/artpar/wang/blob/61b057ca9085041eb45870b6832c37fc9af1ff26/src/parser/wang-validator.ts#L29)

Validate Wang code without executing it

#### Parameters

##### code

`string`

##### options

[`ParserOptions`](../interfaces/ParserOptions.md) = `{}`

#### Returns

[`ValidationResult`](../interfaces/ValidationResult.md)
