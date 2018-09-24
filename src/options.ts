import { MetadataStorage } from 'class-transformer/metadata/MetadataStorage' // tslint:disable-line:no-submodule-imports
import { ValidatorOptions } from 'class-validator'

import { ISchemaConverters } from './defaultConverters'

export interface IOptions extends ValidatorOptions {
  /**
   * A map of additional metadata-to-schema converters that can be used to
   * supplement or override the default ones. The key should correspond to the
   * 'type' property of a ValidationMetadata object.
   */
  additionalConverters: ISchemaConverters

  /**
   * Metadata storage instance of class-transformer. This value can be
   * optionally defined in order for class-transformer's @Type decorators to
   * have effect in JSON Schema generation.
   */
  classTransformerMetadataStorage?: MetadataStorage

  /**
   * A prefix added to all `$ref` JSON pointers referencing other schemas.
   * Defaults to '#/definitions/'.
   */
  refPointerPrefix: string
}

export const defaultOptions: IOptions = {
  additionalConverters: {},
  refPointerPrefix: '#/definitions/'
}
