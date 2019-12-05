// tslint:disable:no-submodule-imports
import { ValidationTypes } from 'class-validator'
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata'
import * as _ from 'lodash'
import { SchemaObject } from 'openapi3-ts'
import 'reflect-metadata'

import { IOptions } from './options'

export interface ISchemaConverters {
  [validatorType: string]: SchemaConverter | SchemaObject
}

export type SchemaConverter = (
  meta: ValidationMetadata,
  options: IOptions
) => SchemaObject | void

export const defaultConverters: ISchemaConverters = {
  [ValidationTypes.CUSTOM_VALIDATION]: (meta, options) => {
    if (_.isFunction(meta.target)) {
      const type = getPropType(meta.target.prototype, meta.propertyName)
      return targetToSchema(type, options)
    }
  },
  [ValidationTypes.NESTED_VALIDATION]: (meta, options) => {
    if (_.isFunction(meta.target)) {
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
  [ValidationTypes.CONDITIONAL_VALIDATION]: {},
  [ValidationTypes.IS_DEFINED]: {},
  [ValidationTypes.EQUALS]: meta => {
    const schema = constraintToSchema(meta.constraints[0])
    if (schema) {
      return { ...schema, enum: [meta.constraints[0]] }
    }
  },
  [ValidationTypes.NOT_EQUALS]: meta => {
    const schema = constraintToSchema(meta.constraints[0])
    if (schema) {
      return { not: { ...schema, enum: [meta.constraints[0]] } }
    }
  },
  [ValidationTypes.IS_EMPTY]: {
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
            { type: 'object' }
          ]
        },
        nullable: true
      }
    ]
  },
  [ValidationTypes.IS_NOT_EMPTY]: {
    minLength: 1,
    type: 'string'
  },
  [ValidationTypes.IS_IN]: meta => {
    const [head, ...rest] = meta.constraints[0].map(constraintToSchema)
    if (head && _.every(rest, { type: head.type })) {
      return { ...head, enum: meta.constraints[0] }
    }
  },
  [ValidationTypes.IS_NOT_IN]: meta => {
    const [head, ...rest] = meta.constraints[0].map(constraintToSchema)
    if (head && _.every(rest, { type: head.type })) {
      return { not: { ...head, enum: meta.constraints[0] } }
    }
  },
  [ValidationTypes.IS_BOOLEAN]: {
    type: 'boolean'
  },
  [ValidationTypes.IS_DATE]: {
    oneOf: [
      { format: 'date', type: 'string' },
      { format: 'date-time', type: 'string' }
    ]
  },
  [ValidationTypes.IS_NUMBER]: {
    type: 'number'
  },
  [ValidationTypes.IS_STRING]: {
    type: 'string'
  },
  [ValidationTypes.IS_DATE_STRING]: {
    pattern: 'd{4}-[01]d-[0-3]dT[0-2]d:[0-5]d:[0-5]d.d+Z?',
    type: 'string'
  },
  [ValidationTypes.IS_ARRAY]: {
    items: {},
    type: 'array'
  },
  [ValidationTypes.IS_INT]: {
    type: 'integer'
  },
  [ValidationTypes.IS_ENUM]: meta => {
    return {
      enum: Object.values(meta.constraints[0]),
      type: 'string'
    }
  },
  [ValidationTypes.IS_DIVISIBLE_BY]: meta => ({
    multipleOf: meta.constraints[0],
    type: 'number'
  }),
  [ValidationTypes.IS_POSITIVE]: {
    exclusiveMinimum: true,
    minimum: 0,
    type: 'number'
  },
  [ValidationTypes.IS_NEGATIVE]: {
    exclusiveMaximum: true,
    maximum: 0,
    type: 'number'
  },
  [ValidationTypes.MIN]: meta => ({
    minimum: meta.constraints[0],
    type: 'number'
  }),
  [ValidationTypes.MAX]: meta => ({
    maximum: meta.constraints[0],
    type: 'number'
  }),
  [ValidationTypes.MIN_DATE]: meta => ({
    description: `After ${meta.constraints[0].toJSON()}`,
    oneOf: [
      { format: 'date', type: 'string' },
      { format: 'date-time', type: 'string' }
    ]
  }),
  [ValidationTypes.MAX_DATE]: meta => ({
    description: `Before ${meta.constraints[0].toJSON()}`,
    oneOf: [
      { format: 'date', type: 'string' },
      { format: 'date-time', type: 'string' }
    ]
  }),
  [ValidationTypes.IS_BOOLEAN_STRING]: {
    enum: ['true', 'false'],
    type: 'string'
  },
  [ValidationTypes.IS_NUMBER_STRING]: {
    pattern: '^[-+]?[0-9]+$',
    type: 'string'
  },
  [ValidationTypes.CONTAINS]: meta => ({
    pattern: meta.constraints[0],
    type: 'string'
  }),
  [ValidationTypes.NOT_CONTAINS]: meta => ({
    not: { pattern: meta.constraints[0] },
    type: 'string'
  }),
  [ValidationTypes.IS_ALPHA]: {
    pattern: '^[a-zA-Z]+$',
    type: 'string'
  },
  [ValidationTypes.IS_ALPHANUMERIC]: {
    pattern: '^[0-9a-zA-Z]+$',
    type: 'string'
  },
  [ValidationTypes.IS_ASCII]: {
    pattern: '^[\\x00-\\x7F]+$',
    type: 'string'
  },
  [ValidationTypes.IS_BASE64]: {
    format: 'base64',
    type: 'string'
  },
  [ValidationTypes.IS_BYTE_LENGTH]: {
    type: 'string'
  },
  [ValidationTypes.IS_CREDIT_CARD]: {
    format: 'credit-card',
    type: 'string'
  },
  [ValidationTypes.IS_CURRENCY]: {
    format: 'currency',
    type: 'string'
  },
  [ValidationTypes.IS_EMAIL]: {
    format: 'email',
    type: 'string'
  },
  [ValidationTypes.IS_FQDN]: {
    format: 'hostname',
    type: 'string'
  },
  [ValidationTypes.IS_FULL_WIDTH]: {
    pattern:
      '[^\\u0020-\\u007E\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE0-9a-zA-Z]',
    type: 'string'
  },
  [ValidationTypes.IS_HALF_WIDTH]: {
    pattern:
      '[\\u0020-\\u007E\\uFF61-\\uFF9F\\uFFA0-\\uFFDC\\uFFE8-\\uFFEE0-9a-zA-Z]',
    type: 'string'
  },
  [ValidationTypes.IS_VARIABLE_WIDTH]: {
    type: 'string'
  },
  [ValidationTypes.IS_HEX_COLOR]: {
    pattern: '^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$',
    type: 'string'
  },
  [ValidationTypes.IS_HEXADECIMAL]: {
    pattern: '^[0-9a-fA-F]+$',
    type: 'string'
  },
  [ValidationTypes.IS_IP]: meta => ({
    format: 'ipv' + (meta.constraints[0] === '6' ? 6 : 4),
    type: 'string'
  }),
  [ValidationTypes.IS_ISBN]: {
    format: 'isbn',
    type: 'string'
  },
  [ValidationTypes.IS_ISIN]: {
    format: 'isin',
    type: 'string'
  },
  [ValidationTypes.IS_ISO8601]: {
    oneOf: [
      { format: 'date', type: 'string' },
      { format: 'date-time', type: 'string' }
    ]
  },
  [ValidationTypes.IS_JSON]: {
    format: 'json',
    type: 'string'
  },
  [ValidationTypes.IS_LOWERCASE]: {
    type: 'string'
  },
  [ValidationTypes.IS_MOBILE_PHONE]: {
    format: 'mobile-phone',
    type: 'string'
  },
  [ValidationTypes.IS_MONGO_ID]: {
    pattern: '^[0-9a-fA-F]{24}$',
    type: 'string'
  },
  [ValidationTypes.IS_MULTIBYTE]: {
    pattern: '[^\\x00-\\x7F]',
    type: 'string'
  },
  [ValidationTypes.IS_SURROGATE_PAIR]: {
    pattern: '[\\uD800-\\uDBFF][\\uDC00-\\uDFFF]',
    type: 'string'
  },
  [ValidationTypes.IS_URL]: {
    format: 'url',
    type: 'string'
  },
  [ValidationTypes.IS_UUID]: {
    format: 'uuid',
    type: 'string'
  },
  [ValidationTypes.LENGTH]: meta => {
    const [minLength, maxLength] = meta.constraints
    if (maxLength || maxLength === 0) {
      return { minLength, maxLength, type: 'string' }
    }
    return { minLength, type: 'string' }
  },
  [ValidationTypes.IS_UPPERCASE]: {
    type: 'string'
  },
  [ValidationTypes.MIN_LENGTH]: meta => ({
    minLength: meta.constraints[0],
    type: 'string'
  }),
  [ValidationTypes.MAX_LENGTH]: meta => ({
    maxLength: meta.constraints[0],
    type: 'string'
  }),
  [ValidationTypes.MATCHES]: meta => ({
    pattern: meta.constraints[0].source,
    type: 'string'
  }),
  [ValidationTypes.IS_MILITARY_TIME]: {
    pattern: '^([01]\\d|2[0-3]):?([0-5]\\d)$',
    type: 'string'
  },
  [ValidationTypes.ARRAY_CONTAINS]: meta => {
    const schemas = meta.constraints[0].map(constraintToSchema)
    if (schemas.length > 0 && _.every(schemas, 'type')) {
      return {
        not: {
          anyOf: _.map(schemas, (d, i) => ({
            items: {
              not: {
                ...d,
                enum: [meta.constraints[0][i]]
              }
            }
          }))
        },
        type: 'array'
      }
    }
    return { items: {}, type: 'array' }
  },
  [ValidationTypes.ARRAY_NOT_CONTAINS]: meta => {
    const schemas = meta.constraints[0].map(constraintToSchema)
    if (schemas.length > 0 && _.every(schemas, 'type')) {
      return {
        items: {
          not: {
            anyOf: _.map(schemas, (d, i) => ({
              ...d,
              enum: [meta.constraints[0][i]]
            }))
          }
        },
        type: 'array'
      }
    }
    return { items: {}, type: 'array' }
  },
  [ValidationTypes.ARRAY_NOT_EMPTY]: {
    items: {},
    minItems: 1,
    type: 'array'
  },
  [ValidationTypes.ARRAY_MIN_SIZE]: meta => ({
    items: {},
    minItems: meta.constraints[0],
    type: 'array'
  }),
  [ValidationTypes.ARRAY_MAX_SIZE]: meta => ({
    items: {},
    maxItems: meta.constraints[0],
    type: 'array'
  }),
  [ValidationTypes.ARRAY_UNIQUE]: {
    items: {},
    type: 'array',
    uniqueItems: true
  }
}

function getPropType(target: object, property: string) {
  return Reflect.getMetadata('design:type', target, property)
}

function constraintToSchema(primitive: any): SchemaObject | void {
  const primitives = ['string', 'number', 'boolean']
  const type = typeof primitive
  if (_.includes(primitives, type)) {
    return { type }
  }
}

function targetToSchema(type: any, options: IOptions): SchemaObject | void {
  if (_.isFunction(type)) {
    if (_.isString(type.prototype) || _.isSymbol(type.prototype)) {
      return { type: 'string' }
    } else if (_.isNumber(type.prototype)) {
      return { type: 'number' }
    } else if (_.isBoolean(type.prototype)) {
      return { type: 'boolean' }
    }

    return { $ref: options.refPointerPrefix + type.name }
  }
}
