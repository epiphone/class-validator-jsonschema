# class-validator-jsonschema
[![Build Status](https://travis-ci.com/epiphone/class-validator-jsonschema.svg?token=LxSHquEwyhSfU8JddMyx&branch=master)](https://travis-ci.com/epiphone/class-validator-jsonschema)

Convert [class-validator](https://github.com/typestack/class-validator)-decorated classes into OpenAPI-compatible JSON Schema. The aim is to provide a best-effort conversion: since some of the `class-validator` decorators lack a direct JSON Schema counterpart, the conversion is bound to be somewhat opinionated. To account for this multiple extension points are available.

**Work in progress!**

## Installation

`yarn add class-validator-jsonschema`

## Usage

```typescript
import { getFromContainer, IsOptional, IsString, MaxLength, MetadataStorage } from 'class-validator'
import { validationMetadatasToSchemas } from 'class-validator-jsonschema'

class BlogPost {
  @IsString() id: string

  @IsOptional()
  @MaxLength(20, { each: true })
  tags: string[]
}

const metadatas = getFromContainer(MetadataStorage).validationMetadata
const schemas = validationMetadatasToSchemas(metadatas)
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
    "required": [
      "id"
    ],
    "type": "object"
  }
}
```

`validationMetadatasToSchemas` takes an `options` object as an optional second parameter. Check available configuration objects and defaults at [`options.ts`](src/options.ts).

### Adding and overriding default converters

With `options.additionalConverters` you can add new validation metadata converters or override [the existing ones](src/defaultConverters.ts). Let's say we want to, for example, add a handy `description` field to each `@IsString()`-decorated property:

```typescript
import { ValidationTypes } from 'class-validator'

// ...

const schemas = validationMetadatasToSchemas(metadatas, {
  additionalConverters: {
    [ValidationTypes.IS_STRING]: {
      description: 'A string value',
      type: 'string'
    }
  }
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
      },
      // ...
    }
  }
}
```

An additional converter can also be supplied in form of a function that receives the validation metadata item and global options, outputting a JSON Schema property object (see below for usage):

```typescript
type SchemaConverter = (meta: ValidationMetadata, options: IOptions) => SchemaObject | void
```


### Custom validation classes

`class-validator` allows you to define [custom validation classes](https://github.com/typestack/class-validator#custom-validation-classes). You might for example validate that a string's length is between given two values:

```typescript
import { Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

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

Now to handle your custom validator's JSON Schema conversion include a `customValidation` converter in `options.additionalConverters`:

```typescript
const schemas = validationMetadatasToSchemas(
  validationMetadatas,
  {
    additionalConverters: {
      [ValidationTypes.CUSTOM_VALIDATION]: meta => {
        if (meta.constraintCls === CustomTextLength) {
          return {
            maxLength: meta.constraints[1],
            minLength: meta.constraints[0],
            type: 'string'
          }
        }
      }
    }
  }
)
```

## Limitations

The OpenAPI spec doesn't currently support the new JSON Schema draft-06 keywords `const` and `contains`. This means that constant value decorators such as `@IsEqual()` and `@ArrayContains()` translate to quite [complicated schemas](https://github.com/sahava/gtm-datalayer-test/issues/4). Hopefully [in a not too distant future](https://github.com/OAI/OpenAPI-Specification/issues/1313#issuecomment-335893062) these keywords are adopted into the spec and we'll be able to provide neater conversion.

## TODO

- [ ] handle `skipMissingProperties`
- [ ] decorators for overwriting prop schemas
- [ ] property descriptions (e.g. `A Base64-encoded string`)
- [ ] conditional validation?
- [ ] option for enabling draft-06 keywords
- [ ] define limitations more thoroughly
- [ ] `IS_EMPTY` and `IS_DEFINED`
