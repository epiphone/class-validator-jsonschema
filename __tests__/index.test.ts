import {
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
  it('generates OpenAPI schemas from class-validator metadata', () => {
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
              type: 'string'
            },
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

  it('handles each: true ', () => {
    // TODO
  })
})
