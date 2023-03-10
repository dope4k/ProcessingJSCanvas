import { Vector } from 'p5';

export interface Collidable {
  bbox: number[];
  collider: Collider;
}

export default class Collider {
  object: Collidable;

  constructor(obj: Collidable) {
    this.object = obj;
  }

  static PointCollision(point: Vector, bbox: number[]) {
    return (
      bbox[0] <= point.x &&
      bbox[1] <= point.y &&
      bbox[2] >= point.x &&
      bbox[3] >= point.y
    );
  }

  PointCollision(point: Vector): boolean {
    return Collider.PointCollision(point, this.object.bbox);
  }

  PointCollisionCircle(point: Vector, radius: number): boolean {
    const bbox = this.object.bbox;
    return (
      Math.sqrt((bbox[0] - point.x) ** 2 + (bbox[1] - point.y) ** 2) <= radius
    );
  }
}
