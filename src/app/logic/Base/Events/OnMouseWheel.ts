import { Vector } from 'p5';
export default interface OnMouseWheel {
  OnMouseWheel(position: Vector, scroll: number): void;
}
