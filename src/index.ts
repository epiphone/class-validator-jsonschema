// tslint:disable:no-submodule-imports ban-types
import { ValidationTypes } from 'class-validator'
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata'
import * as _ from 'lodash'
import { SchemaObject } from 'openapi3-ts'
const debug = require('debug')('routing-controllers-openapi')

import { getMetadataSchema } from './decorators'
import { defaultConverters } from './defaultConverters'
import { defaultOptions, IOptions } from './options'

export { JSONSchema } from './decorators'

/**
 * Convert class-validator metadata objects into JSON Schema definitions.
 * @param metadatas All class-validator metadata objects.
 */
export function validationMetadatasToSchemas(
  metadatas: ValidationMetadata[],
  userOptions?: Partial<IOptions>
) {
  const options: IOptions = {
    ...defaultOptions,
    ...userOptions
  }

  const schemas: { [key: string]: SchemaObject } = _(metadatas)
    .groupBy('target.name')
    .mapValues(schemaMetas => {
      const target = schemaMetas[0].target as Function
      const properties = _(schemaMetas)
        .groupBy('propertyName')
        .mapValues((propMetas, propKey) => {
          const schema = applyConverters(propMetas, options)
          return applyDecorators(schema, target, options, propKey)
        })
        .value()

      const definitionSchema = {
        properties,
        required: getRequiredPropNames(schemaMetas, options),
        type: 'object'
      }

      return applyDecorators(definitionSchema, target.constructor, options)
    })
    .value()

  return schemas
}

/**
 * Convert a property's class-validator metadata into a JSON Schema property.
 */
function applyConverters(
  propertyMetadatas: ValidationMetadata[],
  options: IOptions
): SchemaObject {
  const converters = { ...defaultConverters, ...options.additionalConverters }
  const convert = (meta: ValidationMetadata) => {
    const converter = converters[meta.type]
    if (!converter) {
      debug('No schema converter found for validation metadata', meta)
      return {}
    }

    const items = _.isFunction(converter) ? converter(meta, options) : converter
    return meta.each ? { items, type: 'array' } : items
  }

  // @ts-ignore: array spread
  return _.merge({}, ...propertyMetadatas.map(convert))
}

/**
 * Given a JSON Schema object, supplement it with additional schema properties
 * defined by target object's @JSONSchema decorator.
 */
function applyDecorators(
  schema: SchemaObject,
  target: Function,
  options: IOptions,
  propertyName?: string
): SchemaObject {
  const additionalSchema = getMetadataSchema(target.prototype, propertyName)
  return _.isFunction(additionalSchema)
    ? additionalSchema(schema, options)
    : _.merge({}, schema, additionalSchema)
}

/**
 * Get the required property names of a validated class.
 * @param metadatas Validation metadata objects of the validated class.
 */
function getRequiredPropNames(
  metadatas: ValidationMetadata[],
  options: IOptions
) {
  const optionalValidators = [
    ValidationTypes.CONDITIONAL_VALIDATION,
    ValidationTypes.IS_EMPTY
  ]
  return _(metadatas)
    .groupBy('propertyName')
    .pickBy(d => {
      return options.skipMissingProperties
        ? _.some(d, { type: ValidationTypes.IS_DEFINED })
        : !_.some(d, ({ type }) => _.includes(optionalValidators, type))
    })
    .keys()
    .value()
}
