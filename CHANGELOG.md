# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
