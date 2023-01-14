// tslint:disable:object-literal-sort-keys
import * as validator from 'class-validator'
import _get from 'lodash.get'

import { validationMetadatasToSchemas } from '../src'

class Post {}
class Comment {}

enum PostType {
  Public,
  Private,
}
enum Role {
  Anonymous = 'anonymous',
  User = 'user',
}

// @ts-ignore: not referenced
class User {
  // Common validation decorators:
  @validator.IsDefined() isDefined: string
  @validator.Equals('x') equalsString: string
  @validator.Equals(123.23)
  equalsNumber: number
  @validator.Equals({ someKey: 'x' })
  equalsComplex: object
  @validator.NotEquals('x') notEqualsString: string
  @validator.NotEquals(123.23)
  notEqualsNumber: number
  @validator.NotEquals({ someKey: 'x' })
  notEqualsComplex: object
  @validator.IsEmpty() isEmpty?: string
  @validator.IsNotEmpty() isNotEmpty: string
  @validator.IsIn([])
  isInEmpty: string
  @validator.IsIn(['x', 'y'])
  isInString: string
  @validator.IsIn([1, 2])
  isInNumber: number
  @validator.IsIn([Post, Comment])
  isInClass: Post | Comment
  @validator.IsNotIn(['x', 'y'])
  isNotIn: string

  // Type validation decorators:
  @validator.IsBoolean() isBoolean: boolean
  @validator.IsDate() isDate: Date
  @validator.IsString() isString: string
  @validator.IsNumber() isNumber: number
  @validator.IsInt() isInt: number
  @validator.IsArray() isArray: any[]
  @validator.IsEnum(PostType) isEnum: PostType
  @validator.IsEnum(Role) isEnumWithValue: Role

  // Number validation decorators:
  @validator.IsDivisibleBy(4)
  isDivisibleByInt: number
  @validator.IsDivisibleBy(1.1)
  isDivisibleByFloat: number
  @validator.IsPositive() isPositive: number
  @validator.IsNegative() isNegative: number
  @validator.Max(10)
  max: number
  @validator.Min(1)
  min: number

  // Date validation decorators:
  @validator.MinDate(new Date('2017'))
  minDate: Date
  @validator.MaxDate(new Date('2017'))
  maxDate: Date

  // String-type validation decorators:
  @validator.IsBooleanString() isBooleanString: string
  @validator.IsDateString() isDateString: string
  @validator.IsNumberString() isNumberString: string

  // String validation decorators:
  @validator.Contains('seed') contains: string
  @validator.NotContains('seed') notContains: string
  @validator.IsAlpha() isAlpha: string
  @validator.IsAlphanumeric() isAlphanumeric: string
  @validator.IsAscii() isAscii: string
  @validator.IsBase64() isBase64: string
  @validator.IsByteLength(1, 10)
  isByteLength: string
  @validator.IsCreditCard() isCreditCard: string
  @validator.IsCurrency() isCurrency: string
  @validator.IsEmail() isEmail: string
  @validator.IsFQDN() isFQDN: string
  @validator.IsFullWidth() isFullWidth: string
  @validator.IsHalfWidth() isHalfWidth: string
  @validator.IsVariableWidth() isVariableWidth: string
  @validator.IsHexColor() isHexColor: string
  @validator.IsHexadecimal() isHexadecimal: string
  @validator.IsIP() isIPv4: string
  @validator.IsIP('6') isIPv6: string
  @validator.IsISBN() isISBN: string
  @validator.IsISIN() isISIN: string
  @validator.IsISO8601() isISO8601: string
  @validator.IsJSON() isJSON: string
  @validator.IsLowercase() isLowerCase: string
  @validator.IsMobilePhone('en-GB') isMobilePhone: string
  @validator.IsMongoId() isMongoId: string
  @validator.IsMultibyte() isMultibyte: string
  @validator.IsSurrogatePair() isSurrogatePair: string
  @validator.IsUrl() isUrl: string
  @validator.IsUUID() isUUID: string
  @validator.IsUppercase() isUpperCase: string
  @validator.Length(1)
  length: string
  @validator.Length(1, 10)
  lengthWithMax: string
  @validator.MinLength(1)
  minLength: string
  @validator.MaxLength(10)
  maxLength: string
  @validator.Matches(/\d[a-zA-Z]+/)
  matches: string
  @validator.IsMilitaryTime() isMilitaryTime: string

