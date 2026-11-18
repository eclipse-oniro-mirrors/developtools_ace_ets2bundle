/*
 * Copyright (c) 2025 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as arkts from '@koalaui/libarkts';

import { AbstractVisitor } from '../common/abstract-visitor';

import { debugLog } from '../common/debug';
import { hasDecorator, getAnnotationValue } from '../ui-plugins/property-translators/utils'
import { DecoratorNames, DeprecatedDecoratorNames, StructDecoratorNames, GlobalReusePoolNames } from '../common/predefines';

/** Replaces type parameters in a cloned alias body without changing the alias declaration. */
class TypeParameterSubstitutionVisitor extends AbstractVisitor {
    constructor(private substitutions: ReadonlyMap<string, arkts.TypeNode>) {
        super();
    }

    /** Replaces matching type references with a fresh copy of the type argument. */
    visitor(node: arkts.AstNode): arkts.AstNode {
        // visitEachChild does not visit TSArrayType elements, so visit them explicitly.
        if (arkts.isTSArrayType(node) && node.elementType) {
            const elementType = this.visitor(node.elementType);
            if (arkts.isTypeNode(elementType) && elementType !== node.elementType) {
                return arkts.TSArrayType.updateTSArrayType(node, elementType);
            }
            return node;
        }
        if (arkts.isETSTypeReference(node)) {
            const part = node.part;
            if (
                part?.name &&
                arkts.isIdentifier(part.name) &&
                !part.previous &&
                !part.typeParams
            ) {
                const substitution = this.substitutions.get(part.name.name);
                if (substitution) {
                    return substitution.clone();
                }
            }
        }
        return this.visitEachChild(node);
    }
}

export class EmitTransformer extends AbstractVisitor {
    constructor(private options?: interop.EmitTransformerOptions) {
        super();
    }

    processComponent(node: arkts.ClassDeclaration): arkts.ClassDeclaration {
        const className = node.definition?.ident?.name;
        if (!className) {
            throw 'Non Empty className expected for Component';
        }

        this.transformReusePoolInAnnotations(node.definition!);

        const newDefinition = arkts.factory.updateClassDefinition(
            node.definition,
            node.definition?.ident,
            undefined,
            undefined,
            node.definition?.implements,
            undefined,
            undefined,
            node.definition?.body,
            node.definition?.modifiers,
            arkts.classDefinitionFlags(node.definition) | arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_NONE,
            node.definition.annotations
        );

        let newDec: arkts.ClassDeclaration = arkts.factory.updateClassDeclaration(node, newDefinition);

        debugLog(`DeclTransformer:checked:struct_ast:${newDefinition.dumpJson()}`);
        newDec.modifierFlags = node.modifierFlags;
        return newDec;
    }

    private transformReusePoolInAnnotations(definition: arkts.ClassDefinition): void {
        const annotations = definition.annotations;
        if (!annotations || annotations.length === 0) {
            return;
        }
        for (const anno of annotations) {
            if (!anno.expr || !arkts.isIdentifier(anno.expr)) {
                continue;
            }
            const annoName = anno.expr.name;
            if (annoName !== StructDecoratorNames.COMPONENT && annoName !== StructDecoratorNames.COMPONENT_V2) {
                continue;
            }
            const reusePoolProp = this.getClassPropByName(anno, GlobalReusePoolNames.REUSE_POOL);
            const poolAcceptsProp = this.getClassPropByName(anno, GlobalReusePoolNames.POOL_ACCEPTS);
            if (!reusePoolProp || !reusePoolProp.value || !poolAcceptsProp) {
                continue;
            }
            const value = reusePoolProp.value;
            if (!arkts.isMemberExpression(value) || !arkts.isIdentifier(value.property)) {
                continue;
            }
            const poolOwnership = value.property.name;
            const freezeProp = arkts.factory.createClassProperty(
                arkts.factory.createIdentifier('freezeWhenInactive'),
                arkts.factory.createBooleanLiteral(true),
                undefined,
                arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_NONE,
                false
            );
            if (poolOwnership === GlobalReusePoolNames.REUSE_POOL_OWNERSHIP_OFF) {
                anno.setProperties([freezeProp]);
                continue;
            }
            const reusePoolStr = poolOwnership === 'SHARED' ? 'shared' : 'perInstance';
            const updatedReusePoolProp = arkts.factory.updateClassProperty(
                reusePoolProp,
                reusePoolProp.key,
                arkts.factory.createStringLiteral(reusePoolStr),
                reusePoolProp.typeAnnotation,
                reusePoolProp.modifierFlags,
                false
            );
            const updatedPoolAcceptsProp = this.transformPoolAccepts(poolAcceptsProp);
            anno.setProperties([
                ...anno.properties.map((p) => this.replaceReusePoolProp(p, updatedReusePoolProp, updatedPoolAcceptsProp)),
                freezeProp
            ]);
        }
    }

