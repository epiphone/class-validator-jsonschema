// tslint:disable:no-submodule-imports
import {
  Contains,
  getFromContainer,
  IsDefined,
  IsEmail,
  IsMobilePhone,
  IsOptional,
  IsString,
  MaxLength,
  MetadataStorage,
  MinLength
} from 'class-validator'
import * as _ from 'lodash'

import { JSONSchema, validationMetadatasToSchemas } from '../src'

@JSONSchema({
  description: 'Contains email, password and phone',
  summary: 'Base object'
})
class BaseContent {
  @JSONSchema({
    default: 'some@email.com'
  })
  @IsDefined()
  @IsEmail()
  email: string

  @JSONSchema({
    description: 'Password field',
    summary: 'Password'
  })
  @IsString()
  @IsOptional()
  password: string

  @IsDefined()
  @IsMobilePhone('fi')
  phone: string
}

@JSONSchema({
  summary: 'User object'
})
// @ts-ignore: not referenced
class User extends BaseContent {
  @MinLength(10)
  @MaxLength(20)
  name: string

  @JSONSchema({
    description: 'Password field - required!'
  })
  @MinLength(20)
  @IsDefined()
  password: string

  @JSONSchema({
    summary: 'Mobile phone number'
  })
  @IsOptional()
  phone: string

  @Contains('hello') welcome: string
}

const metadatas = _.get(
  getFromContainer(MetadataStorage),
  'validationMetadatas'
)

describe('Inheriting validation decorators', () => {
  it('inherits and merges validation decorators from parent class', () => {
    const schemas = validationMetadatasToSchemas(metadatas)

    expect(schemas.BaseContent).toEqual({
      description: 'Contains email, password and phone',
      properties: {
        email: {
          default: 'some@email.com',
          format: 'email',
          type: 'string'
        },
        password: {
          description: 'Password field',
          summary: 'Password',
          type: 'string'
        },
        phone: {
          format: 'mobile-phone',
          type: 'string'
        }
      },
      required: ['email', 'phone'],
      summary: 'Base object',
      type: 'object'
    })

    expect(schemas.User).toEqual({
      properties: {
        email: {
          default: 'some@email.com',
          format: 'email',
          type: 'string'
        },
        name: {
          maxLength: 20,
          minLength: 10,
          type: 'string'
        },
        password: {
          description: 'Password field - required!',
          minLength: 20,
          type: 'string'
        },
        phone: {
          format: 'mobile-phone',
          summary: 'Mobile phone number',
          type: 'string'
        },
        welcome: {
          pattern: 'hello',
          type: 'string'
        }
      },
      required: ['name', 'welcome', 'email'],
      summary: 'User object',
      type: 'object'
    })
  })

  it('handles inherited IsDefined decorators when skipMissingProperties is enabled', () => {
    const schemas = validationMetadatasToSchemas(metadatas, {
      skipMissingProperties: true
    })

    expect(schemas.BaseContent.required).toEqual(['email', 'phone'])
    expect(schemas.User.required).toEqual(['password', 'email'])
  })
})
