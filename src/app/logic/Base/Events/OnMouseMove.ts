import { Vector } from 'p5';

export default interface OnMouseMove {
  OnMouseMove(position: Vector, button?: string): void;
}