    private replaceReusePoolProp(
        p: arkts.AstNode,
        updatedReusePoolProp: arkts.ClassProperty,
        updatedPoolAcceptsProp: arkts.ClassProperty
    ): arkts.AstNode {
        if (!arkts.isClassProperty(p) || !arkts.isIdentifier(p.key)) {
            return p;
        }
        if (p.key.name === GlobalReusePoolNames.REUSE_POOL) {
            return updatedReusePoolProp;
        }
        if (p.key.name === GlobalReusePoolNames.POOL_ACCEPTS) {
            return updatedPoolAcceptsProp;
        }
        return p;
    }

    private transformPoolAccepts(poolAcceptsProp: arkts.ClassProperty): arkts.ClassProperty {
        const value = poolAcceptsProp.value;
        if (!value || !arkts.isArrayExpression(value)) {
            return poolAcceptsProp;
        }
        const newElements = value.elements.map((elem) => {
            if (arkts.isStringLiteral(elem)) {
                return arkts.factory.createIdentifier(elem.str);
            }
            return elem;
        });
        const newArray = arkts.factory.createArrayExpression(newElements);
        return arkts.factory.updateClassProperty(
            poolAcceptsProp,
            poolAcceptsProp.key,
            newArray,
            poolAcceptsProp.typeAnnotation,
            poolAcceptsProp.modifierFlags,
            false
        );
    }

    processAlias(node: arkts.ClassProperty, decoratorName: DecoratorNames): arkts.ClassProperty {
        const annotations: readonly arkts.AnnotationUsage[] = node.annotations;
        annotations.forEach((anno) => {
            const value = getAnnotationValue(anno, decoratorName);
            if (!!node.key && arkts.isIdentifier(node.key)) {
                const property = anno.properties[0];
                if (property === undefined || !arkts.isClassProperty(property)) {
                    anno.setProperties([
                        arkts.factory.createClassProperty(
                            arkts.factory.createIdentifier('value'),
                            arkts.factory.createStringLiteral(node.key.name),
                            undefined,
                            arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_NONE,
                            false
                        )
                    ]);
                } else {
                    anno.setProperties([
                        arkts.factory.updateClassProperty(
                            property,
                            arkts.factory.createIdentifier('value'),
                            value ? property.value : arkts.factory.createStringLiteral(node.key.name),
                            property.typeAnnotation,
                            property.modifierFlags,
                            false
                        )
                    ]);
                }
            }
        })
        return node;
    }

    getClassPropByName(anno: arkts.AnnotationUsage, name: string): arkts.ClassProperty | undefined {
        return anno.properties.find (
            (p): p is arkts.ClassProperty =>
            arkts.isClassProperty(p) &&
            p.key != null &&
            arkts.isIdentifier(p.key) &&
            p.key.name === name
        );
    }


    processProvide(node: arkts.ClassProperty): arkts.ClassProperty {
        for (const anno of node.annotations ?? []) {
            const allowOverrideProp = this.getClassPropByName(anno, 'allowOverride');
            const aliasProp = this.getClassPropByName(anno, 'alias');
            if (!allowOverrideProp && !aliasProp) { 
                continue;
            }
            const aliasValue = aliasProp && aliasProp.value && arkts.isStringLiteral(aliasProp.value) ? aliasProp.value.str : '';
            const allowOverrideValue = allowOverrideProp && allowOverrideProp.value && arkts.isBooleanLiteral(allowOverrideProp.value) ? allowOverrideProp.value.value : false;
            if (allowOverrideValue && allowOverrideProp) {
                anno.setProperties([
                    arkts.factory.updateClassProperty(
                        allowOverrideProp,
                        allowOverrideProp.key,
                        arkts.factory.createStringLiteral(aliasValue),
                        allowOverrideProp.typeAnnotation,
                        allowOverrideProp.modifierFlags,
                        false,
                        allowOverrideProp.annotations
                    )
                ]);
            } else if (aliasProp) {
                anno.setProperties([
                    arkts.factory.updateClassProperty(
                        aliasProp,
                        arkts.factory.createIdentifier('value'),
                        aliasProp.value,
                        aliasProp.typeAnnotation,
                        aliasProp.modifierFlags,
                        false,
                        aliasProp.annotations
                    )
                ]);
            } else {
                anno.setProperties([]);
            }
        }
        return node;
    }

