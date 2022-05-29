// tslint:disable:no-submodule-imports
import { Exclude } from 'class-transformer'
import { Allow, IsOptional, IsString } from 'class-validator'
import { validationMetadatasToSchemas } from '../src'
const { defaultMetadataStorage } = require('class-transformer/cjs/storage')

class Parent {
  @Allow()
  inherited: unknown

  @Exclude()
  @Allow()
  inheritedInternal: unknown

  @Allow()
  excludedInUser: unknown
}

// @ts-ignore unused
class User extends Parent {
  @IsString()
  id: string

  @Exclude()
  @Allow()
  internal: unknown

  @Exclude()
  @IsOptional()
  excludedInUser: unknown
}

describe('Exclude() decorator', () => {
  it('omits Exclude()-decorated properties from output schema', () => {
    const schema = validationMetadatasToSchemas({
      classTransformerMetadataStorage: defaultMetadataStorage,
    })

    expect(schema).toEqual({
      Parent: {
        properties: {
          excludedInUser: {},
          inherited: {},
        },
        type: 'object',
        required: ['inherited', 'excludedInUser'],
      },
      User: {
        properties: {
          id: { type: 'string' },
          inherited: {},
        },
        type: 'object',
        required: ['id', 'inherited'],
      },
    })
  })
})
