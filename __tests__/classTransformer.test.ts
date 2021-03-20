// tslint:disable:no-submodule-imports
import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  getFromContainer,
  IsOptional,
  IsString,
  MetadataStorage,
  ValidateNested,
} from 'class-validator'

import { validationMetadatasToSchemas } from '../src'
const { defaultMetadataStorage } = require('class-transformer/cjs/storage')

class ValidationError {
  @IsString({ each: true })
  path: string[]

  @IsString({ each: true })
  constraints: string[]
}

export class ValidationErrorModel {
  @IsString() name: 'ValidationError'

  @Type(() => ValidationError)
  @ValidateNested({ each: true })
  errorList: ValidationError[]

  @ArrayMinSize(1)
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ValidationError)
  anotherErrorList: ValidationError[]
}

describe('class-transformer compatibility', () => {
  it('ignores @Type decorator when classTransformerMetadataStorage option is not defined', () => {
    // @ts-ignore
    const metadata = getFromContainer(MetadataStorage).validationMetadatas
    const schemas = validationMetadatasToSchemas()

    expect(schemas.ValidationErrorModel).toEqual({
      properties: {
        anotherErrorList: {
          items: {
            $ref: '#/definitions/Array',
          },
          minItems: 1,
          type: 'array',
        },
        errorList: {
          items: {
            $ref: '#/definitions/Array',
          },
          type: 'array',
        },
        name: {
          type: 'string',
        },
      },
      required: ['name', 'errorList'],
      type: 'object',
    })
  })

  it('applies @Type decorator when classTransformerMetadataStorage option is defined', () => {
    // @ts-ignore
    const metadata = getFromContainer(MetadataStorage).validationMetadatas
    const schemas = validationMetadatasToSchemas({
      classTransformerMetadataStorage: defaultMetadataStorage,
    })

    expect(schemas.ValidationErrorModel).toEqual({
      properties: {
        anotherErrorList: {
          items: {
            $ref: '#/definitions/ValidationError',
          },
          minItems: 1,
          type: 'array',
        },
        errorList: {
          items: {
            $ref: '#/definitions/ValidationError',
          },
          type: 'array',
        },
        name: {
          type: 'string',
        },
      },
      required: ['name', 'errorList'],
      type: 'object',
    })
  })
})
