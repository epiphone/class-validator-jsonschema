// tslint:disable:no-submodule-imports
import { ValidationTypes } from 'class-validator'
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata'
import * as _ from 'lodash'
import { SchemaObject } from 'openapi3-ts'
import 'reflect-metadata'

export interface ISchemaConverters {
  [validatorType: string]: SchemaConverter
}

export type SchemaConverter = (meta: ValidationMetadata) => SchemaObject

export const defaultConverters: ISchemaConverters = {
  [ValidationTypes.CUSTOM_VALIDATION]: meta => {
    if (_.isFunction(meta.target)) {
      const type = getPropType(meta.target.prototype, meta.propertyName)
      if (_.isString(type.prototype)) {
        return { type: 'string' }
      } else if (_.isNumber(type.prototype)) {
        return { type: 'number' }
      } else if (_.isBoolean(type.prototype)) {
        return { type: 'boolean' }
      }

      return { $ref: '#/components/schemas/' + type.name }
    }
    return {}
  },
  [ValidationTypes.NESTED_VALIDATION]: meta => {
    if (_.isFunction(meta.target)) {
      const childType = getPropType(meta.target.prototype, meta.propertyName)
      const schema = _.isFunction(childType) ? childType.name : childType
      return { $ref: '#/components/schemas/' + schema }
    }
    return {}
  },
  [ValidationTypes.CONDITIONAL_VALIDATION]: () => ({}),
  [ValidationTypes.IS_DEFINED]: _meta => ({}),
  [ValidationTypes.EQUALS]: _meta => ({}),
  [ValidationTypes.NOT_EQUALS]: _meta => ({}),
  [ValidationTypes.IS_EMPTY]: _meta => ({}),
  [ValidationTypes.IS_NOT_EMPTY]: () => ({
    minLength: 1,
    type: 'string'
  }),
  [ValidationTypes.IS_IN]: meta => ({
    enum: meta.constraints[0],
    type: 'string'
  }),
  [ValidationTypes.IS_NOT_IN]: _meta => ({}),
  [ValidationTypes.IS_BOOLEAN]: () => ({
    type: 'boolean'
  }),
  [ValidationTypes.IS_BOOLEAN]: _meta => ({}),
  [ValidationTypes.IS_DATE]: _meta => ({}),
  [ValidationTypes.IS_NUMBER]: _meta => ({}),
  [ValidationTypes.IS_STRING]: () => ({
    type: 'string'
  }),
  [ValidationTypes.IS_DATE_STRING]: _meta => ({}),
  [ValidationTypes.IS_ARRAY]: _meta => ({}),
  [ValidationTypes.IS_INT]: _meta => ({}),
  [ValidationTypes.IS_ENUM]: _meta => ({}),
  [ValidationTypes.IS_DIVISIBLE_BY]: _meta => ({}),
  [ValidationTypes.IS_POSITIVE]: _meta => ({}),
  [ValidationTypes.IS_NEGATIVE]: _meta => ({}),
  [ValidationTypes.MIN]: _meta => ({}),
  [ValidationTypes.MAX]: _meta => ({}),
  [ValidationTypes.MIN_DATE]: _meta => ({}),
  [ValidationTypes.MAX_DATE]: _meta => ({}),
  [ValidationTypes.IS_BOOLEAN_STRING]: _meta => ({}),
  [ValidationTypes.IS_NUMBER_STRING]: _meta => ({}),
  [ValidationTypes.CONTAINS]: _meta => ({}),
  [ValidationTypes.NOT_CONTAINS]: _meta => ({}),
  [ValidationTypes.IS_ALPHA]: _meta => ({}),
  [ValidationTypes.IS_ALPHANUMERIC]: _meta => ({}),
  [ValidationTypes.IS_ASCII]: _meta => ({}),
  [ValidationTypes.IS_BASE64]: _meta => ({}),
  [ValidationTypes.IS_BYTE_LENGTH]: _meta => ({}),
  [ValidationTypes.IS_CREDIT_CARD]: _meta => ({}),
  [ValidationTypes.IS_CURRENCY]: _meta => ({}),
  [ValidationTypes.IS_EMAIL]: () => ({
    format: 'email',
    type: 'string'
  }),
  [ValidationTypes.IS_FQDN]: _meta => ({}),
  [ValidationTypes.IS_FULL_WIDTH]: _meta => ({}),
  [ValidationTypes.IS_HALF_WIDTH]: _meta => ({}),
  [ValidationTypes.IS_VARIABLE_WIDTH]: _meta => ({}),
  [ValidationTypes.IS_HEX_COLOR]: _meta => ({}),
  [ValidationTypes.IS_HEXADECIMAL]: _meta => ({}),
  [ValidationTypes.IS_IP]: _meta => ({}),
  [ValidationTypes.IS_ISBN]: _meta => ({}),
  [ValidationTypes.IS_ISIN]: _meta => ({}),
  [ValidationTypes.IS_ISO8601]: _meta => ({}),
  [ValidationTypes.IS_JSON]: _meta => ({}),
  [ValidationTypes.IS_LOWERCASE]: _meta => ({}),
  [ValidationTypes.IS_MOBILE_PHONE]: _meta => ({}),
  [ValidationTypes.IS_MONGO_ID]: _meta => ({}),
  [ValidationTypes.IS_MULTIBYTE]: _meta => ({}),
  [ValidationTypes.IS_SURROGATE_PAIR]: _meta => ({}),
  [ValidationTypes.IS_URL]: _meta => ({}),
  [ValidationTypes.IS_UUID]: _meta => ({}),
  [ValidationTypes.LENGTH]: _meta => ({}),
  [ValidationTypes.IS_UPPERCASE]: _meta => ({}),
  [ValidationTypes.MIN_LENGTH]: meta => ({
    minLength: meta.constraints[0],
    type: 'string'
  }),
  [ValidationTypes.MAX_LENGTH]: meta => ({
    maxLength: meta.constraints[0],
    type: 'string'
  }),
  [ValidationTypes.MATCHES]: _meta => ({}),
  [ValidationTypes.IS_MILITARY_TIME]: _meta => ({}),
  [ValidationTypes.ARRAY_CONTAINS]: _meta => ({}),
  [ValidationTypes.ARRAY_NOT_CONTAINS]: _meta => ({}),
  [ValidationTypes.ARRAY_NOT_EMPTY]: () => ({
    minItems: 1
  }),
  [ValidationTypes.ARRAY_MIN_SIZE]: _meta => ({}),
  [ValidationTypes.ARRAY_MAX_SIZE]: _meta => ({}),
  [ValidationTypes.ARRAY_UNIQUE]: () => ({
    uniqueItems: true
  })
}

function getPropType(target: object, property: string) {
  return Reflect.getMetadata('design:type', target, property)
}
