// tslint:disable:no-submodule-imports
import { IsString, MinLength, ValidateNested } from 'class-validator'
import { validationMetadatasToSchemas } from '../src'
import { Type } from 'class-transformer'
const { defaultMetadataStorage } = require('class-transformer/cjs/storage')

class User {
  @IsString()
  name: string
}

// @ts-ignore: not referenced
class Post {
  @Type(() => {
    return String
  })
  @MinLength(2, { each: true })
  userStatus: Map<string, string>
}

// @ts-ignore: not referenced
class PostWidthUsers {
  @ValidateNested({ each: true })
  @Type(() => User)
  users: Map<string, User>
}

describe('classValidatorConverter', () => {
  it('combines converted class-validator metadata into JSON Schemas', async () => {
    const schemas = validationMetadatasToSchemas({
      classTransformerMetadataStorage: defaultMetadataStorage,
    })
    expect(schemas).toEqual({
      User: {
        properties: {
          name: {
            type: 'string',
          },
        },
        type: 'object',
        required: ['name'],
      },
      Post: {
        properties: {
          userStatus: {
            additionalProperties: {
              minLength: 2,
              type: 'string',
            },
            type: 'object',
          },
        },
        type: 'object',
        required: ['userStatus'],
      },
      PostWidthUsers: {
        properties: {
          users: {
            additionalProperties: {
              $ref: '#/definitions/User',
            },
            type: 'object',
          },
        },
        type: 'object',
        required: ['users'],
      },
    })
  })
})
