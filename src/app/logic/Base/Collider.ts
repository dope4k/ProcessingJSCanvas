import { Vector } from 'p5';

export interface BBOXPoint {
  x: number;
  y: number;
}

export interface BBOX {
  start: BBOXPoint;
  end: BBOXPoint;
}

export interface Collidable {
  collider: Collider;
  Bbox(): BBOX;
}

export default class Collider {
  object: Collidable;

  constructor(obj: Collidable) {
    this.object = obj;
  }

  PointCollision(point: Vector): boolean {
    const bbox = this.object.Bbox();
    return (
      bbox.start.x <= point.x &&
      bbox.start.y <= point.y &&
      bbox.end.x >= point.x &&
      bbox.end.y >= point.y
    );
  }
}
