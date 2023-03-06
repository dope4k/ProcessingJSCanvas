import * as p5 from 'p5';
import { Vector } from 'p5';
import Context, { ContextObject } from '../Base/Context';
import OnMouseButton from '../Base/Events/OnMouseButton';
import OnMouseMove from '../Base/Events/OnMouseMove';
import { Renderable } from '../Base/Renderer';

export interface Selectable {}

export default class SelectionTool
  implements ContextObject, Renderable, OnMouseButton, OnMouseMove
{
  dragStart?: Vector;
  dragEnd?: Vector;

  OnContextInit(ctx: Context): void {}
  OnMouseButton(
    position: p5.Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ): boolean {
    if (button === 'left' && state === 'PRESSED') {
      this.dragStart = position;
    } else if (state === 'RELEASED') {
      //TODO: Find all objects selected by tool
      this.dragStart = undefined;
      this.dragEnd = undefined;
    }
    return true;
  }
  OnMouseMove(position: p5.Vector, button?: string | undefined): void {
    if (this.dragStart) {
      this.dragEnd = position;
    }
  }
  Render(ctx: p5): void {
    if (this.dragStart && this.dragEnd) {
      ctx.strokeWeight(2);
      ctx.fill(0, 0, 0, 0);
      ctx.rect(
        this.dragStart.x,
        this.dragStart.y,
        this.dragEnd.x - this.dragStart.x,
        this.dragEnd.y - this.dragStart.y
      );
    }
  }
}
