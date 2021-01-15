import { MetadataStorage as ClassTransformerMetadataStorage } from 'class-transformer/metadata/MetadataStorage' // tslint:disable-line:no-submodule-imports
import {
  getMetadataStorage,
  MetadataStorage,
  ValidatorOptions,
} from 'class-validator'

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
  classTransformerMetadataStorage?: ClassTransformerMetadataStorage

  /**
   * Metadata storage instance of class-validator. This value can be
   * optionally defined in order to override the default storage used
   * to parse decorator metadata.
   */
  classValidatorMetadataStorage: MetadataStorage

  /**
   * A prefix added to all `$ref` JSON pointers referencing other schemas.
   * Defaults to '#/definitions/'.
   */
  refPointerPrefix: string
}

export const defaultOptions: IOptions = {
  additionalConverters: {},
  classValidatorMetadataStorage: getMetadataStorage(),
  refPointerPrefix: '#/definitions/',
}
