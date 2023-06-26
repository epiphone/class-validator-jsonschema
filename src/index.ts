// tslint:disable:no-submodule-imports ban-types
import * as cv from 'class-validator'
import { ValidationMetadata } from 'class-validator/types/metadata/ValidationMetadata'
import _groupBy from 'lodash.groupby'
import _merge from 'lodash.merge'
import type { ReferenceObject, SchemaObject } from 'openapi3-ts'

import { getMetadataSchema } from './decorators'
import { defaultConverters } from './defaultConverters'
import { defaultOptions, IOptions } from './options'

export { JSONSchema } from './decorators'

type IStorage = {
  validationMetadatas: Map<Function | string, ValidationMetadata[]>
} & Omit<cv.MetadataStorage, 'validationMetadatas'>

/**
 * Convert class-validator metadata into JSON Schema definitions.
 */
export function validationMetadatasToSchemas(
  userOptions?: Partial<IOptions>
): Record<string, SchemaObject> {
  const options: IOptions = {
    ...defaultOptions,
    ...userOptions,
  }

  const metadatas = getMetadatasFromStorage(
    options.classValidatorMetadataStorage
  )

  return validationMetadataArrayToSchemas(metadatas, userOptions)
}

/**
 * Convert an array of class-validator metadata into JSON Schema definitions.
 */
export function validationMetadataArrayToSchemas(
  metadatas: ValidationMetadata[],
  userOptions?: Partial<IOptions>
): Record<string, SchemaObject> {
  const options: IOptions = {
    ...defaultOptions,
    ...userOptions,
  }

  const schemas: { [key: string]: SchemaObject } = {}
  Object.entries(
    _groupBy(
      metadatas,
      ({ target }) =>
        target[options.schemaNameField as keyof typeof target] ??
        (target as Function).name
    )
  ).forEach(([key, ownMetas]) => {
    const target = ownMetas[0].target as Function
    const metas = ownMetas
      .concat(getInheritedMetadatas(target, metadatas))
      .filter(
        (propMeta) =>
          !(
            isExcluded(propMeta, options) ||
            isExcluded({ ...propMeta, target }, options)
          )
      )

    const properties: { [name: string]: ReferenceObject | SchemaObject } = {}

    Object.entries(_groupBy(metas, 'propertyName')).forEach(
      ([propName, propMetas]) => {
        const schema = applyConverters(propMetas, options)
        properties[propName] = applyDecorators(
          schema,
          target,
          options,
          propName
        )
      }
    )

    const definitionSchema: SchemaObject = {
      properties,
      type: 'object',
    }

    const required = getRequiredPropNames(target, metas, options)
    if (required.length > 0) {
      definitionSchema.required = required
    }

    schemas[key] = applyDecorators(
      definitionSchema,
      target,
      options,
      target.name
    ) as SchemaObject
  })

  return schemas
}

/**
 * Search for the JSON Schema definition from child class up to the
 * top parent class until empty function name is found.
 */
function getTargetConstructorSchema(
  schemas: Record<string, SchemaObject>,
  targetConstructor: Function
): SchemaObject {
  if (!targetConstructor.name) {
    return {}
  } else if (schemas[targetConstructor.name]) {
    return schemas[targetConstructor.name]
  } else {
    return getTargetConstructorSchema(
      schemas,
      Object.getPrototypeOf(targetConstructor)
    )
  }
}

/**
 * Generate JSON Schema definitions from the target object constructor.
 */
export function targetConstructorToSchema(
  targetConstructor: Function,
  userOptions?: Partial<IOptions>
): SchemaObject {
  const options: IOptions = {
    ...defaultOptions,
    ...userOptions,
  }

  const storage = options.classValidatorMetadataStorage
  let metadatas = storage.getTargetValidationMetadatas(
    targetConstructor,
    '',
    true,
    false
  )
  metadatas = populateMetadatasWithConstraints(storage, metadatas)

  const schemas = validationMetadataArrayToSchemas(metadatas, userOptions)
  return getTargetConstructorSchema(schemas, targetConstructor)
}

/**
 * Return `storage.validationMetadatas` populated with `constraintMetadatas`.
 */
function getMetadatasFromStorage(
  storage: cv.MetadataStorage
): ValidationMetadata[] {
  const metadatas: ValidationMetadata[] = []

  for (const value of (storage as unknown as IStorage).validationMetadatas) {
    metadatas.push(...populateMetadatasWithConstraints(storage, value[1]))
  }
  return metadatas
}

function populateMetadatasWithConstraints(
  storage: cv.MetadataStorage,
  metadatas: ValidationMetadata[]
): ValidationMetadata[] {
  return metadatas.map((meta) => {
    if (meta.constraintCls) {
      const constraint = storage.getTargetValidatorConstraints(
        meta.constraintCls
      )
      if (constraint.length > 0) {
        return { ...meta, type: constraint[0].name }
      }
    }
    return { ...meta }
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
      !metadatas.find(
        (m) =>
          m.propertyName === d.propertyName &&
          m.target === target &&
          m.type === d.type
      )
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

    const items =
      typeof converter === 'function' ? converter(meta, options) : converter

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

  return _merge({}, ...propertyMetadatas.map(convert))
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
): ReferenceObject | SchemaObject {
  const additionalSchema = getMetadataSchema(target.prototype, propertyName)
  return typeof additionalSchema === 'function'
    ? additionalSchema(schema, options)
    : _merge({}, schema, additionalSchema)
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
    return (
      metas && metas.some(({ type }) => type === cv.ValidationTypes.IS_DEFINED)
    )
  }
  function isOptional(metas: ValidationMetadata[]) {
    return (
      metas &&
      metas.some(({ type }) =>
        [cv.ValidationTypes.CONDITIONAL_VALIDATION, cv.IS_EMPTY].includes(type)
      )
    )
  }

  return Object.entries(_groupBy(metadatas, (m) => m.propertyName))
    .filter(([_, metas]) => {
      const own = metas.filter((m) => m.target === target)
      const inherited = metas.filter((m) => m.target !== target)
      return options.skipMissingProperties
        ? isDefined(own) || (!isOptional(own) && isDefined(inherited))
        : !(isOptional(own) || isOptional(inherited))
    })
    .map(([name]) => name)
}
