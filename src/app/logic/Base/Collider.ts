import { Vector } from 'p5';

export interface Collidable {
  collider: Collider;
  Bbox(): number[];
}

export default class Collider {
  object: Collidable;

  constructor(obj: Collidable) {
    this.object = obj;
  }

  PointCollision(point: Vector): boolean {
    const bbox = this.object.Bbox();
    return (
      bbox[0] <= point.x &&
      bbox[1] <= point.y &&
      bbox[2] >= point.x &&
      bbox[3] >= point.y
    );
  }
}