    private refMap = new Map<string, string>([
        [DecoratorNames.PROP_REF, DeprecatedDecoratorNames.PROP],
        [DecoratorNames.STORAGE_PROP_REF, DeprecatedDecoratorNames.STORAGE_PROP],
        [DecoratorNames.LOCAL_STORAGE_PROP_REF, DeprecatedDecoratorNames.LOCAL_STORAGE_PROP],
    ]);

    private processRefDecorators(node: arkts.ClassProperty): arkts.ClassProperty {
        const updatedAnnos = node.annotations.map((anno) => {
            if (anno.expr && arkts.isIdentifier(anno.expr)) {
                const target = this.refMap.get(anno.expr.name);
                if (target) {
                    return arkts.AnnotationUsage.update1AnnotationUsage(
                    anno,
                    arkts.factory.updateIdentifier(anno.expr, target),
                    anno.properties
                    );
                }
            }
            return anno;
        });
        node.setAnnotations(updatedAnnos);
        return node;
    }

    processClassProperty(node: arkts.ClassProperty): arkts.ClassProperty {
        if (hasDecorator(node, DecoratorNames.PROVIDE)) {
            return this.processProvide(node);
        } else if (hasDecorator(node, DecoratorNames.PROVIDER) || hasDecorator(node, DecoratorNames.CONSUME) || hasDecorator(node, DecoratorNames.CONSUMER)) {
            const aliasDecorator = hasDecorator(node, DecoratorNames.PROVIDER) ? DecoratorNames.PROVIDER
                : hasDecorator(node, DecoratorNames.CONSUME) ? DecoratorNames.CONSUME : DecoratorNames.CONSUMER;
            return this.processAlias(node, aliasDecorator);
        } else if (
            hasDecorator(node, DecoratorNames.PROP_REF) ||
            hasDecorator(node, DecoratorNames.STORAGE_PROP_REF) ||
            hasDecorator(node, DecoratorNames.LOCAL_STORAGE_PROP_REF)
            ) {
                return this.processRefDecorators(node);
            }
        return node;
    }

    processMethodDefinition(node: arkts.MethodDefinition): arkts.MethodDefinition {
        if (hasDecorator(node, DecoratorNames.MONITOR) || hasDecorator(node, DecoratorNames.COMPUTED)){
            node.function.setAnnotations([]);
        }
        return node;
    }

    visitor(beforeChildren: arkts.AstNode): arkts.AstNode {
        const node = this.visitEachChild(beforeChildren);
        if (arkts.isClassDeclaration(node) && node.definition?.isFromStruct) {
            return this.processComponent(node);
        } else if (arkts.isClassProperty(node)) {
            return this.processClassProperty(node);
        } else if (arkts.isMethodDefinition(node)) {
            return this.processMethodDefinition(node);
        } else if (arkts.isETSTypeReference(node)) {
            return this.transformWrappedBuilderTypeRef(node);
        } else if (arkts.isTSArrayType(node) && node.elementType) {
            // Also convert WrappedBuilder types inside arrays.
            const elementType = this.visitor(node.elementType);
            if (arkts.isTypeNode(elementType) && elementType !== node.elementType) {
                return arkts.TSArrayType.updateTSArrayType(node, elementType);
            }
        }
        return node;
    }

