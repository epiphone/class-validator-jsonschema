# class-validator-jsonschema
[![Build Status](https://travis-ci.com/epiphone/class-validator-jsonschema.svg?token=LxSHquEwyhSfU8JddMyx&branch=master)](https://travis-ci.com/epiphone/class-validator-jsonschema)

Convert [class-validator](https://github.com/typestack/class-validator)-decorated classes into JSON Schema. The aim is to provide a best-effort conversion: since some of the `class-validator` decorators lack a direct JSON Schema counterpart, the conversion is bound to be somewhat opinionated. To account for this deficit multiple extension points are available.

**Work in progress!**

## Installation

`yarn add class-validator-jsonschema`

## Usage

TODO

### Custom validation classes

`class-validator` allows you to define [custom validation classes](https://github.com/typestack/class-validator#custom-validation-classes). You might for example want to validate that a string's length is between given values:

```javascript
import { Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'

@ValidatorConstraint()
export class CustomTextLength implements ValidatorConstraintInterface {
  validate(text: string, validationArguments: ValidationArguments) {
    const [min, max] = validationArguments.constraints
    return text.length > min && text.length < max
  }
}

class Post {
  @Validate(CustomTextLength, [0, 11])
  title: string
}
```

By default `class-validator-jsonschema` doesn't know how to convert `Post.title`
into JSON Schema. To handle custom validators add a `customValidation` converter
into `options.additionalConverters`:

```javascript
const schemas = validationMetadatasToSchemas(
  validationMetadatas,
  {
    additionalConverters: {
      customValidation: meta => {
        if (meta.constraintCls === CustomTextLength) {
          return {
            maxLength: meta.constraints[1] - 1,
            minLength: meta.constraints[0] + 1,
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

TODO

## TODO

- [ ] handle `skipMissingProperties`
- [ ] decorators for overwriting prop schemas
- [ ] property descriptions (e.g. `A Base64-encoded string`)
- [ ] split tests by decorator type
