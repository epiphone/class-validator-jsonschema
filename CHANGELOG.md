# **Changelog moved to Github Releases**

Changelog for versions >2.0.3 is published in https://github.com/epiphone/class-validator-jsonschema/releases.

# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [2.0.3] - 2020-08-01
### Fixed
- Handle undefined `typeMeta.reflectedType` in Map type resolution [#45](https://github.com/epiphone/class-validator-jsonschema/pull/45)

## [2.0.2] - 2020-06-03
### Fixed
- Handling for Map fields [#35](https://github.com/epiphone/class-validator-jsonschema/pull/35)

## [2.0.1] - 2020-05-06
### Fixed
- Fix metadata object mutation breaking validation in routing-controllers [#36](https://github.com/epiphone/class-validator-jsonschema/issues/36)

## [2.0.0] - 2020-05-04
### Changed
- Same as v2.0.0-rc1

## [2.0.0-rc1] - 2020-05-01
### Changed
- Bump `class-validator` peer dependency to `^0.12.0` - meaning we're no longer compatible with pre-0.12 versions of `class-validator`!
- `validationMetadatasToSchemas` no longer takes a `validationMetadatas` object as first argument. Instead the library now automatically grabs `validationMetadatas` from `getMetadataStorage()` under the hood.

    This simplifies library usage from

    ```typescript
    const metadatas = (getFromContainer(MetadataStorage) as any).validationMetadatas
    const schemas = validationMetadatasToSchemas(metadatas)
    ```

    into plain

    ```typescript
    const schemas = validationMetadatasToSchemas()
    ```

    You can still choose to override the default metadata storage using the optional options argument:

    ```typescript
    const schemas = validationMetadatasToSchemas({
        classValidatorMetadataStorage: myCustomMetadataStorage
    })
    ```

## [1.3.1] - 2019-12-05
### Fixed
- The default enum converter uses `Object.values` instead of `Object.key` to support named values such as `enum SomeEnum { Key = 'value' }` (thanks [@DimalT](https://github.com/DimaIT) at [#23](https://github.com/epiphone/class-validator-jsonschema/issues/23))

## [1.3.0] - 2019-06-24
### Fixed
- Moved `class-transformer` and `class-validator` to peer dependencies [#11](https://github.com/epiphone/class-validator-jsonschema/issues/11)
- Updated dependencies

## [1.2.1] - 2019-06-03
### Fixed
- Update dependencies to fix mismatch with `class-validator` and `class-tranformer` [#11](https://github.com/epiphone/class-validator-jsonschema/issues/11)

## [1.2.0] - 2018-09-25
### Added
- Support `class-transfomer`'s `@Type` decorator for explicitly defining type of nested properties wrapped in a generic (e.g. `@ValidateNested({ each: true }) users: UserClass[]`) [#7](https://github.com/epiphone/class-validator-jsonschema/issues/7)

## [1.1.3] - 2018-09-12
### Fixed
- Update `openapi3-ts` dependency to fix incorrect `SchemaObject.additionalProperties` type [#4](https://github.com/epiphone/class-validator-jsonschema/issues/4)
- Omit the `required` property in case of no required properties instead of an empty list: `required: []` [#5](https://github.com/epiphone/class-validator-jsonschema/issues/5)

## [1.1.2] - 2018-08-19
### Fixed
- Add missing handling for [inherited validation decorators](https://github.com/typestack/class-validator#inheriting-validation-decorators) [#3](https://github.com/epiphone/class-validator-jsonschema/pull/3)

## [1.1.1] - 2018-03-14
### Fixed
- [@scboffspring](https://github.com/scboffspring) fixed schema properties being mutated by `_.merge` [#1](https://github.com/epiphone/class-validator-jsonschema/pull/1)

## [1.1.0] - 2017-11-30
### Added
- Additional class/property schema keywords via the `@JSONSchema` decorator
