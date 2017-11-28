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
   * A prefix added to all `$ref` JSON pointers referencing other schemas.
   * Defaults to '#/definitions/'.
   */
  refPointerPrefix: string
}

export const defaultOptions: IOptions = {
  additionalConverters: {},
  refPointerPrefix: '#/definitions/'
}
