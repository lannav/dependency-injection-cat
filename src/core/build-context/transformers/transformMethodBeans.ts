import ts, { factory } from 'typescript';
import { BeanRepository, IBeanDescriptorWithId, TBeanNode } from '../../bean/BeanRepository';
import { BeanDependenciesRepository } from '../../bean-dependencies/BeanDependenciesRepository';
import { compact } from 'lodash';
import { isBeanDependencyFromCurrentContext } from '../utils/isBeanDependencyFromCurrentContext';
import { getGlobalContextVariableNameByContextId } from '../utils/getGlobalContextVariableNameByContextId';

export const transformMethodBeans = (globalContextIdsToAdd: string[]): ts.TransformerFactory<ts.SourceFile> => {
    return context => {
        return sourceFile => {
            const visitor: ts.Visitor = (node: ts.Node) => {
                if (ts.isMethodDeclaration(node) && BeanRepository.beanNodeToBeanDescriptorMap.has(node as TBeanNode)) {
                    const beanDescriptor = BeanRepository.beanNodeToBeanDescriptorMap.get(node as TBeanNode) ?? null;
                    if (beanDescriptor === null) {
                        return;
                    }

                    const newBody = getNewBody(beanDescriptor, globalContextIdsToAdd);

                    return factory.updateMethodDeclaration(
                        node,
                        undefined,
                        undefined,
                        undefined,
                        node.name,
                        undefined,
                        undefined,
                        [],
                        node.type,
                        newBody,
                    );
                }

                return ts.visitEachChild(node, visitor, context);
            };

            return ts.visitNode(sourceFile, visitor);
        };
    };
};

function getNewBody (beanDescriptor: IBeanDescriptorWithId, globalContextIdsToAdd: string[]): ts.Block {
    const node = beanDescriptor.node as ts.MethodDeclaration;
    const nodeBody = node.body ?? factory.createBlock([]);

    const dependencies = BeanDependenciesRepository.beanDependenciesRepository
        .get(beanDescriptor.contextDescriptor.name)?.get(beanDescriptor) ?? [];

    const dependenciesStatements = dependencies.map(dependencyDescriptor => {
        if (dependencyDescriptor.qualifiedBean === null) {
            return;
        }

        if (isBeanDependencyFromCurrentContext(beanDescriptor, dependencyDescriptor.qualifiedBean)) {
            return factory.createVariableStatement(
                undefined,
                factory.createVariableDeclarationList(
                    [factory.createVariableDeclaration(
                        factory.createIdentifier(dependencyDescriptor.parameterName),
                        undefined,
                        dependencyDescriptor.node.type,
                        factory.createCallExpression(
                            factory.createPropertyAccessExpression(
                                factory.createThis(),
                                factory.createIdentifier('getBean')
                            ),
                            undefined,
                            [factory.createStringLiteral(dependencyDescriptor.qualifiedBean?.classMemberName ?? '')]
                        )
                    )],
                    ts.NodeFlags.Const
                )
            );
        }

        globalContextIdsToAdd.push(dependencyDescriptor.qualifiedBean.contextDescriptor.id);

        return factory.createVariableStatement(
            undefined,
            factory.createVariableDeclarationList(
                [factory.createVariableDeclaration(
                    factory.createIdentifier(dependencyDescriptor.parameterName),
                    undefined,
                    dependencyDescriptor.node.type,
                    factory.createCallExpression(
                        factory.createPropertyAccessExpression(
                            factory.createIdentifier(getGlobalContextVariableNameByContextId(dependencyDescriptor.qualifiedBean.contextDescriptor.id)),
                            factory.createIdentifier('getBean')
                        ),
                        undefined,
                        [factory.createStringLiteral(dependencyDescriptor.qualifiedBean.classMemberName)]
                    ),
                )],
                ts.NodeFlags.Const
            )
        );
    });

    return factory.updateBlock(
        nodeBody,
        [
            ...compact(dependenciesStatements),
            ...nodeBody.statements,
        ]
    );
}
