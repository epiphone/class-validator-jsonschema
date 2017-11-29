import { SchemaObject } from 'openapi3-ts'
import 'reflect-metadata'

import { IOptions } from './options'

const SCHEMA_KEY = Symbol('class-validator-jsonschema:JSONSchema')

export type DecoratorSchema =
  | SchemaObject
  | ((src: SchemaObject, options: IOptions) => SchemaObject)

/**
 * Supplement class or property with additional JSON Schema keywords.
 *
 * Keywords defined here are merged with the keywords derived from
 * class-validator decorators. In case of conflicts, keywords defined here
 * overwrite the existing ones.
 */
export function JSONSchema(schema: DecoratorSchema) {
  return (target: object, key?: string) => {
    setMetadataSchema(schema, target, key)
  }
}

export function getMetadataSchema(
  target: object,
  key?: string
): DecoratorSchema {
  const schema = key
    ? Reflect.getMetadata(SCHEMA_KEY, target.constructor, key)
    : Reflect.getMetadata(SCHEMA_KEY, target.constructor)
  return schema || {}
}

export function setMetadataSchema(
  value: DecoratorSchema,
  target: object,
  key?: string
) {
  return key
    ? Reflect.defineMetadata(SCHEMA_KEY, value, target.constructor, key)
    : Reflect.defineMetadata(SCHEMA_KEY, value, target.constructor)
}
