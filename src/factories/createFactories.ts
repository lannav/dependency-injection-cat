import fs from 'fs';
import * as ts from 'typescript';
import { getFactoriesListPath } from './getFactoriesListPath';
import { diConfigRepository } from '../di-config-repository';
import { ProgramRepository } from '../program/ProgramRepository';
import { FactoryIdRepository } from './FactoryIdRepository';
import { getFactoryPath } from './getFactoryPath';
import { absolutizeImports } from '../internal-transformers/absolutizeImports';
import { makeBeansStatic } from '../internal-transformers/makeBeansStatic';
import { getImportsForFactory } from './getImportsForFactory';
import { addImportsInFactory } from '../internal-transformers/addImportsInFactory';
import { replaceParametersWithConstants } from '../internal-transformers/replaceParametersWithConstants';

let initialized = false;

export function createFactories(): void {
    if (initialized) {
        return;
    }

    initialized = true;
    fs.rmdirSync(getFactoriesListPath(), { recursive: true });
    fs.mkdirSync(getFactoriesListPath());

    const program = ProgramRepository.program;
    const typeChecker: ts.TypeChecker = program.getTypeChecker();
    const printer = ts.createPrinter();

    diConfigRepository.forEach(filePath => {
        const path = filePath as ts.Path;
        const sourceFile = program.getSourceFileByPath(path);

        if (sourceFile === undefined) {
            throw new Error(`SourceFile not found, path ${path}`);
        }

        const factoryId = FactoryIdRepository.getFactoryId(filePath);
        const imports = getImportsForFactory(factoryId);

        const newSourceFile = ts.transform(sourceFile, [
            absolutizeImports(filePath),
            makeBeansStatic,
            addImportsInFactory(imports),
            replaceParametersWithConstants(typeChecker, factoryId)
        ]);

        fs.writeFileSync(getFactoryPath(factoryId), printer.printFile(newSourceFile.transformed[0]));
    });
}