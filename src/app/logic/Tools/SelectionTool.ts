import * as p5 from 'p5';
import Context, { ContextObject } from '../Base/Context';
import OnMouseButton from '../Base/Events/OnMouseButton';
import OnMouseWheel from '../Base/Events/OnMouseWheel';
import { Renderable } from '../Base/Renderer';
import { Vector } from 'p5';
import OnMouseMove from '../Base/Events/OnMouseMove';
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
    if (button === 'left' && state === 'PRESSED') this.dragStart = position;
    else if (state === 'RELEASED') this.dragStart = undefined; //TODO: Find all objects selected by tool
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
