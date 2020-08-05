import * as ts from 'typescript';
import { getFactoryNameForNamespaceImport } from './getFactoryNameForNamespaceImport';
import { getFactoryPathWithoutExtension } from './getFactoryPathWithoutExtension';
import { getFactoryDependencies } from './utils/getFactoryDependencies';

export function getImportsForFactory(factoryId: string): ts.ImportDeclaration[] {
    return getFactoryDependencies(factoryId).map(({ factoryId: dependencyFactoryId }) => ts.createImportDeclaration(
        undefined,
        undefined,
        ts.createImportClause(
            undefined,
            ts.createNamespaceImport(
                ts.createIdentifier(
                    getFactoryNameForNamespaceImport(dependencyFactoryId),
                ),
            ),
            false
        ),
        ts.createStringLiteral(getFactoryPathWithoutExtension(dependencyFactoryId)),
    ));
}
