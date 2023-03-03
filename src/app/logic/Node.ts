import * as crypto from 'crypto-js';
import * as p5 from 'p5';
import { Vector } from 'p5';
import Edge from './Edge';

export default class Node {
  radius: number = 10;

  private point: Vector;
  isDragging: boolean = false;

  topEdge?: Edge = undefined;
  bottomEdge?: Edge = undefined;
  rightEdge?: Edge = undefined;
  leftEdge?: Edge = undefined;

  private _hash?: string;

  get x() {
    return this.point.x;
  }
  get y() {
    return this.point.y;
  }
  set x(val: number) {
    this.point.x = val;
    this._hash = undefined;
  }
  set y(val: number) {
    this.point.y = val;
    this._hash = undefined;
  }

  get hash() {
    if (this._hash) return this._hash;
    else return this.calculateHash();
  }

  constructor(x: number, y: number) {
    this.point = new Vector(x, y);
  }

  private calculateHash() {
    this._hash = crypto.MD5(`${this.x}${this.y}`).toString();
    return this._hash;
  }

  private containsXY(x: number, y: number) {
    return Vector.dist(new Vector(x, y), this.point) < this.radius;
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

  DistTo(point: Vector) {
    return Vector.dist(point, this.point);
  }

  onMousePressed(ctx: p5) {
    if (this.containsXY(ctx.mouseX, ctx.mouseY)) {
      this.isDragging = true;
    }
  }
  onMouseDragged(ctx: p5) {
    if (this.isDragging) {
      this.x = ctx.mouseX;
      this.y = ctx.mouseY;
    }
  }
  onMouseReleased(ctx: p5) {
    this.isDragging = false;
  }

  Equal(rhs: Node) {
    return this.x === rhs.x && this.y === rhs.y;
  }

  Draw(ctx: p5) {
    ctx.stroke(0, 255, 0, 255);
    ctx.strokeWeight(this.radius);
    ctx.point(this.x, this.y);
  }
}