  // Array validation decorators:
  @validator.ArrayContains(['x', 'y'])
  arrayContainsString: string[]
  @validator.ArrayContains([true, 1])
  arrayContainsVarious: any[]
  @validator.ArrayContains(['x', { someKey: 'y' }])
  arrayContainsComplex: any[]
  @validator.ArrayNotContains(['x', 'y'])
  arrayNotContains: string[]
  @validator.ArrayNotContains([{ someKey: 'x' }, 3])
  arrayNotContainsComplex: any[]
  @validator.ArrayNotEmpty() arrayNotEmpty: any[]
  @validator.ArrayMinSize(1)
  arrayMinSize: any[]
  @validator.ArrayMaxSize(10)
  arrayMaxSize: any[]
  @validator.ArrayUnique() arrayUnique: any[]
}

const metadata = _get(
  validator.getFromContainer(validator.MetadataStorage),
  'validationMetadatas'
)
const schemas = validationMetadatasToSchemas(metadata)

describe('defaultConverters', () => {
  it('generates OpenAPI schemas from class-validator metadata', () => {
    expect(schemas).toEqual({
      User: {
        properties: {
          isDefined: { not: { type: 'null' } },
          equalsString: { type: 'string', enum: ['x'] },
          equalsNumber: { type: 'number', enum: [123.23] },
          equalsComplex: {},
          notEqualsString: { not: { type: 'string', enum: ['x'] } },
          notEqualsNumber: { not: { type: 'number', enum: [123.23] } },
          notEqualsComplex: {},
          isEmpty: {
            anyOf: [
              { type: 'string', enum: [''] },
              {
                nullable: true,
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
              },
            ],
          },
          isNotEmpty: { minLength: 1, type: 'string' },
          isInEmpty: {},
          isInString: { enum: ['x', 'y'], type: 'string' },
          isInNumber: { enum: [1, 2], type: 'number' },
          isInClass: {},
          isNotIn: { not: { enum: ['x', 'y'], type: 'string' } },

          isBoolean: { type: 'boolean' },
          isDate: {
            oneOf: [
              { format: 'date', type: 'string' },
              { format: 'date-time', type: 'string' },
            ],
          },
          isString: { type: 'string' },
          isNumber: { type: 'number' },
          isInt: { type: 'integer' },
          isArray: { items: {}, type: 'array' },
          isEnum: { type: 'string', enum: ['Public', 'Private', 0, 1] },
          isEnumWithValue: { type: 'string', enum: ['anonymous', 'user'] },

          isDivisibleByInt: { multipleOf: 4, type: 'number' },
          isDivisibleByFloat: { multipleOf: 1.1, type: 'number' },
          isPositive: { type: 'number', exclusiveMinimum: 0 },
          isNegative: { type: 'number', exclusiveMaximum: 0 },
          max: { type: 'number', maximum: 10 },
          min: { type: 'number', minimum: 1 },

          minDate: {
            description: `After ${new Date('2017').toJSON()}`,
            oneOf: [
              { format: 'date', type: 'string' },
              { format: 'date-time', type: 'string' },
            ],
          },
          maxDate: {
            description: `Before ${new Date('2017').toJSON()}`,
            oneOf: [
              { format: 'date', type: 'string' },
              { format: 'date-time', type: 'string' },
            ],
          },

          isBooleanString: { type: 'string', enum: ['true', 'false'] },
          isDateString: {
            pattern:
              '\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d.\\d+Z?',
            type: 'string',
          },
          isNumberString: { pattern: '^[-+]?[0-9]+$', type: 'string' },

          contains: { pattern: 'seed', type: 'string' },
          notContains: { not: { pattern: 'seed' }, type: 'string' },
          isAlpha: { pattern: '^[a-zA-Z]+$', type: 'string' },
          isAlphanumeric: { pattern: '^[0-9a-zA-Z]+$', type: 'string' },
          isAscii: { pattern: '^[\\x00-\\x7F]+$', type: 'string' },
          isBase64: { format: 'base64', type: 'string' },
          isByteLength: { type: 'string' },
          isCreditCard: { format: 'credit-card', type: 'string' },
          isCurrency: { format: 'currency', type: 'string' },
          isEmail: { format: 'email', type: 'string' },
          isFQDN: { format: 'hostname', type: 'string' },
          isFullWidth: {
            pattern:
              '[^\\u0020-\\u007E\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE0-9a-zA-Z]',
            type: 'string',
          },
          isHalfWidth: {
            pattern:
              '[\\u0020-\\u007E\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE0-9a-zA-Z]',
            type: 'string',
          },
          isVariableWidth: { type: 'string' },
          isHexColor: {
            pattern: '^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$',
            type: 'string',
          },
          isHexadecimal: { pattern: '^[0-9a-fA-F]+$', type: 'string' },
          isIPv4: { format: 'ipv4', type: 'string' },
          isIPv6: { format: 'ipv6', type: 'string' },
          isISBN: { format: 'isbn', type: 'string' },
          isISIN: { format: 'isin', type: 'string' },
          isISO8601: {
            oneOf: [
              { format: 'date', type: 'string' },
              { format: 'date-time', type: 'string' },
            ],
          },
          isJSON: { format: 'json', type: 'string' },
          isLowerCase: { type: 'string' },
          isMobilePhone: { format: 'mobile-phone', type: 'string' },
          isMongoId: {
            pattern: '^[0-9a-fA-F]{24}$',
            type: 'string',
          },
          isMultibyte: {
            pattern: '[^\\x00-\\x7F]',
            type: 'string',
          },
          isSurrogatePair: {
            pattern: '[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]',
            type: 'string',
          },
          isUrl: { format: 'url', type: 'string' },
          isUUID: { format: 'uuid', type: 'string' },
          length: { minLength: 1, type: 'string' },
          lengthWithMax: { minLength: 1, maxLength: 10, type: 'string' },
          isUpperCase: { type: 'string' },
          minLength: { minLength: 1, type: 'string' },
          maxLength: { maxLength: 10, type: 'string' },
          matches: { pattern: '\\d[a-zA-Z]+', type: 'string' },
          isMilitaryTime: {
            pattern: '^([01]\\d|2[0-3]):?([0-5]\\d)$',
            type: 'string',
          },

          arrayContainsString: {
            type: 'array',
            not: {
              anyOf: [
                { items: { not: { type: 'string', enum: ['x'] } } },
                { items: { not: { type: 'string', enum: ['y'] } } },
              ],
            },
          },
          arrayContainsVarious: {
            type: 'array',
            not: {
              anyOf: [
                { items: { not: { type: 'boolean', enum: [true] } } },
                { items: { not: { type: 'number', enum: [1] } } },
              ],
            },
          },
          arrayContainsComplex: { type: 'array', items: {} },
          arrayNotContains: {
            type: 'array',
            items: {
              not: {
                anyOf: [
                  { enum: ['x'], type: 'string' },
                  { enum: ['y'], type: 'string' },
                ],
              },
            },
          },
          arrayNotContainsComplex: { type: 'array', items: {} },
          arrayNotEmpty: { type: 'array', items: {}, minItems: 1 },
          arrayMinSize: { type: 'array', items: {}, minItems: 1 },
          arrayMaxSize: { type: 'array', items: {}, maxItems: 10 },
          arrayUnique: { type: 'array', items: {}, uniqueItems: true },
        },
        required: expect.any(Array),
        type: 'object',
      },
    })
  })
})
