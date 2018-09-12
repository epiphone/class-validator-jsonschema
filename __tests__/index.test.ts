// tslint:disable:no-submodule-imports
import {
  ArrayMaxSize,
  ArrayNotContains,
  getFromContainer,
  IsBoolean,
  IsEmpty,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MetadataStorage,
  MinLength,
  ValidateNested
} from 'class-validator'
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata'
import * as _ from 'lodash'

import { validationMetadatasToSchemas } from '../src'

class User {
  @IsString() id: string

  @MinLength(5)
  firstName: string

  @IsOptional()
  @MaxLength(20, { each: true })
  @ArrayMaxSize(5)
  @ArrayNotContains(['admin'])
  tags: string[]

  @IsEmpty() empty: string
}

// @ts-ignore: not referenced
class Post {
  @IsOptional()
  @ValidateNested()
  user: User

  @Length(2, 100)
  @IsOptional()
  title: string

  @IsBoolean()
  @IsOptional()
  published: true
}

describe('classValidatorConverter', () => {
  it('handles empty metadata', () => {
    expect(validationMetadatasToSchemas([])).toEqual({})
  })

  it('returns empty schema object when no converter found', () => {
    const customMetadata: ValidationMetadata = {
      always: false,
      constraintCls: () => undefined,
      constraints: [],
      each: false,
      groups: [],
      message: '',
      propertyName: 'id',
      target: User,
      type: 'NON_EXISTENT_METADATA_TYPE',
      validationTypeOptions: {}
    }

    const schemas = validationMetadatasToSchemas([customMetadata])
    expect(schemas.User.properties!.id).toEqual({})
  })

  it('combines converted class-validator metadata into JSON Schemas', () => {
    const metadata = _.get(
      getFromContainer(MetadataStorage),
      'validationMetadatas'
    )
    const schemas = validationMetadatasToSchemas(metadata)

    expect(schemas).toEqual({
      Post: {
        properties: {
          published: {
            type: 'boolean'
          },
          title: {
            maxLength: 100,
            minLength: 2,
            type: 'string'
          },
          user: {
            $ref: '#/definitions/User'
          }
        },
        type: 'object'
      },
      User: {
        properties: {
          empty: {
            anyOf: [
              { type: 'string', enum: [''] },
              {
                not: {
                  anyOf: [
                    { type: 'string' },
                    { type: 'number' },
                    { type: 'boolean' },
                    { type: 'integer' },
                    { type: 'array' },
                    { type: 'object' }
                  ]
                },
                nullable: true
              }
            ]
          },
          firstName: { minLength: 5, type: 'string' },
          id: { type: 'string' },
          tags: {
            items: {
              maxLength: 20,
              not: {
                anyOf: [{ enum: ['admin'], type: 'string' }]
              },
              type: 'string'
            },
            maxItems: 5,
            type: 'array'
          }
        },
        required: ['id', 'firstName'],
        type: 'object'
      }
    })
  })
})
