[**Wang Language v0.14.11**](../README.md)

***

[Wang Language](../globals.md) / WangValidator

# Class: WangValidator

Defined in: [parser/wang-validator.ts:25](https://github.com/artpar/wang/blob/9737d965513f58f6cbb8f8bc12f670e6d28ee0ae/src/parser/wang-validator.ts#L25)

## Constructors

### Constructor

> **new WangValidator**(): `WangValidator`

#### Returns

`WangValidator`

## Methods

### checkSyntaxPatterns()

> **checkSyntaxPatterns**(`code`): `object`

Defined in: [parser/wang-validator.ts:160](https://github.com/artpar/wang/blob/9737d965513f58f6cbb8f8bc12f670e6d28ee0ae/src/parser/wang-validator.ts#L160)

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

Defined in: [parser/wang-validator.ts:179](https://github.com/artpar/wang/blob/9737d965513f58f6cbb8f8bc12f670e6d28ee0ae/src/parser/wang-validator.ts#L179)

Suggest fixes for common issues

#### Parameters

##### code

`string`

#### Returns

`string`[]

***

### validate()

> **validate**(`code`, `options`): [`ValidationResult`](../interfaces/ValidationResult.md)

Defined in: [parser/wang-validator.ts:29](https://github.com/artpar/wang/blob/9737d965513f58f6cbb8f8bc12f670e6d28ee0ae/src/parser/wang-validator.ts#L29)

Validate Wang code without executing it

#### Parameters

##### code

`string`

##### options

[`ParserOptions`](../interfaces/ParserOptions.md) = `{}`

#### Returns

[`ValidationResult`](../interfaces/ValidationResult.md)
