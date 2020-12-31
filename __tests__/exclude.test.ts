// tslint:disable:no-submodule-imports
import { Exclude } from 'class-transformer'
import { defaultMetadataStorage } from 'class-transformer/storage'
import { Allow, IsString } from 'class-validator'
import { validationMetadatasToSchemas } from '../src'

class Parent {
  @Allow()
  inherited: unknown

  @Exclude()
  @Allow()
  inheritedInternal: unknown
}

// @ts-ignore unused
class User extends Parent {
  @IsString()
  id: string

  @Exclude()
  @Allow()
  internal: unknown
}

describe('Exclude() decorator', () => {
  it('omits Exclude()-decorated properties from output schema', () => {
    const schema = validationMetadatasToSchemas({
      classTransformerMetadataStorage: defaultMetadataStorage,
    })

    expect(schema).toEqual({
      Parent: {
        properties: {
          inherited: {},
        },
        type: 'object',
        required: ['inherited'],
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
