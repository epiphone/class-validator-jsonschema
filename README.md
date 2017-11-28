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

const metadata = getFromContainer(MetadataStorage).validationMetadata
const schemas = validationMetadatasToSchemas(metadata)
console.log(schemas)
```

Will output:

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

`validationMetadatasToSchemas` takes an optional options object as a second parameter. Check available options and defaults at [`options.ts`](src/options.ts).

### Custom validation classes

`class-validator` allows you to define [custom validation classes](https://github.com/typestack/class-validator#custom-validation-classes). You might for example validate that a string's length is between given two values:

```javascript
import { Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

// Implementing the validator...

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

By default `class-validator-jsonschema` doesn't know how to convert `Post.title` into JSON Schema. To handle custom validators like this add a `customValidation` converter into `options.additionalConverters`:

```javascript
const schemas = validationMetadatasToSchemas(
  validationMetadatas,
  {
    additionalConverters: {
      customValidation: meta => {
        if (meta.constraintCls === CustomTextLength) {
          return {
            maxLength: meta.constraints[1],
            minLength: meta.constraints[0],
            type: 'string'
          }
        }
        return {}
      }
    }
  }
)
```

## Limitations

The OpenAPI spec doesn't currently support the new JSON Schema draft 6 keywords `const` and `contains`. This means that constant value decorators `@IsEqual()` and `@ArrayContains()` (and their negations) translate to quite [complicated schemas](https://github.com/sahava/gtm-datalayer-test/issues/4). Hopefully [in a not too distant future](https://github.com/OAI/OpenAPI-Specification/issues/1313#issuecomment-335893062) these keywords are adopted into the spec and we'll be able to provide neater conversion.

## TODO

- [ ] handle `skipMissingProperties`
- [ ] decorators for overwriting prop schemas
- [ ] property descriptions (e.g. `A Base64-encoded string`)
- [ ] split tests by decorator type
