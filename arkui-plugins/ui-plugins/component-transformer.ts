/*
 * Copyright (c) 2022-2025 Huawei Device Co., Ltd.
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

import * as arkts from "@koalaui/libarkts"
import { getInteropPath } from "../path"
const interop = require(getInteropPath())
const nullptr = interop.nullptr
import {
    AbstractVisitor,
    VisitorOptions
} from "../common/abstract-visitor";
import {
    CustomComponentNames,
    getCustomComponentOptionsName,
    createOptionalClassProperty
} from "./utils";
import {
    isAnnotation
} from "../common/arkts-utils";
import {
    findEntryWithStorageInClassAnnotations
} from "./entry-translators/utils";
import {
    factory as entryFactory
} from "./entry-translators/factory"
import { hasDecorator, DecoratorNames } from "./property-translators/utils"
import { annotation } from "../common/arkts-utils";
import { backingField, expectName } from "../common/arkts-utils";
import { getStageManagmentType } from "./property-translators/utils";
import { nodeByType } from "@koalaui/libarkts/build/src/reexport-for-generated";

export interface ComponentTransformerOptions extends VisitorOptions {
    arkui?: string
}

type ScopeInfo = {
    name: string,
    isEntry?: boolean,
    isComponent?: boolean,
    isReusable?: boolean
}

interface ComponentContext {
    componentNames: string[], 
    structMembers: Map<string, arkts.AstNode[]>,
}

export class ComponentTransformer extends AbstractVisitor {
    private scopeInfos: ScopeInfo[] = [];
    private componentNames: string[] = [];
    private entryNames: string[] = [];
    private reusableNames: string[] = [];
    private arkui?: string;
    private context: ComponentContext = { componentNames: [], structMembers: new Map() };

    constructor(options?: ComponentTransformerOptions) {
        const _options: ComponentTransformerOptions = options ?? {};
        super(_options);
        this.arkui = _options.arkui;
    }

    enter(node: arkts.AstNode) {
        if (arkts.isStructDeclaration(node) && !!node.definition.ident) {
            const scopeInfo: ScopeInfo = { name: node.definition.ident.name };
            node.definition.annotations.forEach((anno) => {
                scopeInfo.isEntry ||= isAnnotation(anno, CustomComponentNames.ENTRY_ANNOTATION_NAME);
                scopeInfo.isComponent ||= isAnnotation(anno, CustomComponentNames.COMPONENT_ANNOTATION_NAME);
                scopeInfo.isReusable ||= isAnnotation(anno, CustomComponentNames.RESUABLE_ANNOTATION_NAME);
            });
            this.scopeInfos.push(scopeInfo);
        }
    }

    exit(node: arkts.AstNode) {
        if (arkts.isStructDeclaration(node) || arkts.isClassDeclaration(node)) {
            if (!node.definition || !node.definition.ident || this.scopeInfos.length === 0) return;
            if (this.scopeInfos[this.scopeInfos.length - 1]?.name === node.definition.ident.name) {
                this.scopeInfos.pop();
            }
        }
    }

    isComponentStruct(): boolean {
        if (this.scopeInfos.length === 0) return false;
        const scopeInfo: ScopeInfo = this.scopeInfos[this.scopeInfos.length - 1];
        return !!scopeInfo.isComponent;
    }

    createImportDeclaration(): void {
        const source: arkts.StringLiteral = arkts.factory.create1StringLiteral(
            this.arkui ?? CustomComponentNames.COMPONENT_DEFAULT_IMPORT
        );
        const resolvedSource: arkts.StringLiteral = arkts.factory.create1StringLiteral(
            arkts.ImportPathManager.create().resolvePath('', source.str)
        );
        const imported: arkts.Identifier = arkts.factory.createIdentifier(
            CustomComponentNames.COMPONENT_CLASS_NAME
        );
        const importDecl: arkts.ETSImportDeclaration = arkts.factory.createImportDeclaration(
            arkts.ImportSource.createImportSource(
                source,
                resolvedSource,
                false
            ),
            [
                arkts.factory.createImportSpecifier(
                    imported,
                    imported
                )
            ],
            arkts.Es2pandaImportKinds.IMPORT_KINDS_VALUE
        )
        // Insert this import at the top of the script's statements.
        arkts.importDeclarationInsert(importDecl);
        return;
    }

    processEtsScript(node: arkts.EtsScript): arkts.EtsScript {
        if (
            this.isExternal 
            && this.componentNames.length === 0 
            && this.entryNames.length === 0
        ) {
            return node;
        }
        
        if (!this.isExternal && this.componentNames.length > 0) {
            this.createImportDeclaration();
        }

        let updateStatements: arkts.AstNode[] = [];
        updateStatements.push(
            ...this.componentNames.map(
                name => arkts.factory.createInterfaceDeclaration(
                    [],
                    arkts.factory.createIdentifier(
                        getCustomComponentOptionsName(name)
                    ),
                    nullptr, // TODO: wtf
                    arkts.factory.createInterfaceBody(
                    this.context.structMembers.get(name) ? 
                    this.context.structMembers.get(name)! : []
                    ),
                    false,
                    false
                )
            )
        );
        // TODO: normally, we should only have at most one @Entry component in a single file.
        // probably need to handle error message here.
        updateStatements.push(
            ...this.entryNames.map(entryFactory.generateEntryWrapper)
        );
        if (updateStatements.length > 0) {
            return arkts.factory.updateEtsScript(
                node,
                [
                    ...node.statements,
                    ...updateStatements,
                ]
            )
        }
        return node;
    }

    processComponent(node: arkts.ClassDeclaration | arkts.StructDeclaration): arkts.ClassDeclaration | arkts.StructDeclaration {
        const scopeInfo = this.scopeInfos[this.scopeInfos.length - 1];
        const className = node.definition?.ident?.name;
        if (!className || scopeInfo?.name !== className) {
            return node;
        }

        arkts.GlobalInfo.getInfoInstance().add(className);
        this.componentNames.push(className);

        const definition: arkts.ClassDefinition = node.definition;
        const newDefinitionBody: arkts.AstNode[] = [];
        if (scopeInfo.isEntry) {
            this.entryNames.push(className);
            const entryWithStorage: arkts.ClassProperty | undefined = 
                findEntryWithStorageInClassAnnotations(definition);
            if (!!entryWithStorage) {
                newDefinitionBody.push(entryFactory.createEntryLocalStorageInClass(entryWithStorage));
            }
        }

        const newDefinition = arkts.factory.updateClassDefinition(
            definition,
            definition.ident,
            undefined,
            undefined, // superTypeParams doen't work
            definition.implements,
            undefined,
            arkts.factory.createTypeReference(
                arkts.factory.createTypeReferencePart(
                    arkts.factory.createIdentifier(CustomComponentNames.COMPONENT_CLASS_NAME),
                    arkts.factory.createTSTypeParameterInstantiation(
                        [
                            arkts.factory.createTypeReference(
                                arkts.factory.createTypeReferencePart(
                                    arkts.factory.createIdentifier(className)
                                )
                            ),
                            arkts.factory.createTypeReference(
                                arkts.factory.createTypeReferencePart(
                                    arkts.factory.createIdentifier(
                                        `${CustomComponentNames.COMPONENT_INTERFACE_PREFIX}${className}`
                                    )
                                )
                            ),
                        ]
                    )
                )
            ),
            [...newDefinitionBody, ...definition.body],
            definition.modifiers,
            arkts.classDefinitionFlags(definition) | arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_FINAL
        )

        if (arkts.isStructDeclaration(node)) {
            this.collectComponentMembers(node, className);
            const _node = arkts.factory.createClassDeclaration(newDefinition);
            _node.modifiers = node.modifiers;
            return _node;
        } else {
            return arkts.factory.updateClassDeclaration(
                node,
                newDefinition
            )
        }
    }

    collectComponentMembers(node: arkts.StructDeclaration, className: string): void {
        if (!this.context.structMembers.has(className)) {
            this.context.structMembers.set(className, []);
        }
        node.definition.body.map(it => {
            if (arkts.isClassProperty(it)) {
                this.context.structMembers.get(className)!.push(...this.createInterfaceInnerMember(it));
            }
        });
    }

    createInterfaceInnerMember(member: arkts.ClassProperty): arkts.ClassProperty[] {
        const originalName: string = expectName(member.key);
        const newName: string = backingField(originalName);
        const originMember: arkts.ClassProperty = createOptionalClassProperty(originalName, member,
            '', arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_PUBLIC);
        if (member.annotations.length > 0 && !hasDecorator(member, DecoratorNames.BUILDER_PARAM)) {
            const newMember: arkts.ClassProperty = createOptionalClassProperty(newName, member,
                getStageManagmentType(member), arkts.Es2pandaModifierFlags.MODIFIER_FLAGS_PUBLIC);
            return [originMember, newMember];
        }
        if (hasDecorator(member, DecoratorNames.BUILDER_PARAM)) {
            originMember.setAnnotations([annotation("memo")]);
        }
        return [originMember];
    }

    visitor(node: arkts.AstNode): arkts.AstNode {
        this.enter(node);
        const newNode = this.visitEachChild(node)
        if (arkts.isEtsScript(newNode)) {
            return this.processEtsScript(newNode)
        }
        if (arkts.isStructDeclaration(newNode) && this.isComponentStruct()) {
            const updateNode = this.processComponent(newNode);
            this.exit(newNode);
            return updateNode;
        }
        return newNode
    }
}
