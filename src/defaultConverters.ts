// tslint:disable:no-submodule-imports
import * as cv from 'class-validator'
import type { ValidationMetadata } from 'class-validator/types/metadata/ValidationMetadata'
import type { ReferenceObject, SchemaObject } from 'openapi3-ts'
import 'reflect-metadata'

import { IOptions } from './options'

export interface ISchemaConverters {
  [validatorType: string]: SchemaConverter | SchemaObject
}

export type SchemaConverter = (
  meta: ValidationMetadata,
  options: IOptions
) => ReferenceObject | SchemaObject | void

export const defaultConverters: ISchemaConverters = {
  [cv.ValidationTypes.CUSTOM_VALIDATION]: (meta, options) => {
    if (typeof meta.target === 'function') {
      const type = getPropType(meta.target.prototype, meta.propertyName)
      return targetToSchema(type, options)
    }
  },
  [cv.ValidationTypes.NESTED_VALIDATION]: (meta, options) => {
    if (typeof meta.target === 'function') {
      const typeMeta = options.classTransformerMetadataStorage
        ? options.classTransformerMetadataStorage.findTypeMetadata(
            meta.target,
            meta.propertyName
          )
        : null
      const childType = typeMeta
        ? typeMeta.typeFunction()
        : getPropType(meta.target.prototype, meta.propertyName)
      return targetToSchema(childType, options)
    }
  },
  [cv.ValidationTypes.WHITELIST]: {},
  [cv.ValidationTypes.CONDITIONAL_VALIDATION]: {},
  [cv.ValidationTypes.IS_DEFINED]: {
    not: { type: 'null' },
  },
  [cv.EQUALS]: (meta) => {
    const schema = constraintToSchema(meta.constraints[0])
    if (schema) {
      return { ...schema, enum: [meta.constraints[0]] }
    }
  },
  [cv.NOT_EQUALS]: (meta) => {
    const schema = constraintToSchema(meta.constraints[0])
    if (schema) {
      return { not: { ...schema, enum: [meta.constraints[0]] } }
    }
  },
  [cv.IS_EMPTY]: {
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
  [cv.IS_NOT_EMPTY]: {
    minLength: 1,
    type: 'string',
  },
  [cv.IS_IN]: (meta) => {
    const [head, ...rest]: SchemaObject[] =
      meta.constraints[0].map(constraintToSchema)
    if (head && rest.every((item) => item.type === head.type)) {
      return { ...head, enum: meta.constraints[0] }
    }
  },
  [cv.IS_NOT_IN]: (meta) => {
    const [head, ...rest]: SchemaObject[] =
      meta.constraints[0].map(constraintToSchema)
    if (head && rest.every((item) => item.type === head.type)) {
      return { not: { ...head, enum: meta.constraints[0] } }
    }
  },
  [cv.IS_BOOLEAN]: {
    type: 'boolean',
  },
  [cv.IS_DATE]: {
    oneOf: [
      { format: 'date', type: 'string' },
      { format: 'date-time', type: 'string' },
    ],
  },
  [cv.IS_NUMBER]: {
    type: 'number',
  },
  [cv.IS_STRING]: {
    type: 'string',
  },
  [cv.IS_DATE_STRING]: {
    pattern: '\\d{4}-[01]\\d-[0-3]\\dT[0-2]\\d:[0-5]\\d:[0-5]\\d.\\d+Z?',
    type: 'string',
  },
  [cv.IS_ARRAY]: {
    items: {},
    type: 'array',
  },
  [cv.IS_INT]: {
    type: 'integer',
  },
  [cv.IS_ENUM]: (meta) => {
    return {
      enum: Object.values(meta.constraints[0]),
      type: 'string',
    }
  },
  [cv.IS_DIVISIBLE_BY]: (meta) => ({
    multipleOf: meta.constraints[0],
    type: 'number',
  }),
  [cv.IS_POSITIVE]: {
    exclusiveMinimum: 0,
    type: 'number',
  },
  [cv.IS_NEGATIVE]: {
    exclusiveMaximum: 0,
    type: 'number',
  },
  [cv.MIN]: (meta) => ({
    minimum: meta.constraints[0],
    type: 'number',
  }),
  [cv.MAX]: (meta) => ({
    maximum: meta.constraints[0],
    type: 'number',
  }),
  [cv.MIN_DATE]: (meta) => ({
    description: `After ${meta.constraints[0].toJSON()}`,
    oneOf: [
      { format: 'date', type: 'string' },
      { format: 'date-time', type: 'string' },
    ],
  }),
  [cv.MAX_DATE]: (meta) => ({
    description: `Before ${meta.constraints[0].toJSON()}`,
    oneOf: [
      { format: 'date', type: 'string' },
      { format: 'date-time', type: 'string' },
    ],
  }),
  [cv.IS_BOOLEAN_STRING]: {
    enum: ['true', 'false'],
    type: 'string',
  },
  [cv.IS_NUMBER_STRING]: {
    pattern: '^[-+]?[0-9]+$',
    type: 'string',
  },
  [cv.CONTAINS]: (meta) => ({
    pattern: meta.constraints[0],
    type: 'string',
  }),
  [cv.NOT_CONTAINS]: (meta) => ({
    not: { pattern: meta.constraints[0] },
    type: 'string',
  }),
  [cv.IS_ALPHA]: {
    pattern: '^[a-zA-Z]+$',
    type: 'string',
  },
  [cv.IS_ALPHANUMERIC]: {
    pattern: '^[0-9a-zA-Z]+$',
    type: 'string',
  },
  [cv.IS_ASCII]: {
    pattern: '^[\\x00-\\x7F]+$',
    type: 'string',
  },
  [cv.IS_BASE64]: {
    format: 'base64',
    type: 'string',
  },
  [cv.IS_BYTE_LENGTH]: {
    type: 'string',
  },
  [cv.IS_CREDIT_CARD]: {
    format: 'credit-card',
    type: 'string',
  },
  [cv.IS_CURRENCY]: {
    format: 'currency',
    type: 'string',
  },
  [cv.IS_EMAIL]: {
    format: 'email',
    type: 'string',
  },
  [cv.IS_FQDN]: {
    format: 'hostname',
    type: 'string',
  },
  [cv.IS_FULL_WIDTH]: {
    pattern:
      '[^\\u0020-\\u007E\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE0-9a-zA-Z]',
    type: 'string',
  },
  [cv.IS_HALF_WIDTH]: {
    pattern:
      '[\\u0020-\\u007E\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE0-9a-zA-Z]',
    type: 'string',
  },
  [cv.IS_VARIABLE_WIDTH]: {
    type: 'string',
  },
  [cv.IS_HEX_COLOR]: {
    pattern: '^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$',
    type: 'string',
  },
  [cv.IS_HEXADECIMAL]: {
    pattern: '^[0-9a-fA-F]+$',
    type: 'string',
  },
  [cv.IS_IP]: (meta) => ({
    format: 'ipv' + (meta.constraints[0] === '6' ? 6 : 4),
    type: 'string',
  }),
  [cv.IS_ISBN]: {
    format: 'isbn',
    type: 'string',
  },
  [cv.IS_ISIN]: {
    format: 'isin',
    type: 'string',
  },
  [cv.IS_ISO8601]: {
    oneOf: [
      { format: 'date', type: 'string' },
      { format: 'date-time', type: 'string' },
    ],
  },
  [cv.IS_JSON]: {
    format: 'json',
    type: 'string',
  },
  [cv.IS_LOWERCASE]: {
    type: 'string',
  },
  [cv.IS_MOBILE_PHONE]: {
    format: 'mobile-phone',
    type: 'string',
  },
  [cv.IS_MONGO_ID]: {
    pattern: '^[0-9a-fA-F]{24}$',
    type: 'string',
  },
  [cv.IS_MULTIBYTE]: {
    pattern: '[^\\x00-\\x7F]',
    type: 'string',
  },
  [cv.IS_SURROGATE_PAIR]: {
    pattern: '[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]',
    type: 'string',
  },
  [cv.IS_URL]: {
    format: 'url',
    type: 'string',
  },
  [cv.IS_UUID]: {
    format: 'uuid',
    type: 'string',
  },
  [cv.IS_LENGTH]: (meta) => {
    const [minLength, maxLength] = meta.constraints
    if (maxLength || maxLength === 0) {
      return { minLength, maxLength, type: 'string' }
    }
    return { minLength, type: 'string' }
  },
  [cv.IS_UPPERCASE]: {
    type: 'string',
  },
  [cv.IS_OBJECT]: {
    type: 'object',
  },
  [cv.IS_NOT_EMPTY_OBJECT]: {
    type: 'object',
    minProperties: 1,
  },
  [cv.MIN_LENGTH]: (meta) => ({
    minLength: meta.constraints[0],
    type: 'string',
  }),
  [cv.MAX_LENGTH]: (meta) => ({
    maxLength: meta.constraints[0],
    type: 'string',
  }),
  [cv.MATCHES]: (meta) => ({
    pattern: meta.constraints[0].source,
    type: 'string',
  }),
  [cv.IS_MILITARY_TIME]: {
    pattern: '^([01]\\d|2[0-3]):?([0-5]\\d)$',
    type: 'string',
  },
  [cv.ARRAY_CONTAINS]: (meta) => {
    const schemas: SchemaObject[] = meta.constraints[0].map(constraintToSchema)
    if (schemas.length > 0 && schemas.every((s) => s && s.type)) {
      return {
        not: {
          anyOf: schemas.map((d, i) => ({
            items: {
              not: {
                ...d,
                enum: [meta.constraints[0][i]],
              },
            },
          })),
        },
        type: 'array',
      }
    }
    return { items: {}, type: 'array' }
  },
  [cv.ARRAY_NOT_CONTAINS]: (meta) => {
    const schemas: SchemaObject[] = meta.constraints[0].map(constraintToSchema)
    if (schemas.length > 0 && schemas.every((s) => s && s.type)) {
      return {
        items: {
          not: {
            anyOf: schemas.map((d, i) => ({
              ...d,
              enum: [meta.constraints[0][i]],
            })),
          },
        },
        type: 'array',
      }
    }
    return { items: {}, type: 'array' }
  },
  [cv.ARRAY_NOT_EMPTY]: {
    items: {},
    minItems: 1,
    type: 'array',
  },
  [cv.ARRAY_MIN_SIZE]: (meta) => ({
    items: {},
    minItems: meta.constraints[0],
    type: 'array',
  }),
  [cv.ARRAY_MAX_SIZE]: (meta) => ({
    items: {},
    maxItems: meta.constraints[0],
    type: 'array',
  }),
  [cv.ARRAY_UNIQUE]: {
    items: {},
    type: 'array',
    uniqueItems: true,
  },
}

function getPropType(target: object, property: string) {
  return Reflect.getMetadata('design:type', target, property)
}

function constraintToSchema(primitive: any): SchemaObject | void {
  const primitives = ['string', 'number', 'boolean']
  const type = typeof primitive
  if (primitives.includes(type)) {
    return { type: type as 'string' | 'number' | 'boolean' }
  }
}

function targetToSchema(
  type: any,
  options: IOptions
): ReferenceObject | SchemaObject | void {
  if (typeof type === 'function') {
    if (
      type.prototype === String.prototype ||
      type.prototype === Symbol.prototype
    ) {
      return { type: 'string' }
    } else if (type.prototype === Number.prototype) {
      return { type: 'number' }
    } else if (type.prototype === Boolean.prototype) {
      return { type: 'boolean' }
    }

    return { $ref: options.refPointerPrefix + type.name }
  }
}
