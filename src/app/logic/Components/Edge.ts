import * as p5 from 'p5';
import { Vector } from 'p5';
import Collider, { Collidable } from '../Base/Collider';
import Context, { ContextObject } from '../Base/Context';
import OnKey from '../Base/Events/OnKey';
import OnMouseButton from '../Base/Events/OnMouseButton';
import OnMouseMove from '../Base/Events/OnMouseMove';
import Renderer, { Renderable } from '../Base/Renderer';
import Node from './Node';
import Table from './Table';

export default class Edge
  implements
    ContextObject,
    Renderable,
    OnKey,
    OnMouseMove,
    OnMouseButton,
    Collidable
{
  collider: Collider;
  table: Table;

  id: number;

  start: Node;
  end: Node;

  edgeWidth: number;
  color: number[];
  highlightColor: number[];

  isClickHold: boolean = false;
  selected: boolean = false;
  isHover: boolean = false;

  isCTRLPressed = false;

  private __isVertical: boolean;
  private __isHorizontal: boolean;
  get isVertical() {
    return this.__isVertical;
  }
  get isHorizontal() {
    return this.__isHorizontal;
  }

  get x1() {
    return this.start.x;
  }
  set x1(val: number) {
    this.start.x = val;
  }
  get y1() {
    return this.start.y;
  }
  set y1(val: number) {
    this.start.y = val;
  }
  get x2() {
    return this.end.x;
  }
  set x2(val: number) {
    this.end.x = val;
  }
  get y2() {
    return this.end.y;
  }
  set y2(val: number) {
    this.end.y = val;
  }

  get length() {
    return Vector.dist(this.start.point, this.end.point);
  }

  constructor(
    table: Table,
    nodeA: Node,
    nodeB: Node,
    edgeWidth: number = 5,
    color = [0, 0, 0, 255],
    highlightColor = [128, 128, 128, 255]
  ) {
    this.table = table;
    this.collider = new Collider(this);

    this.__isVertical = nodeA.x === nodeB.x;
    this.__isHorizontal = nodeA.y === nodeB.y;
    if (this.isHorizontal) {
      const check = nodeA.x < nodeB.x;
      this.start = check ? nodeA : nodeB;
      this.end = check ? nodeB : nodeA;
    } else if (this.isVertical) {
      const check = nodeA.y < nodeB.y;
      this.start = check ? nodeA : nodeB;
      this.end = check ? nodeB : nodeA;
    } else {
      throw 'Edges can only be Horizontal or Vertical';
    }
    this.id = Context.id;

    this.color = color;
    this.highlightColor = highlightColor;
    this.edgeWidth = edgeWidth;
  }

  OnContextInit(ctx: Context): void {
    Renderer.Render();
  }

  Bbox(): number[] {
    if (this.isVertical) {
      return [
        this.start.x - this.edgeWidth,
        this.start.y,
        this.end.x + this.edgeWidth,
        this.end.y,
      ];
    } else {
      return [
        this.start.x,
        this.start.y - this.edgeWidth,
        this.end.x,
        this.end.y + this.edgeWidth,
      ];
    }
  }

  SplitEdge(n: number) {
    if (Number.isNaN(n) || n <= 0 || n >= 1) return;
    const splitPoint = Vector.lerp(this.start.point, this.end.point, n);
    console.log(splitPoint);
    const splitNode = this.table.AddNode(new Node(splitPoint.x, splitPoint.y));
    let newEdge = new Edge(this.table, splitNode, this.end);
    this.end = splitNode;
    newEdge = this.table.AddEdge(newEdge);
    if (this.isVertical) {
      splitNode.topEdge = this;
      splitNode.bottomEdge = newEdge;
      newEdge.end.topEdge = newEdge;
    } else if (this.isHorizontal) {
      splitNode.leftEdge = this;
      splitNode.rightEdge = newEdge;
      newEdge.end.leftEdge = newEdge;
    }
    Context.context?.AddObject(newEdge);
    return splitNode;
  }

  RecursiveSplit(n: number) {
    const newNode = this.SplitEdge(n);
    let currentEdge: Edge | undefined = this;
    if (this.isHorizontal) {
      let lastNode: Node | undefined = newNode;
      while ((currentEdge = currentEdge?.start.topEdge)) {
        const node = currentEdge.start.rightEdge?.SplitEdge(n);
        if (node && lastNode) {
          const edge = this.table.AddLink(node, lastNode);
          Context.context?.AddObject(edge);
          lastNode = node;
        }
      }
      lastNode = newNode;
      currentEdge = this.start.bottomEdge;
      do {
        const node = currentEdge?.end.rightEdge?.SplitEdge(n);
        if (node && lastNode) {
          const edge = this.table.AddLink(node, lastNode);
          Context.context?.AddObject(edge);
          lastNode = node;
        }
      } while ((currentEdge = currentEdge?.end.bottomEdge));
    } else if (this.isVertical) {
      let lastNode: Node | undefined = newNode;
      while ((currentEdge = currentEdge?.start.leftEdge)) {
        const node = currentEdge.start.bottomEdge?.SplitEdge(n);
        if (node && lastNode) {
          const edge = this.table.AddLink(node, lastNode);
          Context.context?.AddObject(edge);
          lastNode = node;
        }
      }
      lastNode = newNode;
      currentEdge = this.start.rightEdge;
      do {
        const node = currentEdge?.end.bottomEdge?.SplitEdge(n);
        if (node && lastNode) {
          const edge = this.table.AddLink(node, lastNode);
          Context.context?.AddObject(edge);
          lastNode = node;
        }
      } while ((currentEdge = currentEdge?.end.rightEdge));
    }
  }

  OnMouseButton(
    position: p5.Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ): boolean | null {
    if (button === 'center' && state === 'RELEASED') {
      if (this.collider.PointCollision(position)) {
        if (this.isVertical) {
          this.RecursiveSplit((position.y - this.y1) / (this.y2 - this.y1));
        } else if (this.isHorizontal) {
          this.RecursiveSplit((position.x - this.x1) / (this.x2 - this.x1));
        }
        Renderer.Render();
        return true;
      }
    } else if (button === 'left' && state === 'PRESSED') {
      if (this.collider.PointCollision(position)) {
        if (this.isVertical)
          Context.context?.canvas?.style('cursor', 'e-resize');
        else if (this.isHorizontal)
          Context.context?.canvas?.style('cursor', 'n-resize');
        this.selected = true;
        this.isClickHold = true;
        Renderer.Render();
        return true;
      } else if (!this.isCTRLPressed) {
        this.selected = false;
        Renderer.Render();
        return true;
      }
    } else if (state === 'RELEASED') {
      this.isClickHold = false;
      Context.context?.canvas?.style('cursor', 'default');
      Renderer.Render();
    }
    return null;
  }

  OnMouseMove(position: p5.Vector, button?: string | undefined): void {
    if (this.isClickHold) {
      let movement: number = 0;
      if (this.isVertical) {
        movement = position.x;
        if (this.start.rightEdge && position.x > this.x1) {
          const otherEnd = this.start.rightEdge.end;
          if (position.x > otherEnd.x - otherEnd.radius)
            movement = otherEnd.x - otherEnd.radius;
        } else if (this.start.leftEdge && position.x < this.x1) {
          const otherEnd = this.start.leftEdge.start;
          if (position.x < otherEnd.x + otherEnd.radius)
            movement = otherEnd.x + otherEnd.radius;
        }
        if (movement != 0 && this.x1 != movement) {
          this.start.MoveX(movement);
          Renderer.Render();
        }
      } else if (this.isHorizontal) {
        movement = position.y;
        if (this.start.topEdge && position.y < this.y1) {
          const otherEnd = this.start.topEdge.start;
          if (position.y < otherEnd.y + otherEnd.radius)
            movement = otherEnd.y + otherEnd.radius;
        } else if (this.start.bottomEdge && position.y > this.y1) {
          const otherEnd = this.start.bottomEdge.end;
          if (position.y > otherEnd.y - otherEnd.radius)
            movement = otherEnd.y - otherEnd.radius;
        }
        if (movement != 0 && this.y1 != movement) {
          this.start.MoveY(movement);
          Renderer.Render();
        }
      }
    }
  }

  OnKey(button: string, state: 'PRESSED' | 'RELEASED' | 'TYPED'): void {
    if (button === 'Control' && state === 'PRESSED') this.isCTRLPressed = true;
    else if (state === 'RELEASED') this.isCTRLPressed = false;
  }

  Equal(rhs: Edge) {
    return this.start.Equal(rhs.start) && this.end.Equal(rhs.end);
  }

  Render(ctx: p5): void {
    if (this.isClickHold || this.selected)
      ctx.stroke(
        this.highlightColor[0],
        this.highlightColor[1],
        this.highlightColor[2],
        this.highlightColor[3]
      );
    else ctx.stroke(this.color[0], this.color[1], this.color[2], this.color[3]);
    ctx.strokeWeight(this.edgeWidth);
    ctx.line(this.start.x, this.start.y, this.end.x, this.end.y);

    if (false) {
      ctx.strokeWeight(1);
      ctx.text(
        this.id.toString(),
        (this.end.x + this.start.x) / 2,
        (this.end.y + this.start.y) / 2
      );
    }
  }
}
