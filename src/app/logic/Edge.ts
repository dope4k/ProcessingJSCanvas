import * as p5 from 'p5';
import { Vector } from 'p5';
import Node from './Node';

export default class Edge {
  static __counter = 0;

  id: number;

  start: Node;
  end: Node;

  edgeWidth: number = 5;

  isDragging: boolean = false;
  disabled = false;

  isVertical: boolean;
  isHorizontal: boolean;

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

  get center() {
    return new Vector(
      (this.end.x + this.start.x) / 2,
      (this.end.y + this.start.y) / 2
    );
  }

  constructor(pointA: Node, pointB: Node) {
    this.isVertical = pointA.x === pointB.x;
    this.isHorizontal = pointA.y === pointB.y;
    if (this.isHorizontal) {
      const check = pointA.x < pointB.x;
      this.start = check ? pointA : pointB;
      this.end = check ? pointB : pointA;
    } else if (this.isVertical) {
      const check = pointA.y < pointB.y;
      this.start = check ? pointA : pointB;
      this.end = check ? pointB : pointA;
    } else {
      throw 'Lines can only be Horizontal or Vertical';
    }
    this.id = Edge.__counter++;
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

  private pointOnLine(point: Vector): boolean {
    if (this.isHorizontal) {
      if (
        point.x >= Math.min(this.start.x, this.end.x) &&
        point.x <= Math.max(this.start.x, this.end.x) &&
        point.y >= this.start.y - this.edgeWidth &&
        point.y <= this.start.y + this.edgeWidth
      ) {
        return true;
      }
    } else if (this.isVertical) {
      if (
        point.y >= Math.min(this.start.y, this.end.y) &&
        point.y <= Math.max(this.start.y, this.end.y) &&
        point.x >= this.start.x - this.edgeWidth &&
        point.x <= this.start.x + this.edgeWidth
      ) {
        return true;
      }
    }
    return false;
  }

  Equal(rhs: Edge) {
    return this.start.Equal(rhs.start) && this.end.Equal(rhs.end);
  }

  onMousePressed(ctx: p5) {
    if (this.disabled) return false;
    const mouseClick = new Vector(ctx.mouseX, ctx.mouseY);
    if (this.pointOnLine(mouseClick)) {
      this.isDragging = true;
      return true;
    }
    return false;
  }
  onMouseDragged(ctx: p5) {
    if (this.disabled) return;
    const mouseClick = new Vector(ctx.mouseX, ctx.mouseY);
    if (this.isDragging) {
      let movement: number = 0;
      if (this.isVertical) {
        movement = mouseClick.x;
        if (this.start.rightEdge && mouseClick.x > this.x1) {
          const otherEnd = this.start.rightEdge.end;
          if (mouseClick.x > otherEnd.x - otherEnd.radius)
            movement = otherEnd.x - otherEnd.radius;
        } else if (this.start.leftEdge && mouseClick.x < this.x1) {
          const otherEnd = this.start.leftEdge.start;
          if (mouseClick.x < otherEnd.x + otherEnd.radius)
            movement = otherEnd.x + otherEnd.radius;
        }
        if (movement != 0) {
          this.x1 = this.x2 = movement;
          this.recursiveMove(this);
        }
      } else if (this.isHorizontal) {
        movement = mouseClick.y;
        if (this.start.topEdge && mouseClick.y < this.y1) {
          const otherEnd = this.start.topEdge.start;
          if (mouseClick.y < otherEnd.y + otherEnd.radius)
            movement = otherEnd.y + otherEnd.radius;
        } else if (this.start.bottomEdge && mouseClick.y > this.y1) {
          const otherEnd = this.start.bottomEdge.end;
          if (mouseClick.y > otherEnd.y - otherEnd.radius)
            movement = otherEnd.y - otherEnd.radius;
        }
        if (movement != 0) {
          this.y1 = this.y2 = movement;
          this.recursiveMove(this);
        }
      }
    }
  }
  onMouseReleased(ctx: p5) {
    if (this.disabled) return;
    this.isDragging = false;
  }

  Draw(ctx: p5, color = [0, 0, 0, 255]) {
    if (this.disabled) return;

    if (color && color.length == 4)
      ctx.stroke(color[0], color[1], color[2], color[3]);
    else if (this.isDragging) ctx.stroke(128, 128, 128, 255);
    else ctx.stroke(0, 0, 0, 255);

    ctx.strokeWeight(this.edgeWidth);
    ctx.line(this.start.x, this.start.y, this.end.x, this.end.y);
  }
}
