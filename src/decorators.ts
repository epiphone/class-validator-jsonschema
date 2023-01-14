// tslint:disable:ban-types
import type { ReferenceObject, SchemaObject } from 'openapi3-ts'
import 'reflect-metadata'

import { IOptions } from './options'

const SCHEMA_KEY = Symbol('class-validator-jsonschema:JSONSchema')

/**
 * Either a plain JSON Schema object that gets merged into the existing schema,
 * or a function that receives as parameters the existing schema and global
 * options, returning an updated schema.
 */
export type DecoratorSchema =
  | ReferenceObject
  | SchemaObject
  | ((
      source: SchemaObject,
      options: IOptions
    ) => ReferenceObject | SchemaObject)

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
  return (target: object | Function, key?: string) => {
    if (key) {
      setMetadataSchema(schema, target.constructor, key) // Property metadata
    } else {
      setMetadataSchema(schema, target, (target as Function).name) // Class metadata
    }
  }
}

/**
 * Get the JSON Schema stored in given target's metadata.
 */
export function getMetadataSchema(
  target: object | Function,
  key: string
): DecoratorSchema {
  return Reflect.getMetadata(SCHEMA_KEY, target.constructor, key) || {}
}

/**
 * Store given JSON Schema into target object's metadata.
 */
function setMetadataSchema(
  value: DecoratorSchema,
  target: object | Function,
  key: string
) {
  return Reflect.defineMetadata(SCHEMA_KEY, value, target, key)
}
