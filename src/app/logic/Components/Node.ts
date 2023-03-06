import * as p5 from 'p5';
import { Vector } from 'p5';
import Context, { ContextObject } from '../Base/Context';
import { Renderable } from '../Base/Renderer';
import Edge from './Edge';
export default class Node implements Renderable {
  point: Vector;
  radius: number;

  topEdge?: Edge = undefined;
  bottomEdge?: Edge = undefined;
  rightEdge?: Edge = undefined;
  leftEdge?: Edge = undefined;

  get x() {
    return this.point.x;
  }
  get y() {
    return this.point.y;
  }
  set x(val: number) {
    this.point.x = val;
  }
  set y(val: number) {
    this.point.y = val;
  }

  constructor(x: number, y: number, radius: number = 7) {
    this.point = new Vector(x, y);
    this.radius = radius;
  }

  AddEdge(edge: Edge) {
    if (edge.isVertical) {
      if (edge.start.Equal(this)) {
        if (this.x < edge.end.x) {
          this.rightEdge = edge;
        } else if (this.x > edge.end.x) {
          this.leftEdge = edge;
        }
      } else {
        if (this.x < edge.start.x) {
          this.rightEdge = edge;
        } else if (this.x > edge.start.x) {
          this.leftEdge = edge;
        }
      }
    } else if (edge.isHorizontal) {
      if (edge.start.Equal(this)) {
        if (this.y < edge.end.y) {
          this.topEdge = edge;
        } else if (this.y > edge.end.y) {
          this.bottomEdge = edge;
        }
      } else {
        if (this.y < edge.start.y) {
          this.topEdge = edge;
        } else if (this.y > edge.start.y) {
          this.bottomEdge = edge;
        }
      }
    }
  }

  Equal(rhs: Node) {
    return this.x === rhs.x && this.y === rhs.y;
  }

  Render(ctx: p5): void {
    ctx.stroke(0, 255, 0, 255);
    ctx.strokeWeight(this.radius * 2);
    ctx.point(this.point.x, this.point.y);
  }
}
