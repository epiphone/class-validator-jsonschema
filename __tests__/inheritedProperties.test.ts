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
  MinLength,
} from 'class-validator'
import _get from 'lodash.get'

import {
  JSONSchema,
  targetConstructorToSchema,
  validationMetadatasToSchemas,
} from '../src'

@JSONSchema({
  description: 'Contains email, password and phone',
  title: 'Base object',
})
class BaseContent {
  @JSONSchema({
    default: 'some@email.com',
  })
  @IsDefined()
  @IsEmail()
  email: string

  @JSONSchema({
    description: 'Password field',
    title: 'Password',
  })
  @IsString()
  @IsOptional()
  password: string

  @IsDefined()
  @IsMobilePhone('fi-FI')
  phone: string
}

@JSONSchema({
  title: 'User object',
})
class User extends BaseContent {
  @MinLength(10)
  @MaxLength(20)
  name: string

  @JSONSchema({
    description: 'Password field - required!',
  })
  @MinLength(20)
  @IsDefined()
  password: string

  @JSONSchema({
    title: 'Mobile phone number',
  })
  @IsOptional()
  phone: string

  @Contains('hello') welcome: string
}

// @ts-ignore: not referenced
class Admin extends User {}

const metadatas = _get(getFromContainer(MetadataStorage), 'validationMetadatas')

describe('Inheriting validation decorators', () => {
  it('inherits and merges validation decorators from parent class', () => {
    const schemas = validationMetadatasToSchemas(metadatas)

    expect(schemas.BaseContent).toEqual({
      description: 'Contains email, password and phone',
      properties: {
        email: {
          default: 'some@email.com',
          format: 'email',
          type: 'string',
          not: { type: 'null' },
        },
        password: {
          description: 'Password field',
          title: 'Password',
          type: 'string',
        },
        phone: {
          format: 'mobile-phone',
          type: 'string',
          not: { type: 'null' },
        },
      },
      required: ['email', 'phone'],
      title: 'Base object',
      type: 'object',
    })

    expect(schemas.User).toEqual({
      properties: {
        email: {
          default: 'some@email.com',
          format: 'email',
          type: 'string',
          not: { type: 'null' },
        },
        name: {
          maxLength: 20,
          minLength: 10,
          type: 'string',
        },
        password: {
          description: 'Password field - required!',
          minLength: 20,
          type: 'string',
          not: { type: 'null' },
        },
        phone: {
          format: 'mobile-phone',
          title: 'Mobile phone number',
          type: 'string',
          not: { type: 'null' },
        },
        welcome: {
          pattern: 'hello',
          type: 'string',
        },
      },
      required: ['name', 'welcome', 'email'],
      title: 'User object',
      type: 'object',
    })
  })

  it('handles inherited IsDefined decorators when skipMissingProperties is enabled', () => {
    const schemas = validationMetadatasToSchemas({
      skipMissingProperties: true,
    })

    expect(schemas.BaseContent.required).toEqual(['email', 'phone'])
    expect(schemas.User.required).toEqual(['password', 'email'])
  })

  it('inherits and merges validation decorators from multiple parent classes and empty child class', () => {
    const schema = targetConstructorToSchema(Admin)

    expect(schema).toEqual({
      properties: {
        email: {
          default: 'some@email.com',
          format: 'email',
          type: 'string',
          not: { type: 'null' },
        },
        name: {
          maxLength: 20,
          minLength: 10,
          type: 'string',
        },
        password: {
          description: 'Password field - required!',
          minLength: 20,
          type: 'string',
          not: { type: 'null' },
        },
        phone: {
          format: 'mobile-phone',
          title: 'Mobile phone number',
          type: 'string',
          not: { type: 'null' },
        },
        welcome: {
          pattern: 'hello',
          type: 'string',
        },
      },
      required: ['name', 'welcome', 'email'],
      title: 'User object',
      type: 'object',
    })
  })
})
