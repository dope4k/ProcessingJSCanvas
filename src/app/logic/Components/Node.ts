import * as p5 from 'p5';
import { Vector } from 'p5';
import Collider, { Collidable } from '../Base/Collider';
import Context, { ContextObject } from '../Base/Context';
import { Renderable } from '../Base/Renderer';
import Edge from './Edge';
import Table from './Table';

export default class Node implements Renderable, Collidable {
  zIndex: number = 0;

  point: Vector;
  radius: number;

  topEdge?: Edge = undefined;
  bottomEdge?: Edge = undefined;
  rightEdge?: Edge = undefined;
  leftEdge?: Edge = undefined;

  collider: Collider;

  table: Table;

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

  constructor(table: Table, x: number, y: number, radius: number = 5) {
    this.point = new Vector(x, y);
    this.table = table;
    this.radius = radius;
    this.collider = new Collider(this);
  }

  Bbox(): number[] {
    return [
      this.x - this.radius,
      this.y - this.radius,
      this.x + this.radius,
      this.y + this.radius,
    ];
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

  MoveX(x: number) {
    this.x = x;
    for (
      let currentEdge = this.topEdge;
      !!currentEdge;
      currentEdge = currentEdge?.start.topEdge
    ) {
      currentEdge.x1 = currentEdge.x2 = x;
    }
    for (
      let currentEdge = this.bottomEdge;
      !!currentEdge;
      currentEdge = currentEdge?.end.bottomEdge
    ) {
      currentEdge.x1 = currentEdge.x2 = x;
    }
  }
  MoveY(y: number) {
    this.y = y;
    for (
      let currentEdge = this.leftEdge;
      !!currentEdge;
      currentEdge = currentEdge?.start.leftEdge
    ) {
      currentEdge.y1 = currentEdge.y2 = y;
    }
    for (
      let currentEdge = this.rightEdge;
      !!currentEdge;
      currentEdge = currentEdge?.end.rightEdge
    ) {
      currentEdge.y1 = currentEdge.y2 = y;
    }
  }

  InFocusNode() {
    return (
      this.topEdge?.selected ||
      this.bottomEdge?.selected ||
      this.rightEdge?.selected ||
      this.leftEdge?.selected
    );
  }
  ComplexNode() {
    if (this.topEdge?.disabled && this.leftEdge?.disabled) return true;
    else if (this.topEdge?.disabled && this.rightEdge?.disabled) return true;
    else if (this.bottomEdge?.disabled && this.leftEdge?.disabled) return true;
    else if (this.bottomEdge?.disabled && this.rightEdge?.disabled) return true;
    return false;
  }
  BoundaryNode() {
    let count = 0;
    if (!this.topEdge) ++count;
    if (!this.bottomEdge) ++count;
    if (!this.leftEdge) ++count;
    if (!this.rightEdge) ++count;
    return count >= 2;
  }

  IsDissolvableHorizontal() {
    let check = true;
    if (this.rightEdge?.disabled && this.leftEdge?.disabled) {
      for (
        let edge: Node | undefined = this.leftEdge?.start;
        edge !== undefined && check;
        edge = edge.leftEdge?.start
      ) {
        check = !(
          edge.rightEdge?.disabled === false ||
          edge.leftEdge?.disabled === false
        );
      }
      for (
        let edge: Node | undefined = this.rightEdge?.end;
        edge !== undefined && check;
        edge = edge.rightEdge?.end
      ) {
        check = !(
          edge.rightEdge?.disabled === false ||
          edge.leftEdge?.disabled === false
        );
      }
    } else return false;
    return check;
  }
  IsDissolvableVertical() {
    let check = true;
    if (this.topEdge?.disabled && this.bottomEdge?.disabled) {
      for (
        let edge: Node | undefined = this.topEdge?.start;
        edge !== undefined && check;
        edge = edge.topEdge?.start
      ) {
        check = !(
          edge.topEdge?.disabled === false ||
          edge.bottomEdge?.disabled === false
        );
      }
      for (
        let edge: Node | undefined = this.bottomEdge?.end;
        edge !== undefined && check;
        edge = edge.bottomEdge?.end
      ) {
        check = !(
          edge.topEdge?.disabled === false ||
          edge.bottomEdge?.disabled === false
        );
      }
    } else return false;
    return check;
  }
  DissolveVertical() {
    if (
      (this.topEdge === undefined || this.topEdge?.disabled) &&
      (this.bottomEdge === undefined || this.bottomEdge?.disabled)
    ) {
      if (this.leftEdge && this.rightEdge) {
        this.leftEdge.end = this.rightEdge.end;
        this.rightEdge.end.leftEdge = this.leftEdge;
        Context.context?.RemoveObject(this.rightEdge.id);
        this.table.RemoveEdge(this.rightEdge);
        if (this.topEdge) {
          Context.context?.RemoveObject(this.topEdge.id);
          this.table.RemoveEdge(this.topEdge);
        }
        if (this.bottomEdge) {
          Context.context?.RemoveObject(this.bottomEdge.id);
          this.table.RemoveEdge(this.bottomEdge);
        }

        this.leftEdge = this.rightEdge = undefined;
        this.topEdge?.start.DissolveVertical();
        this.bottomEdge?.end.DissolveVertical();
        this.table.RemoveNode(this);
      }
    }
  }
  DissolveHorizontal() {
    if (
      (this.rightEdge === undefined || this.rightEdge?.disabled) &&
      (this.leftEdge === undefined || this.leftEdge?.disabled)
    ) {
      if (this.topEdge && this.bottomEdge) {
        this.topEdge.end = this.bottomEdge.end;
        this.bottomEdge.end.topEdge = this.topEdge;
        Context.context?.RemoveObject(this.bottomEdge.id);
        this.table.RemoveEdge(this.bottomEdge);
        if (this.rightEdge) {
          Context.context?.RemoveObject(this.rightEdge.id);
          this.table.RemoveEdge(this.rightEdge);
        }
        if (this.leftEdge) {
          Context.context?.RemoveObject(this.leftEdge.id);
          this.table.RemoveEdge(this.leftEdge);
        }
        this.topEdge = this.bottomEdge = undefined;
        this.leftEdge?.start.DissolveHorizontal();
        this.rightEdge?.end.DissolveHorizontal();
        this.table.RemoveNode(this);
      }
    }
  }
  Dissolve() {
    if (this.IsDissolvableHorizontal()) {
      this.DissolveHorizontal();
    } else if (this.IsDissolvableVertical()) {
      this.DissolveVertical();
    }
  }

  Render(ctx: p5): void {
    ctx.stroke(0, 255, 0, 255);
    ctx.strokeWeight(this.radius * 2);
    ctx.point(this.point.x, this.point.y);
  }
}
