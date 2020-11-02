import { IsString, MinLength } from 'class-validator'
import { classValidatorToJsonSchema, validationMetadatasToSchemas } from '../src'

export class User {
  @MinLength(5)
  @IsString()
  name: string;
}

describe('classValidatorToJsonSchema', () => {
  it('handles default object', async () => {
    const schema = classValidatorToJsonSchema(User)

    expect(schema).toStrictEqual({
      properties: {
        name: { minLength: 5, type: 'string' }
      },
      required: ['name'],
      type: 'object'
    })

    // Import another User class.
    const alternativeUserImport = await import('./classes/User')

    /**
     * By importing another User class with the same name JSON schemas get merged.
     * User JSON schema now contains properties from the classes/User.ts class as
     * well (firstName)
     */
    const schemas = validationMetadatasToSchemas()
    expect(Boolean(schemas.User!.properties!.name)).toBeTruthy()
    expect(Boolean(schemas.User!.properties!.firstName)).toBeTruthy()

    /**
     * When we get JSON schema for a specific class,
     * it returns properties specific for that class (without merging)
     */
    const schema2 = classValidatorToJsonSchema(User)
    // Schema stays the same
    expect(schema).toStrictEqual(schema2)

    const alternativeUserSchema = classValidatorToJsonSchema(alternativeUserImport.User)

    expect(alternativeUserSchema).toStrictEqual({
      properties: {
        firstName: { minLength: 5, type: 'string' }
      },
      required: ['firstName'],
      type: 'object'
    })
  })
})

