import * as p5 from 'p5';
import { Vector } from 'p5';
import Context, { ContextObject } from '../Base/Context';
import OnMouseButton from '../Base/Events/OnMouseButton';
import OnMouseMove from '../Base/Events/OnMouseMove';
import Renderer, { Renderable } from '../Base/Renderer';
import Node from '../Components/Node';

export default class SelectionTool
  implements ContextObject, Renderable, OnMouseButton, OnMouseMove
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
      if (this.dragStart && !this.dragEnd) {
        Context.context?.OnSelection();
      }
      this.dragStart = undefined;
      this.dragEnd = undefined;
      this.selectionID++;
      Renderer.Render();
    }
    return true;
  }
  OnMouseMove(position: p5.Vector, button?: string | undefined): void {
    if (this.dragStart) {
      this.dragEnd = position;
      Context.context?.OnSelection(this);
      Renderer.Render();
    }
  }
  Render(ctx: p5): void {
    if (this.dragStart && this.dragEnd) {
      ctx.strokeWeight(1);
      ctx.fill(0, 0, 0, 0);
      ctx.stroke(0, 0, 0, 255);
      ctx.rect(
        this.dragStart.x,
        this.dragStart.y,
        this.dragEnd.x - this.dragStart.x,
        this.dragEnd.y - this.dragStart.y
      );
    }
  }
}
