import * as p5 from 'p5';
import { Vector } from 'p5';
import Edge from './Edge';
import Node from './Node';

export default class Table {
  edges: Edge[] = [];
  nodes: Node[] = [];

  selection: Set<number> = new Set<number>();

  constructor() {
    this.edges = [];
    this.nodes = [];
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

  FindNode(node: Node) {
    return this.nodes.find((n) => n.Equal(node));
  }
  FindEdge(edge: Edge) {
    return this.edges.find((e) => e.Equal(edge));
  }

  AddLink(pointA: Node, pointB: Node) {
    pointA = this.AddNode(pointA);
    pointB = this.AddNode(pointB);
    const edge = new Edge(pointA, pointB);
    if (edge.isHorizontal) {
      edge.start.rightEdge = edge;
      edge.end.leftEdge = edge;
    } else if (edge.isVertical) {
      edge.start.bottomEdge = edge;
      edge.end.topEdge = edge;
    }
    this.AddEdge(edge);
  }

  AddNode(node: Node) {
    const graphNode = this.FindNode(node);
    if (graphNode) return graphNode;
    else this.nodes.push(node);
    return node;
  }

  AddEdge(edge: Edge) {
    const graphEdge = this.FindEdge(edge);
    if (graphEdge) return graphEdge;
    else this.edges.push(edge);
    return edge;
  }

  ClearSelection() {
    this.selection.clear();
  }

  SelectEdges(boxStart: Vector, boxEnd: Vector) {
    let selectionCount = 0;
    this.edges.forEach((e) => {
      const center = e.center;
      if (
        boxStart.x <= center.x &&
        boxStart.y <= center.y &&
        boxEnd.x >= center.x &&
        boxEnd.y >= center.y
      ) {
        selectionCount++;
        if (this.selection.has(e.id)) this.selection.delete(e.id);
        else this.selection.add(e.id);
      }
    });
    return selectionCount;
  }

  onMousePressed(ctx: p5) {
    let check = true;
    for (const edge of this.edges) {
      if (edge.onMousePressed(ctx)) {
        check = false;
        this.selection = new Set<number>([edge.id]);
        break;
      }
    }
    return !check;
  }
  onMouseDragged(ctx: p5) {
    this.edges.forEach((e) => e.onMouseDragged(ctx));
  }
  onMouseReleased(ctx: p5) {
    this.edges.forEach((e) => e.onMouseReleased(ctx));
  }
  onKeyPress(ctx: p5) {
    if (ctx.key == 'Delete') {
      this.edges.forEach((e) => {
        if (this.selection.has(e.id)) {
          if (e.isVertical && e.start.leftEdge && e.start.rightEdge) {
            e.disabled = true;
          } else if (e.isHorizontal && e.start.topEdge && e.end.bottomEdge) {
            e.disabled = true;
          }
        }
      });
    }
  }

  Draw(ctx: p5) {
    for (const link of this.edges) {
      if (this.selection.has(link.id)) link.Draw(ctx, [128, 127, 128, 255]);
      else link.Draw(ctx);
    }
    for (const node of this.nodes) {
      node.Draw(ctx);
    }
  }
}
