import * as p5 from 'p5';
import Collider, { BBOX, Collidable } from '../Base/Collider';
import Context, { ContextObject } from '../Base/Context';
import OnKey from '../Base/Events/OnKey';
import OnMouseButton from '../Base/Events/OnMouseButton';
import OnMouseMove from '../Base/Events/OnMouseMove';
import { Renderable } from '../Base/Renderer';
import Node from './Node';

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

  id: number;

  start: Node;
  end: Node;

  edgeWidth: number;
  color: number[];
  highlightColor: number[];

  isClickHold: boolean = false;
  selected: boolean = false;

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

  constructor(
    nodeA: Node,
    nodeB: Node,
    edgeWidth: number = 5,
    color = [0, 0, 0, 255],
    highlightColor = [128, 128, 128, 255]
  ) {
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

  private recursiveMove(edge: Edge) {
    let currentEdge: Edge | undefined = edge;
    if (edge.isVertical) {
      while ((currentEdge = currentEdge.start.topEdge))
        currentEdge.x1 = currentEdge.x2 = edge.x1;
      currentEdge = edge;
      while ((currentEdge = currentEdge.end.bottomEdge))
        currentEdge.x1 = currentEdge.x2 = edge.x1;
    } else if (edge.isHorizontal) {
      while ((currentEdge = currentEdge.start.leftEdge))
        currentEdge.y1 = currentEdge.y2 = edge.y1;
      currentEdge = edge;
      while ((currentEdge = currentEdge.end.rightEdge))
        currentEdge.y1 = currentEdge.y2 = edge.y1;
    }
  }

  OnContextInit(ctx: Context): void {}

  Bbox(): BBOX {
    if (this.isVertical) {
      return {
        start: { x: this.start.x - this.edgeWidth, y: this.start.y },
        end: { x: this.end.x + this.edgeWidth, y: this.end.y },
      };
    } else {
      return {
        start: { x: this.start.x, y: this.start.y - this.edgeWidth },
        end: { x: this.end.x, y: this.end.y + this.edgeWidth },
      };
    }
  }

  OnMouseButton(
    position: p5.Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ): boolean {
    if (button === 'left' && state === 'PRESSED') {
      if (this.collider.PointCollision(position)) {
        this.selected = true;
        this.isClickHold = true;
      } else if (!this.isCTRLPressed) this.selected = false;
    }
    if (state === 'RELEASED') {
      this.isClickHold = false;
    }
    return true;
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
        if (movement != 0) {
          this.x1 = this.x2 = movement;
          this.recursiveMove(this);
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
        if (movement != 0) {
          this.y1 = this.y2 = movement;
          this.recursiveMove(this);
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
    ctx.strokeCap('square');

    ctx.line(this.start.x, this.start.y, this.end.x, this.end.y);
  }
}
