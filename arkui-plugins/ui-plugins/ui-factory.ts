import * as arkts from "@koalaui/libarkts"
import {
    BuilderLambdaNames,
    CustomComponentNames
} from "./utils";
import { annotation } from "../common/arkts-utils";

export class factory {
    /**
     * create `instance: <typeName>` as identifier
     */
    static createInstanceIdentifier(typeName: string): arkts.Identifier {
        return arkts.factory.createIdentifier(
            BuilderLambdaNames.STYLE_ARROW_PARAM_NAME,
            factory.createTypeReferenceFromString(typeName)
        )
    }

    /**
     * create `instance: <typeName>` as parameter
     */
    static createInstanceParameter(typeName: string): arkts.ETSParameterExpression {
        return arkts.factory.createParameterDeclaration(
            factory.createInstanceIdentifier(typeName),
            undefined
        )
    }

    /**
     * create `(instance: <typeName>) => void`
     */
    static createStyleLambdaFunctionType(typeName: string): arkts.ETSFunctionType {
        return arkts.factory.createFunctionType(
            arkts.FunctionSignature.createFunctionSignature(
                undefined,
                [
                    factory.createInstanceParameter(typeName)
                ],
                factory.createTypeReferenceFromString(typeName),
                false
            ),
            arkts.Es2pandaScriptFunctionFlags.SCRIPT_FUNCTION_FLAGS_ARROW
        );
    }

    /**
     * create `style: ((instance: <typeName>) => void) | undefined` as identifier
     */
    static createStyleIdentifier(typeName: string): arkts.Identifier {
        return arkts.factory.createIdentifier(
            BuilderLambdaNames.STYLE_PARAM_NAME,
            arkts.factory.createUnionType([
                factory.createStyleLambdaFunctionType(typeName),
                arkts.factory.createETSUndefinedType()
            ])
        )
    }

    /**
     * create `@memo() style: ((instance: <typeName>) => void) | undefined` as parameter
     */
    static createStyleParameter(typeName: string): arkts.ETSParameterExpression {
        const styleParam: arkts.Identifier = factory.createStyleIdentifier(typeName);
        const param = arkts.factory.createParameterDeclaration(styleParam, undefined);
        param.annotations = [annotation("memo")];
        return param;
    }

    /**
     * create `initializers: <optionsName> | undefined` as identifier
     */
    static createInitializerOptionsIdentifier(optionsName: string): arkts.Identifier {
        return arkts.factory.createIdentifier(
            CustomComponentNames.COMPONENT_INITIALIZERS_NAME,
            arkts.factory.createUnionType([
                factory.createTypeReferenceFromString(optionsName),
                arkts.factory.createETSUndefinedType()
            ])
        )
    }

    /**
     * create `initializers: <optionsName> | undefined` as parameter
     */
    static createInitializersOptionsParameter(optionsName: string): arkts.ETSParameterExpression {
        return arkts.factory.createParameterDeclaration(
            factory.createInitializerOptionsIdentifier(
                optionsName
            ),
            undefined
        )
    }

    /**
     * create `content: (() => void) | undefined` as identifier
     */
    static createContentIdentifier(): arkts.Identifier {
        return arkts.factory.createIdentifier(
            BuilderLambdaNames.CONTENT_PARAM_NAME,
            arkts.factory.createUnionType([
                factory.createLambdaFunctionType(),
                arkts.factory.createETSUndefinedType()
            ])
        );
    }

    /**
     * create `@memo() content: (() => void) | undefined` as parameter
     */
    static createContentParameter(): arkts.ETSParameterExpression {
        const contentParam: arkts.Identifier = factory.createContentIdentifier();
        const param = arkts.factory.createParameterDeclaration(contentParam, undefined);
        param.annotations = [annotation("memo")];
        return param;
    }

    /**
     * create type from string
     */
    static createTypeReferenceFromString(name: string): arkts.TypeNode {    
        return arkts.factory.createTypeReference(
            arkts.factory.createTypeReferencePart(
                arkts.factory.createIdentifier(name)
            )
        );
    }

    /**
     * create `(<params>) => <returnType>`. If returnType is not given, then using `void`.
     */
    static createLambdaFunctionType(
        params?: arkts.Expression[],
        returnType?: arkts.TypeNode | undefined
    ): arkts.ETSFunctionType {
        return arkts.factory.createFunctionType(
            arkts.FunctionSignature.createFunctionSignature(
                undefined,
                params ?? [],
                returnType 
                    ?? arkts.factory.createPrimitiveType(arkts.Es2pandaPrimitiveType.PRIMITIVE_TYPE_VOID),
                false
            ),
            arkts.Es2pandaScriptFunctionFlags.SCRIPT_FUNCTION_FLAGS_ARROW
        )
    }
}
