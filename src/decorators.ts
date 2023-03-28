// tslint:disable:ban-types
import type { ReferenceObject, SchemaObject } from 'openapi3-ts'
import 'reflect-metadata'

import { IOptions } from './options'

const SCHEMA_KEY = Symbol('class-validator-jsonschema:JSONSchema')
const NESTED_TYPE_KEY = Symbol('class-validator-jsonschema:NestedType')

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
 * Allows decorate an attribute to specify its type in order to be used in the
 * conversion to the open api schema
 * 
 * @param typeFunction function retrieving the constructor of the decorated attribute
 */

export function NestedType(typeFunction: () => Function): PropertyDecorator {
  return function (target: object, key: string) {
    setMetadataNestedSchema(typeFunction, target.constructor, key)
  }
}

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

/**
 * Retrieves a function to get the constructor of an attribute decorated with NestedType
 */
export function getMetadataNestedType(
  target: object | Function,
  key: string
): () => Function | undefined {
  return Reflect.getMetadata(NESTED_TYPE_KEY, target, key) || undefined
}

/**
 * Stores in the metadata a function to get the constructor of an attribute decorated with NestedType
 */
function setMetadataNestedSchema(
  value: () => Function,
  target: object | Function,
  key: string
) {
  return Reflect.defineMetadata(NESTED_TYPE_KEY, value, target, key)
}
