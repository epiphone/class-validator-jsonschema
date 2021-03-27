// tslint:disable:no-submodule-imports
import {
  ArrayMaxSize,
  ArrayNotContains,
  getFromContainer,
  IsEmpty,
  IsMongoId,
  MaxLength,
  MetadataStorage,
} from 'class-validator'
import _get from 'lodash.get'

import { JSONSchema, validationMetadatasToSchemas } from '../src'

@JSONSchema({
  deprecated: true,
  description: 'A User object',
  example: { id: '123' },
})
// @ts-ignore: not referenced
class User {
  @JSONSchema({
    default: '1',
    description: 'User ID',
    pattern: '.*',
  })
  @IsMongoId()
  id: string

  @MaxLength(20, { each: true })
  @ArrayMaxSize(5)
  @JSONSchema({
    items: { description: 'Tag string' },
  })
  @ArrayNotContains(['admin'])
  tags?: string[]

  @JSONSchema(() => ({
    anyOf: [{ type: 'null' }, { type: 'string', const: '' }],
  }))
  @IsEmpty()
  empty?: string
}

const metadata = _get(getFromContainer(MetadataStorage), 'validationMetadatas')
const schemas = validationMetadatasToSchemas(metadata)

describe('decorators', () => {
  it('merges class-level schema keywords from decorator value', () => {
    expect(schemas.User.deprecated).toBe(true)
    expect(schemas.User.description).toEqual('A User object')
    expect(schemas.User.example).toEqual({ id: '123' })
    expect(schemas.User.required).toEqual(['id', 'tags'])
    expect(schemas.User.type).toEqual('object')
  })

  it('merges property-level schema keywords from decorator value', () => {
    expect(schemas.User.properties).toEqual({
      empty: {
        anyOf: [{ type: 'null' }, { type: 'string', const: '' }],
      },
      id: {
        default: '1',
        description: 'User ID',
        pattern: '.*',
        type: 'string',
      },
      tags: {
        items: {
          description: 'Tag string',
          maxLength: 20,
          not: {
            anyOf: [{ enum: ['admin'], type: 'string' }],
          },
          type: 'string',
        },
        maxItems: 5,
        type: 'array',
      },
    })
  })
})
