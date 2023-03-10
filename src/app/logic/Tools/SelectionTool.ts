import * as p5 from 'p5';
import { Vector } from 'p5';
import Context, { ContextObject } from '../Base/Context';
import OnMouseButton from '../Base/Events/OnMouseButton';
import OnMouseMove from '../Base/Events/OnMouseMove';
import OnTouch, { Touch } from '../Base/Events/OnTouch';
import Renderer, { Renderable } from '../Base/Renderer';
import Node from '../Components/Node';

export default class SelectionTool
  implements ContextObject, Renderable, OnMouseButton, OnMouseMove, OnTouch
{
  zIndex: number = 10;

  id: number;

  dragStart?: Vector;
  dragEnd?: Vector;

  selectionID: number = 0;

  constructor() {
    this.id = Context.id;
  }

  InSelection(topLeft: Vector, bottomRight: Vector) {
    if (this.dragStart && this.dragEnd) {
      let startPoint: Vector;
      let endPoint: Vector;
      if (
        this.dragStart.x <= this.dragEnd.x &&
        this.dragStart.y <= this.dragEnd.y
      ) {
        startPoint = this.dragStart;
        endPoint = this.dragEnd;
      } else if (
        this.dragStart.x <= this.dragEnd.x &&
        this.dragStart.y >= this.dragEnd.y
      ) {
        startPoint = new Vector(this.dragStart.x, this.dragEnd.y);
        endPoint = new Vector(this.dragEnd.x, this.dragStart.y);
      } else if (
        this.dragStart.x >= this.dragEnd.x &&
        this.dragStart.y <= this.dragEnd.y
      ) {
        startPoint = new Vector(this.dragEnd.x, this.dragStart.y);
        endPoint = new Vector(this.dragStart.x, this.dragEnd.y);
      } else {
        startPoint = this.dragEnd;
        endPoint = this.dragStart;
      }
      return (
        topLeft.x < endPoint.x &&
        bottomRight.x > startPoint.x &&
        topLeft.y < endPoint.y &&
        bottomRight.y > startPoint.y
      );
    }
    return false;
  }

  OnMouseButton(
    position: p5.Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ): boolean {
    if (button === 'left' && state === 'PRESSED') {
      this.dragStart = position;
      Renderer.Render();
    } else if (state === 'RELEASED') {
      if (this.dragStart) {
        if (this.dragEnd) {
          this.dragStart = undefined;
          this.dragEnd = undefined;
          this.selectionID++;
          Renderer.Render();
        } else {
          Context.context.OnSelection();
        }
      }
    }
    return true;
  }
  OnMouseMove(position: p5.Vector, button?: string | undefined): void {
    if (this.dragStart) {
      this.dragEnd = position;
      Context.context.OnSelection(this);
      Renderer.Render();
    }
  }
  OnTouch(touches: Touch[], state: 'STARTED' | 'MOVED' | 'ENDED'): boolean {
    if (touches.length === 1) {
      const touchPosition = new Vector(touches[0].x, touches[0].y);
      if (state === 'STARTED') {
        return this.OnMouseButton(touchPosition, 'left', 'PRESSED');
      } else if (state === 'MOVED') {
        this.OnMouseMove(touchPosition, 'left');
      }
    }
    return true;
  }
  Render(ctx: p5): void {
    if (this.dragStart && this.dragEnd) {
      ctx.strokeWeight(1);
      ctx.fill(0, 0, 0, 0);
      ctx.stroke(0, 0, 0, 255);
      Context.canvas.setLineDash([5, 5]);
      ctx.rect(
        this.dragStart.x,
        this.dragStart.y,
        this.dragEnd.x - this.dragStart.x,
        this.dragEnd.y - this.dragStart.y
      );
      Context.canvas.setLineDash([0, 0]);
    }
  }
}
