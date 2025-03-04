# class-validator-jsonschema

[![npm version](https://badge.fury.io/js/class-validator-jsonschema.svg)](https://badge.fury.io/js/class-validator-jsonschema)

Convert [class-validator](https://github.com/typestack/class-validator)-decorated classes into OpenAPI-compatible JSON Schema. The aim is to provide a best-effort conversion: since some of the `class-validator` decorators lack a direct JSON Schema counterpart, the conversion is bound to be somewhat opinionated. To account for this multiple extension points are available.

## Installation

`npm install class-validator-jsonschema`

**Note the peer dependency versions** in [package.json](./package.json). Try installing a previous major version of `class-validator-jsonschema` in case you're stuck with older peer dependencies.

## Usage

```typescript
import { IsOptional, IsString, MaxLength } from 'class-validator'
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'

class BlogPost {
  @IsString() id: string

  @IsOptional()
  @MaxLength(20, { each: true })
  tags: string[]
}

const schemas = validationMetadatasToSchemas()
console.log(schemas)
```

which prints out:

```json
{
  "BlogPost": {
    "properties": {
      "id": {
        "type": "string"
      },
      "tags": {
        "items": {
          "maxLength": 20,
          "type": "string"
        },
        "type": "array"
      }
    },
    "required": ["id"],
    "type": "object"
  }
}
```

`validationMetadatasToSchemas` takes an `options` object as an optional parameter. Check available configuration objects and defaults at [`options.ts`](src/options.ts).

### Adding and overriding default converters

With `options.additionalConverters` you can add new validation metadata converters or override [the existing ones](src/defaultConverters.ts). Let's say we want to, for example, add a handy `description` field to each `@IsString()`-decorated property:

```typescript
import { ValidationTypes } from 'class-validator'

// ...

const schemas = validationMetadatasToSchemas({
  additionalConverters: {
    [ValidationTypes.IS_STRING]: {
      description: 'A string value',
      type: 'string',
    },
  },
})
```

which now outputs:

```json
{
  "BlogPost": {
    "properties": {
      "id": {
        "description": "A string value",
        "type": "string"
      }
      // ...
    }
  }
}
```

An additional converter can also be supplied in form of a function that receives the validation metadata item and global options, outputting a JSON Schema property object (see below for usage):

```typescript
type SchemaConverter = (
  meta: ValidationMetadata,
  options: IOptions
) => SchemaObject | void
```

### Custom validation classes

`class-validator` allows you to define [custom validation classes](https://github.com/typestack/class-validator#custom-validation-classes). You might for example validate that a string's length is between given two values:

```typescript
import {
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'

// Implementing the validator:

@ValidatorConstraint()
export class CustomTextLength implements ValidatorConstraintInterface {
  validate(text: string, validationArguments: ValidationArguments) {
    const [min, max] = validationArguments.constraints
    return text.length >= min && text.length <= max
  }
}

// ...and putting it to use:

class Post {
  @Validate(CustomTextLength, [0, 11])
  title: string
}
```

Now to handle your custom validator's JSON Schema conversion include a `CustomTextLength` converter in `options.additionalConverters`:

```typescript
const schemas = validationMetadatasToSchemas({
  additionalConverters: {
    CustomTextLength: (meta) => ({
      maxLength: meta.constraints[1],
      minLength: meta.constraints[0],
      type: 'string',
    }),
  },
})
```

### Decorating with additional properties

Validation classes can also be supplemented with the `JSONSchema` decorator. `JSONSchema` can be applied both to classes and individual properties; any given keywords are then [merged](https://lodash.com/docs/4.17.4#merge) into the JSON Schema derived from class-validator decorators:

```typescript
import { JSONSchema } from 'class-validator-jsonschema'

@JSONSchema({
  description: 'A User object',
  example: { id: '123' },
})
class BlogPost {
  @IsString()
  @JSONSchema({
    description: 'User primary key',
    format: 'custom-id',
  })
  id: string
}
```

Results in the following schema:

```json
{
  "BlogPost": {
    "description": "A User object",
    "example": { "id": "123" },
    "properties": {
      "id": {
        "description": "User primary key",
        "format": "custom-id",
        "type": "string"
      }
    },
    "required": ["id"],
    "type": "object"
  }
}
```

`JSONSchema` decorators also flow down from parent classes into [inherited validation decorators](https://github.com/typestack/class-validator#inheriting-validation-decorators). Note though that if the inherited class uses `JSONSchema` to redecorate a property from the parent class, the parent class `JSONSchema` gets overwritten - i.e. there's no merging logic.

#### Custom handlers

Alternatively `JSONSchema` can take a function of type `(existingSchema: SchemaObject, options: IOptions) => SchemaObject`. The return value of this function is then **not** automatically merged into existing schema (i.e. the one derived from `class-validator` decorators). Instead you can handle merging yourself in whichever way is preferred, the idea being that removal of existing keywords and other more complex overwrite scenarios can be implemented here.

### @ValidateNested and arrays

`class-validator` supports validating nested objects via the [`@ValidateNested` decorator](https://github.com/typestack/class-validator#validating-nested-objects). Likewise JSON Schema generation is supported out-of-the-box for nested properties such as

```typescript
@ValidateNested()
user: UserClass
```

However, due to [limitations in Typescript's reflection system](https://github.com/Microsoft/TypeScript/issues/10576) we cannot infer the inner type of a generic class. In effect this means that properties like

```typescript
@ValidateNested({ each: true })
users: UserClass[]

@ValidateNested()
user: Promise<UserClass>
```

would resolve to classes `Array` and `Promise` in JSON Schema. To work around this limitation we can use `@Type` from `class-transformer` to explicitly define the nested property's inner type:

```typescript
import { Type } from 'class-transformer'
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'
const { defaultMetadataStorage } = require('class-transformer/cjs/storage') // See https://github.com/typestack/class-transformer/issues/563 for alternatives

class User {
  @ValidateNested({ each: true })
  @Type(() => BlogPost) // 1) Explicitly define the nested property type
  blogPosts: BlogPost[]
}

const schemas = validationMetadatasToSchemas({
  classTransformerMetadataStorage: defaultMetadataStorage, // 2) Define class-transformer metadata in options
})
```

Note also how the `classTransformerMetadataStorage` option has to be defined for `@Type` decorator to take effect.

### Using a custom validation metadataStorage

Under the hood we grab validation metadata from the default storage returned by `class-validator`'s `getMetadataStorage()`. In case of a version clash or something you might want to manually pass in the storage:

```typescript
const schemas = validationMetadatasToSchemas({
  classValidatorMetadataStorage: myCustomMetadataStorage,
})
```

## Limitations

There's no handling for `class-validator`s **validation groups** or **conditional decorator** (`@ValidateIf`) out-of-the-box. The above-mentioned extension methods can be used to fill the gaps if necessary.

The OpenAPI spec doesn't currently support the new JSON Schema **draft-06 keywords** `const` and `contains`. This means that constant value decorators such as `@IsEqual()` and `@ArrayContains()` translate to quite [complicated schemas](https://github.com/sahava/gtm-datalayer-test/issues/4). Hopefully [in a not too distant future](https://github.com/OAI/OpenAPI-Specification/issues/1313#issuecomment-335893062) these keywords are adopted into the spec and we'll be able to provide neater conversion.

Handling **null values** is also tricky since OpenAPI doesn't support JSON Schema's `type: null`, providing its own `nullable` keyword instead. The default `@IsEmpty()` converter for example opts for `nullable` but you can use `type: null` instead via `options.additionalConverters`:

```typescript
// ...
additionalConverters: {
  [ValidationTypes.IS_EMPTY]: {
    anyOf: [
      {type: 'string', enum: ['']},
      {type: 'null'}
    ]
  }
}
```

## TODO

- [x] handle `skipMissingProperties` and `@isDefined()`
- [x] decorators for overwriting prop schemas
- [ ] optional property descriptions (e.g. `A Base64-encoded string`)
- [ ] optional draft-06 keywords
