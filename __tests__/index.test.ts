import {
  ArrayMaxSize,
  ArrayNotContains,
  getFromContainer,
  IsOptional,
  IsString,
  MaxLength,
  MetadataStorage,
  MinLength,
  ValidateNested
} from 'class-validator'
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
}

// @ts-ignore: not referenced
class Post {
  @IsOptional()
  @ValidateNested()
  user: User
}

const metadata = _.get(getFromContainer(MetadataStorage), 'validationMetadatas')
const schemas = validationMetadatasToSchemas(metadata)

describe('classValidatorConverter', () => {
  it('combines converted class-validator metadata into JSON Schemas', () => {
    expect(schemas).toEqual({
      Post: {
        properties: {
          user: {
            $ref: '#/definitions/User'
          }
        },
        required: [],
        type: 'object'
      },
      User: {
        properties: {
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

  it('handles isDefined', () => {
    // TODO
  })
})
