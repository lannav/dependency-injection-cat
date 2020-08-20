import { IGraph } from './IGraph';
import { TGraphEntity } from './TGraphEntity';

export class Graph implements IGraph {
    protected _graph: TGraphEntity = {};

    get g(): Readonly<TGraphEntity> {
        return this._graph;
    }

    addNode(node: string): void {
        if (!this.hasNode(node)) {
            this._graph[node] = [];
        }
    }

    hasNode(node: string): boolean {
        return this.g.hasOwnProperty(node);
    }

    addEdges(node: string, ...edges: Array<string>): void {
        this.addNode(node);

        const nodeEdges = this._graph[node] || [];

        edges.forEach(edge => {
            this.addNode(edge);

            if (!nodeEdges.includes(edge)) {
                nodeEdges.push(edge);
            }
        });
    }

    hasEdges(node: string): boolean {
        const list = this.g[node] || [];

        return list.length > 0;
    }

    getEdges(node: string): Array<string> {
        return this.g[node] || [];
    }

    clearGraph(): void {
        this._graph = {};
    }
}