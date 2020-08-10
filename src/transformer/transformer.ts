import * as ts from 'typescript';
import { initTransformerConfig, ITransformerConfig } from '../transformer-config';
import { initDiConfigRepository } from '../di-config-repository';
import { registerTypes } from '../type-register/registerTypes';
import { registerDependencies } from '../types-dependencies-register/registerDependencies';
import { ProgramRepository } from '../program/ProgramRepository';
import { createFactories } from '../factories/createFactories';
import { ShouldReinitializeRepository } from './ShouldReinitializeRepository';
import { PathResolver } from '../paths-resolver/PathResolver';
import { TypeRegisterRepository } from '../type-register/TypeRegisterRepository';
import { isContainerGetCall } from '../container/isContainerGetCall';

const transformer = (program: ts.Program, config?: ITransformerConfig): ts.TransformerFactory<ts.SourceFile> => {
    initTransformerConfig(config);
    initDiConfigRepository();
    ProgramRepository.initProgram(program);
    PathResolver.init();
    registerTypes();
    console.log(TypeRegisterRepository.repository)
    registerDependencies();
    createFactories();
    ShouldReinitializeRepository.value = false;

    return context => {
        return sourceFile => {
            const visitor: ts.Visitor = (node: ts.Node) => {
                if (isContainerGetCall(program.getTypeChecker(), node)) {
                    return node;
                }

                return ts.visitEachChild(node, visitor, context);
            };
            return ts.visitNode(sourceFile, visitor);
        };
    };
}

export default transformer;
