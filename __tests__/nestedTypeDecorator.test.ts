import {
    IsOptional,
    IsString,
    ValidateNested,
} from 'class-validator'

import { validationMetadatasToSchemas } from '../src'
import { NestedType } from '../src/decorators'

class SubnestedClass {
    @IsString()
    normalAttr3: string;
}

class NestedClass {
    @IsString()
    normalAttr2: string;

    @IsOptional()
    @ValidateNested()
    @NestedType(() => SubnestedClass)
    subnestedTypeWithObject: SubnestedClass | null | undefined;

    @IsOptional()
    @ValidateNested({ each: true })
    @NestedType(() => SubnestedClass)
    subnestedTypeWithArray: SubnestedClass[]
}

export class NestedTypeTestMainClass {
    @IsOptional()
    @IsString()
    normalAttr: string;

    @ValidateNested()
    @NestedType(() => NestedClass)
    nestedTypeWithObject: NestedClass | null | undefined;

    @ValidateNested({ each: true })
    @NestedType(() => NestedClass)
    nestedTypeWithArray: NestedClass[]
}

describe('NestedType tests', () => {
    it('The NestedType works with arrays or objects', () => {
        const schemas = validationMetadatasToSchemas()
        expect(schemas.NestedTypeTestMainClass).toEqual({
            properties: {
                nestedTypeWithObject: {
                    $ref: '#/definitions/NestedClass'
                },
                nestedTypeWithArray: {
                    items: {
                        $ref: '#/definitions/NestedClass',
                    },
                    type: 'array',
                },
                normalAttr: {
                    type: 'string',
                },
            },
            required: ['nestedTypeWithObject', 'nestedTypeWithArray'],
            type: 'object'
        })

        expect(schemas.NestedClass).toEqual({
            properties: {
                subnestedTypeWithObject: {
                    $ref: '#/definitions/SubnestedClass'
                },
                subnestedTypeWithArray: {
                    items: {
                        $ref: '#/definitions/SubnestedClass'
                    },
                    type: 'array',
                },
                normalAttr2: {
                    type: 'string',
                },
            },
            required: ['normalAttr2'],
            type: 'object'
        })
    })

})
