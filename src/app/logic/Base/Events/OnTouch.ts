export interface Touch {
  x: number;
  y: number;
  id: number;
}
export default interface OnTouch {
  OnTouch(touches: Touch[], state: 'STARTED' | 'MOVED' | 'ENDED'): boolean;
}
