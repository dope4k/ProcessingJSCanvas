import { Vector } from 'p5';

export default interface OnMouseButton {
  OnMouseButton(
    position: Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ): boolean | null;
}
