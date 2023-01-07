// tslint:disable:no-submodule-imports
import {
  Allow,
  ArrayMaxSize,
  ArrayNotContains,
  IsBoolean,
  IsEmpty,
  IsNotEmptyObject,
  IsObject,
  IsOptional,
  IsString,
  Length,
  MaxLength,
  MetadataStorage,
  MinLength,
  ValidateNested,
} from 'class-validator'
import { ValidationMetadata } from 'class-validator/types/metadata/ValidationMetadata'
import { targetConstructorToSchema, validationMetadatasToSchemas } from '../src'

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

  @IsObject() object: object

  @IsNotEmptyObject()
  @IsOptional()
  nonEmptyObject: {}

  @Allow()
  any: unknown
}

// @ts-ignore: not referenced
class Post {
  static schemaName = 'ChangedPost'

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
    const emptyStorage: any = {
      constraintMetadatas: new Map(),
      validationMetadatas: new Map(),
      getTargetValidatorConstraints: () => [],
    }

    expect(
      validationMetadatasToSchemas({
        classValidatorMetadataStorage: emptyStorage,
      })
    ).toEqual({})
  })

  it('derives schema from property type when no converter is found', () => {
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
      validationTypeOptions: {},
    }

    const storage = {
      constraintMetadatas: new Map(),
      validationMetadatas: new Map([[User, [customMetadata]]]),
      getTargetValidatorConstraints: () => [],
    } as unknown as MetadataStorage

    const schemas = validationMetadatasToSchemas({
      classValidatorMetadataStorage: storage,
    })
    expect(schemas.User.properties!.id).toEqual({ type: 'string' })
  })

  it('combines converted class-validator metadata into JSON Schemas', () => {
    const schemas = validationMetadatasToSchemas()

    expect(schemas).toEqual({
      Post: {
        properties: {
          published: {
            type: 'boolean',
          },
          title: {
            maxLength: 100,
            minLength: 2,
            type: 'string',
          },
          user: {
            $ref: '#/definitions/User',
          },
        },
        type: 'object',
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
                    { type: 'object' },
                  ],
                },
                nullable: true,
              },
            ],
          },
          firstName: { minLength: 5, type: 'string' },
          id: { type: 'string' },
          object: { type: 'object' },
          nonEmptyObject: { type: 'object', minProperties: 1 },
          any: {},
          tags: {
            items: {
              maxLength: 20,
              not: {
                anyOf: [{ enum: ['admin'], type: 'string' }],
              },
              type: 'string',
            },
            maxItems: 5,
            type: 'array',
          },
        },
        required: ['id', 'firstName', 'object', 'any'],
        type: 'object',
      },
    })
  })

  it('combines converted class-validator metadata for one object into JSON Schemas', () => {
    const postSchema = targetConstructorToSchema(Post)

    expect(postSchema).toEqual({
      properties: {
        published: {
          type: 'boolean',
        },
        title: {
          maxLength: 100,
          minLength: 2,
          type: 'string',
        },
        user: {
          $ref: '#/definitions/User',
        },
      },
      type: 'object',
    })

    const userSchema = targetConstructorToSchema(User)

    expect(userSchema).toEqual({
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
                  { type: 'object' },
                ],
              },
              nullable: true,
            },
          ],
        },
        firstName: { minLength: 5, type: 'string' },
        id: { type: 'string' },
        object: { type: 'object' },
        nonEmptyObject: { type: 'object', minProperties: 1 },
        any: {},
        tags: {
          items: {
            maxLength: 20,
            not: {
              anyOf: [{ enum: ['admin'], type: 'string' }],
            },
            type: 'string',
          },
          maxItems: 5,
          type: 'array',
        },
      },
      required: ['id', 'firstName', 'object', 'any'],
      type: 'object',
    })
  })

  it('should use custom schema name field', () => {
    const schemas = validationMetadatasToSchemas({
      schemaNameField: 'schemaName',
    })

    expect(schemas).toEqual({
      ChangedPost: {
        properties: {
          published: {
            type: 'boolean',
          },
          title: {
            maxLength: 100,
            minLength: 2,
            type: 'string',
          },
          user: {
            $ref: '#/definitions/User',
          },
        },
        type: 'object',
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
                    { type: 'object' },
                  ],
                },
                nullable: true,
              },
            ],
          },
          firstName: { minLength: 5, type: 'string' },
          id: { type: 'string' },
          object: { type: 'object' },
          nonEmptyObject: { type: 'object', minProperties: 1 },
          any: {},
          tags: {
            items: {
              maxLength: 20,
              not: {
                anyOf: [{ enum: ['admin'], type: 'string' }],
              },
              type: 'string',
            },
            maxItems: 5,
            type: 'array',
          },
        },
        required: ['id', 'firstName', 'object', 'any'],
        type: 'object',
      },
    })
  })
})
