import { BeanRepository } from '../bean/BeanRepository';
import { BeanDependenciesRepository } from '../bean-dependencies/BeanDependenciesRepository';
import { CompilationContext } from '../../compilation-context/CompilationContext';
import { DependencyGraph } from './DependencyGraph';
import { GLOBAL_CONTEXT_NAME } from '../context/constants';

export const buildDependencyGraphAndFillQualifiedBeans = () => {
    BeanRepository.beanDescriptorRepository.forEach((beansMap, contextName) => {
        const beanDependenciesMap = BeanDependenciesRepository.getBeanDescriptorMapByContextName(contextName);

        if (beanDependenciesMap === null) {
            return;
        }

        beansMap.forEach((beanDescriptors, beanType) => {
            beanDescriptors.forEach(beanDescriptor => {
                const dependencies = beanDependenciesMap.get(beanDescriptor) ?? null;

                if (dependencies === null || dependencies.length === 0) {
                    return;
                }

                dependencies.forEach(dependencyDescriptor => {
                    let beanCandidatesFromCurrentContext = beansMap.get(dependencyDescriptor.type) ?? [];
                    let beanCandidatesFromGlobalContext = BeanRepository.beanDescriptorRepository
                        .get(GLOBAL_CONTEXT_NAME)?.get(dependencyDescriptor.type) ?? [];

                    if (dependencyDescriptor.qualifier !== null) {
                        beanCandidatesFromCurrentContext = beanCandidatesFromCurrentContext
                            .filter(it => it.classMemberName === dependencyDescriptor.qualifier);
                        beanCandidatesFromGlobalContext = beanCandidatesFromGlobalContext
                            .filter(it => it.classMemberName === dependencyDescriptor.qualifier);
                    }

                    if (beanCandidatesFromCurrentContext.length === 0 && beanCandidatesFromGlobalContext.length === 0) {
                        CompilationContext.reportError({
                            node: dependencyDescriptor.node,
                            message: 'Bean for dependency is not registered',
                        });
                        return;
                    }

                    if (beanCandidatesFromCurrentContext.length === 1) {
                        dependencyDescriptor.qualifiedBean = beanCandidatesFromCurrentContext[0];
                        DependencyGraph.addNodeWithEdges(beanDescriptor, beanCandidatesFromCurrentContext[0]);
                        return;
                    }

                    if (beanCandidatesFromCurrentContext.length > 1) {
                        CompilationContext.reportErrorWithMultipleNodes({
                            nodes: [
                                dependencyDescriptor.node,
                                ...beanCandidatesFromCurrentContext.map(it => it.node),
                            ],
                            message: `Found ${beanCandidatesFromCurrentContext.length} Bean candidates, please use @Qualifier to specify which Bean should be injected`,
                        });
                        return;
                    }

                    if (beanCandidatesFromGlobalContext.length === 1) {
                        dependencyDescriptor.qualifiedBean = beanCandidatesFromGlobalContext[0];
                        DependencyGraph.addNodeWithEdges(beanDescriptor, beanCandidatesFromGlobalContext[0]);
                        return;
                    }

                    if (beanCandidatesFromGlobalContext.length > 1) {
                        CompilationContext.reportErrorWithMultipleNodes({
                            nodes: [
                                dependencyDescriptor.node,
                                ...beanCandidatesFromGlobalContext.map(it => it.node),
                            ],
                            message: `Found ${beanCandidatesFromGlobalContext.length} Bean candidates in Global context, please use @Qualifier to specify which Bean should be injected`,
                        });
                        return;
                    }
                });
            });
        });
    });
};
