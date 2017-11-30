import { SchemaObject } from 'openapi3-ts'
import 'reflect-metadata'

import { IOptions } from './options'

const SCHEMA_KEY = Symbol('class-validator-jsonschema:JSONSchema')

/**
 * Either a plain JSON Schema object that gets merged into the existing schema,
 * or a function that receives as parameters the existing schema and global
 * options, returning an updated schema.
 */
export type DecoratorSchema =
  | SchemaObject
  | ((source: SchemaObject, options: IOptions) => SchemaObject)

/**
 * Supplement class or property with additional JSON Schema keywords.
 *
 * @param schema JSON Schema object that is merged into the schema derived from
 * class-validator decorators. In case of conflicts, keywords defined here
 * overwrite the existing ones. Alternatively you can supply a function that
 * receives as parameters the existing schema and global options, returning an
 * updated schema.
 */
export function JSONSchema(schema: DecoratorSchema) {
  return (target: object, key?: string) => {
    setMetadataSchema(schema, target, key)
  }
}

/**
 * Get the JSON Schema stored in given target's metadata.
 */
export function getMetadataSchema(
  target: object,
  key?: string
): DecoratorSchema {
  const schema = key
    ? Reflect.getMetadata(SCHEMA_KEY, target.constructor, key)
    : Reflect.getMetadata(SCHEMA_KEY, target.constructor)
  return schema || {}
}

/**
 * Store given JSON Schema into target object's metadata.
 */
function setMetadataSchema(
  value: DecoratorSchema,
  target: object,
  key?: string
) {
  return key
    ? Reflect.defineMetadata(SCHEMA_KEY, value, target.constructor, key)
    : Reflect.defineMetadata(SCHEMA_KEY, value, target.constructor)
}
