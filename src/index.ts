// tslint:disable:no-submodule-imports ban-types
import * as cv from 'class-validator'
import { ConstraintMetadata } from 'class-validator/types/metadata/ConstraintMetadata'
import { ValidationMetadata } from 'class-validator/types/metadata/ValidationMetadata'
import * as _ from 'lodash'
import { SchemaObject } from 'openapi3-ts'

import { getMetadataSchema } from './decorators'
import { defaultConverters } from './defaultConverters'
import { defaultOptions, IOptions } from './options'

export { JSONSchema } from './decorators'

/**
 * Convert class-validator metadata into JSON Schema definitions.
 */
export function validationMetadatasToSchemas(userOptions?: Partial<IOptions>) {
  const options: IOptions = {
    ...defaultOptions,
    ...userOptions,
  }

  const metadatas = getMetadatasFromStorage(
    options.classValidatorMetadataStorage
  )

  const schemas: { [key: string]: SchemaObject } = _(metadatas)
    .groupBy((value) =>
      _.get(
        value,
        `target.${options.schemaNameField}`,
        _.get(value, 'target.name')
      )
    )
    .mapValues((ownMetas) => {
      const target = ownMetas[0].target as Function
      const metas = ownMetas
        .concat(getInheritedMetadatas(target, metadatas))
        .filter((propMeta) => !isExcluded(propMeta, options))

      return buildJsonSchemaForSpecificTarget(metadatas, target, metas, options)
    })
    .value()

  return schemas
}

/**
 * Convert class-validator class into JSON Schema definition.
 */
export type ClassType<T> = new (...args: any[]) => T;

function buildJsonSchemaForSpecificTarget<T>( metadatas: ValidationMetadata[], target: ClassType<T> | Function, targetMetadatas: ValidationMetadata[], options: IOptions) {
  const metas = targetMetadatas.concat(getInheritedMetadatas(target, metadatas))

  const properties = _(metas)
    .groupBy('propertyName')
    .mapValues((propMetas, propKey) => {
      const schema = applyConverters(propMetas, options)
      return applyDecorators(schema, target, options, propKey)
    })
    .value()

  const definitionSchema: SchemaObject = {
    properties,
    type: 'object'
  }

  const required = getRequiredPropNames(target, metas, options)
  if (required.length > 0) {
    definitionSchema.required = required
  }

  return applyDecorators(definitionSchema, target, options, target.name)
}

export function classValidatorToJsonSchema<T extends object>( target: ClassType<T>, userOptions?: Partial<IOptions>) {
  const options: IOptions = {
    ...defaultOptions,
    ...userOptions,
  }

  const metadatas = getMetadatasFromStorage(
    options.classValidatorMetadataStorage
  )

  const targetMetadatas = _(metadatas)
    .filter(metadata => {
      return metadata.target === target
    }).value();

  return buildJsonSchemaForSpecificTarget(metadatas, target, targetMetadatas, options)
}

/**
 * Return `storage.validationMetadatas` populated with `constraintMetadatas`.
 */
function getMetadatasFromStorage(
  storage: cv.MetadataStorage
): ValidationMetadata[] {
  const metadatas: ValidationMetadata[] = _.get(storage, 'validationMetadatas')
  const constraints: ConstraintMetadata[] = _.get(
    storage,
    'constraintMetadatas'
  )

  return metadatas.map((meta) => {
    if (meta.constraintCls) {
      const constraint = constraints.find(
        (c) => c.target === meta.constraintCls
      )
      if (constraint) {
        return { ...meta, type: constraint.name }
      }
    }

    return meta
  })
}

/**
 * Return target class' inherited validation metadatas, with original metadatas
 * given precedence over inherited ones in case of duplicates.
 *
 * Adapted from `class-validator` source.
 *
 * @param target Target child class.
 * @param metadatas All class-validator metadata objects.
 */
function getInheritedMetadatas(
  target: Function,
  metadatas: ValidationMetadata[]
) {
  return metadatas.filter(
    (d) =>
      d.target instanceof Function &&
      target.prototype instanceof d.target &&
      !_.find(metadatas, {
        propertyName: d.propertyName,
        target,
        type: d.type,
      })
  )
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
    const typeMeta = options.classTransformerMetadataStorage?.findTypeMetadata(
      meta.target as Function,
      meta.propertyName
    )
    const isMap =
      typeMeta &&
      typeMeta.reflectedType &&
      new typeMeta.reflectedType() instanceof Map

    const converter =
      converters[meta.type] || converters[cv.ValidationTypes.CUSTOM_VALIDATION]

    const items = _.isFunction(converter) ? converter(meta, options) : converter

    if (meta.each && isMap) {
      return {
        additionalProperties: {
          ...items,
        },
        type: 'object',
      }
    }
    return meta.each ? { items, type: 'array' } : items
  }

  return _.merge({}, ...propertyMetadatas.map(convert))
}

/** Check whether property is excluded with class-transformer `@Exclude` decorator. */
function isExcluded(
  propertyMetadata: ValidationMetadata,
  options: IOptions
): boolean {
  return !!options.classTransformerMetadataStorage?.findExcludeMetadata(
    propertyMetadata.target as Function,
    propertyMetadata.propertyName
  )
}

/**
 * Given a JSON Schema object, supplement it with additional schema properties
 * defined by target object's @JSONSchema decorator.
 */
function applyDecorators(
  schema: SchemaObject,
  target: Function,
  options: IOptions,
  propertyName: string
): SchemaObject {
  const additionalSchema = getMetadataSchema(target.prototype, propertyName)
  return _.isFunction(additionalSchema)
    ? additionalSchema(schema, options)
    : _.merge({}, schema, additionalSchema)
}

/**
 * Get the required property names of a validated class.
 * @param target Validation target class.
 * @param metadatas Validation metadata objects of the validated class.
 * @param options Global class-validator options.
 */
function getRequiredPropNames(
  target: Function,
  metadatas: ValidationMetadata[],
  options: IOptions
) {
  function isDefined(metas: ValidationMetadata[]) {
    return _.some(metas, { type: cv.ValidationTypes.IS_DEFINED })
  }
  function isOptional(metas: ValidationMetadata[]) {
    return _.some(metas, ({ type }) =>
      _.includes([cv.ValidationTypes.CONDITIONAL_VALIDATION, cv.IS_EMPTY], type)
    )
  }

  return _(metadatas)
    .groupBy('propertyName')
    .pickBy((metas) => {
      const [own, inherited] = _.partition(metas, (d) => d.target === target)
      return options.skipMissingProperties
        ? isDefined(own) || (!isOptional(own) && isDefined(inherited))
        : !(isOptional(own) || isOptional(inherited))
    })
    .keys()
    .value()
}
