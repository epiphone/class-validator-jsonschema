// tslint:disable:no-submodule-imports
import { ValidationTypes } from 'class-validator'
import { ValidationMetadata } from 'class-validator/metadata/ValidationMetadata'
import * as _ from 'lodash'
import { SchemaObject } from 'openapi3-ts'
const debug = require('debug')('routing-controllers-openapi')

import { defaultConverters } from './defaultConverters'
import { defaultOptions, IOptions } from './options'

/**
 * Convert class-validator metadata objects into OpenAPI Schema definitions.
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
    .map((schemaMetas, schemaName) => {
      const properties = _(schemaMetas)
        .groupBy('propertyName')
        .mapValues(propMetas => applySchemaConverters(propMetas, options))
        .value()

      const schema = {
        properties,
        required: getRequiredPropNames(schemaMetas),
        type: 'object'
      }

      return [schemaName, schema]
    })
    .fromPairs()
    .value()

  return schemas
}

/**
 * Convert a property's class-validator metadata into an OpenAPI Schema property.
 */
function applySchemaConverters(
  propertyMetadatas: ValidationMetadata[],
  options: IOptions
): SchemaObject {
  const converters = { ...defaultConverters, ...options.additionalConverters }
  const convert = (meta: ValidationMetadata) => {
    if (!converters[meta.type]) {
      debug('No schema converter found for validation metadata', meta)
      return {}
    }

    const items = converters[meta.type](meta, options)
    return meta.each ? { items, type: 'array' } : items
  }

  // @ts-ignore: array spread
  return _.merge(...propertyMetadatas.map(convert))
}

/**
 * Get the required property names of a validated class.
 * @param metadatas Validation metadata objects of the validated class.
 */
function getRequiredPropNames(metadatas: ValidationMetadata[]) {
  return _(metadatas)
    .groupBy('propertyName')
    .omitBy(d => _.find(d, { type: ValidationTypes.CONDITIONAL_VALIDATION }))
    .keys()
    .value()
}