    /**
     * Converts WrappedBuilder<function type> to WrappedBuilder<parameter tuple>.
     * e.g. WrappedBuilder<(value: string, size: number) => void> -> WrappedBuilder<[string, number]>.
     * Runs after binding so aliases can be resolved. Leaves unresolved types unchanged.
     */
    transformWrappedBuilderTypeRef(node: arkts.ETSTypeReference): arkts.ETSTypeReference {
        const part = node.part;
        if (!part?.name || !arkts.isIdentifier(part?.name) || part?.name.name !== 'WrappedBuilder') {
            return node;
        }
        const builderType = part.typeParams?.params?.[0];
        if (!builderType) {
            return node;
        }

        const types = this.getFunctionParameterTypes(builderType);
        if (!types) {
            return node;
        }
        const tuple = arkts.ETSTuple.create2ETSTuple(types);

        const newTypeParams = arkts.factory.updateTSTypeParameterInstantiation(part.typeParams, [tuple]);
        const newPart = arkts.factory.updateETSTypeReferencePart(part, part.name, newTypeParams, part.previous);
        return arkts.factory.updateETSTypeReference(node, newPart);
    }

    /**
     * Resolves function types and alias chains to their parameter types.
     * Tracks aliases on the current path to stop cycles.
     * Returns undefined on failure, or an empty array for a function with no parameters.
     */
    private getFunctionParameterTypes(
        typeNode: arkts.TypeNode,
        visitedAliases: Set<arkts.TSTypeAliasDeclaration> = new Set()
    ): arkts.TypeNode[] | undefined {
        if (arkts.isETSFunctionType(typeNode)) {
            return this.getDirectFunctionParameterTypes(typeNode);
        }

        if (!arkts.isETSTypeReference(typeNode)) {
            return undefined;
        }
        const part = typeNode.part;
        if (!part?.name || !arkts.isIdentifier(part.name)) {
            return undefined;
        }
        // Use the bound identifier to find local or imported aliases.
        const declaration = arkts.getPeerIdentifierDecl(part.name.peer);
        if (
            !declaration ||
            !arkts.isTSTypeAliasDeclaration(declaration) ||
            !declaration.typeAnnotation ||
            visitedAliases.has(declaration)
        ) {
            return undefined;
        }

        const substitutions = this.getAliasTypeSubstitutions(declaration, part);
        if (!substitutions) {
            return undefined;
        }

        const instantiatedType = new TypeParameterSubstitutionVisitor(substitutions).visitor(
            declaration.typeAnnotation.clone()
        );
        if (!arkts.isTypeNode(instantiatedType)) {
            return undefined;
        }

        visitedAliases.add(declaration);
        const types = this.getFunctionParameterTypes(instantiatedType, visitedAliases);
        visitedAliases.delete(declaration);
        return types;
    }

    /** Clones parameter types in order. Returns undefined if a parameter has no type. */
    private getDirectFunctionParameterTypes(typeNode: arkts.ETSFunctionType): arkts.TypeNode[] | undefined {
        const types: arkts.TypeNode[] = [];
        for (const parameter of typeNode.params) {
            if (
                !arkts.isETSParameterExpression(parameter) ||
                !parameter.typeAnnotation ||
                !arkts.isTypeNode(parameter.typeAnnotation)
            ) {
                return undefined;
            }
            types.push(parameter.typeAnnotation.clone());
        }
        return types;
    }

    /**
     * Maps alias type parameters to arguments by position, using defaults when needed.
     * Resolves references to earlier parameters in defaults, such as B = A.
     * Returns undefined if arguments are missing or there are too many.
     */
    private getAliasTypeSubstitutions(
        declaration: arkts.TSTypeAliasDeclaration,
        part: arkts.ETSTypeReferencePart
    ): Map<string, arkts.TypeNode> | undefined {
        const typeParameters = declaration.typeParams?.params ?? [];
        const typeArguments = part.typeParams?.params ?? [];
        if (typeArguments.length > typeParameters.length) {
            return undefined;
        }
        const substitutions = new Map<string, arkts.TypeNode>();
        for (let index = 0; index < typeParameters.length; index++) {
            const typeParameter = typeParameters[index];
            const typeParameterName = typeParameter.name?.name;
            let typeArgument = typeArguments[index] ?? typeParameter.defaultType;
            if (!typeParameterName || !typeArgument) {
                return undefined;
            }
            typeArgument = new TypeParameterSubstitutionVisitor(substitutions).visitor(
                typeArgument.clone()
            ) as arkts.TypeNode;
            substitutions.set(typeParameterName, typeArgument);
        }

        return substitutions;
    }
}
