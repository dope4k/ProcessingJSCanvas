import * as p5 from 'p5';
import Context, { ContextObject } from '../Base/Context';
import { Renderable } from '../Base/Renderer';
import Edge from './Edge';
import Node from './Node';

export default class Table implements ContextObject, Renderable {
  edges: Edge[];
  nodes: Node[];

  constructor() {
    this.edges = [];
    this.nodes = [];
  }

  OnContextInit(ctx: Context): void {
    for (const edge of this.edges) {
      ctx.AddObject(edge);
    }
  }

  private findNode(node: Node) {
    return this.nodes.find((n) => n.Equal(node));
  }
  private findEdge(edge: Edge) {
    return this.edges.find((e) => e.Equal(edge));
  }

  private addNode(node: Node) {
    const graphNode = this.findNode(node);
    if (graphNode) return graphNode;
    else this.nodes.push(node);
    return node;
  }

  private addEdge(edge: Edge) {
    const graphEdge = this.findEdge(edge);
    if (graphEdge) return graphEdge;
    else this.edges.push(edge);
    return edge;
  }

  AddLink(pointA: Node, pointB: Node) {
    pointA = this.addNode(pointA);
    pointB = this.addNode(pointB);
    const edge = new Edge(pointA, pointB);
    if (edge.isHorizontal) {
      edge.start.rightEdge = edge;
      edge.end.leftEdge = edge;
    } else if (edge.isVertical) {
      edge.start.bottomEdge = edge;
      edge.end.topEdge = edge;
    }
    this.addEdge(edge);
  }

  CreateTable(
    originX: number,
    originY: number,
    nRows: number,
    nCols: number,
    cellSize: number = 100
  ) {
    for (let i = originX; i < nRows * cellSize + originX; i += cellSize) {
      for (let j = originY; j < nCols * cellSize + originY; j += cellSize) {
        this.AddLink(new Node(i, j), new Node(i + cellSize, j));
        this.AddLink(
          new Node(i + cellSize, j),
          new Node(i + cellSize, j + cellSize)
        );
        this.AddLink(
          new Node(i, j + cellSize),
          new Node(i + cellSize, j + cellSize)
        );
        this.AddLink(new Node(i, j), new Node(i, j + cellSize));
      }
    }
  }

  Render(ctx: p5): void {}
}
