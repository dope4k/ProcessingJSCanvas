import * as p5 from 'p5';
import { Vector } from 'p5';
import Collider, { Collidable } from '../Base/Collider';
import Context, { ContextObject } from '../Base/Context';
import OnMouseButton from '../Base/Events/OnMouseButton';
import OnMouseMove from '../Base/Events/OnMouseMove';
import OnTouch, { Touch } from '../Base/Events/OnTouch';
import Renderer, { Renderable } from '../Base/Renderer';

export default class Button
  implements
    ContextObject,
    Renderable,
    OnMouseButton,
    OnMouseMove,
    OnTouch,
    Collidable
{
  zIndex: number = 5;

  id: number;

  shape?: 'ARROW' | 'PLUS' | 'CROSS' | 'SYNC';

  position: Vector;
  size: number = 0;

  width: number = 0;
  height: number = 0;
  radius: number = 0;

  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

  bbox: number[] = [];
  collider: Collider;

  hover: boolean = false;

  OnPress?: () => void;

  constructor(
    shape: 'ARROW' | 'PLUS' | 'CROSS' | 'SYNC',
    x: number,
    y: number,
    size: number = 10,
    direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' = 'UP'
  ) {
    this.position = new Vector(x, y);
    this.shape = shape;
    this.direction = direction;

    this.size = size;
    this.RecalculateProps();

    this.id = Context.id;
    this.collider = new Collider(this);
  }

  RecalculateProps() {
    if (this.shape === 'ARROW') {
      if (this.direction === 'UP' || this.direction === 'DOWN') {
        this.width = this.size / 3;
        this.height = this.size;
      } else if (this.direction === 'LEFT' || this.direction === 'RIGHT') {
        this.width = this.size;
        this.height = this.size / 3;
      }
      this.radius = Math.max(this.width, this.height) * 0.75;
    } else if (this.shape === 'PLUS') {
      this.width = this.height = this.size;
      this.radius = this.size * 0.75;
    } else if (this.shape === 'CROSS') {
      this.width = this.height = this.size;
      this.radius = this.size * 0.75;
    } else if (this.shape === 'SYNC') {
      if (this.direction === 'UP' || this.direction === 'DOWN') {
        this.width = this.size / 3;
        this.height = this.size;
      } else if (this.direction === 'LEFT' || this.direction === 'RIGHT') {
        this.width = this.size;
        this.height = this.size / 3;
      }
      this.radius = Math.max(this.width, this.height) * 0.75;
    }
  }

  CalculateBBOX() {
    if (this.bbox.length !== 0) {
      this.bbox[0] = this.position.x;
      this.bbox[1] = this.position.y;
      this.bbox[2] = this.position.x + this.width;
      this.bbox[3] = this.position.y + this.height;
    } else {
      this.bbox = [
        this.position.x,
        this.position.y,
        this.position.x + this.width,
        this.position.y + this.height,
      ];
    }
  }

  OnMouseButton(
    position: Vector,
    button: string,
    state: 'PRESSED' | 'RELEASED' | 'CLICKED'
  ): boolean {
    if (button === 'left' && state === 'PRESSED') {
      if (
        this.OnPress &&
        this.collider.PointCollisionCircle(position, this.radius)
      ) {
        this.OnPress();
        return false;
      }
    }
    return true;
  }

  OnMouseMove(position: p5.Vector, button?: string | undefined): void {
    if (button === undefined) {
      if (
        this.OnPress &&
        this.collider.PointCollisionCircle(position, this.radius)
      ) {
        this.hover = true;
        Renderer.Render();
      } else if (this.hover) {
        this.hover = false;
        Renderer.Render();
      }
    }
  }

  OnTouch(touches: Touch[], state: 'STARTED' | 'MOVED' | 'ENDED'): boolean {
    if (touches.length === 1) {
      const touchPosition = new Vector(touches[0].x, touches[0].y);
      if (state === 'STARTED') {
        return this.OnMouseButton(touchPosition, 'left', 'PRESSED');
      }
    }
    return true;
  }

  private getUpArrowPoints(arrowSize: number): number[][] {
    return [
      [this.position.x, this.position.y],
      [this.position.x, this.position.y - this.height],
      [this.position.x, this.position.y - this.height],
      [this.position.x - this.width, this.position.y - this.height / arrowSize],
      [this.position.x, this.position.y - this.height],
      [this.position.x + this.width, this.position.y - this.height / arrowSize],
    ];
  }

  private getDownArrowPoints(arrowSize: number): number[][] {
    return [
      [this.position.x, this.position.y],
      [this.position.x, this.position.y + this.height],
      [this.position.x, this.position.y + this.height],
      [this.position.x - this.width, this.position.y + this.height / arrowSize],
      [this.position.x, this.position.y + this.height],
      [this.position.x + this.width, this.position.y + this.height / arrowSize],
    ];
  }

  private getLeftArrowPoints(arrowSize: number): number[][] {
    return [
      [this.position.x, this.position.y],
      [this.position.x - this.width, this.position.y],
      [this.position.x - this.width, this.position.y],
      [this.position.x - this.width / arrowSize, this.position.y - this.height],
      [this.position.x - this.width, this.position.y],
      [this.position.x - this.width / arrowSize, this.position.y + this.height],
    ];
  }

  private getRightArrowPoints(arrowSize: number): number[][] {
    return [
      [this.position.x, this.position.y],
      [this.position.x + this.width, this.position.y],
      [this.position.x + this.width, this.position.y],
      [this.position.x + this.width / arrowSize, this.position.y - this.height],
      [this.position.x + this.width, this.position.y],
      [this.position.x + this.width / arrowSize, this.position.y + this.height],
    ];
  }

  PreRender(ctx: p5): void {
    this.CalculateBBOX();
  }

  RenderArrow(ctx: p5): void {
    const arrowSize = 2;
    if (this.hover) ctx.fill(0, 0, 0, 64);
    else ctx.fill(255, 255, 255, 255);
    ctx.stroke(0, 0, 0, 255);
    ctx.strokeWeight(1);

    ctx.circle(this.position.x, this.position.y, this.radius * 2.1);

    ctx.beginShape(1);
    {
      let [xOffset, yOffset] = [0, 0];
      let arrowPoints: number[][] = [];
      if (this.direction === 'UP') {
        yOffset = -this.height / 2;
        arrowPoints = this.getUpArrowPoints(arrowSize);
      } else if (this.direction === 'DOWN') {
        yOffset = this.height / 2;
        arrowPoints = this.getDownArrowPoints(arrowSize);
      } else if (this.direction === 'LEFT') {
        xOffset = -this.width / 2;
        arrowPoints = this.getLeftArrowPoints(arrowSize);
      } else if (this.direction === 'RIGHT') {
        xOffset = this.width / 2;
        arrowPoints = this.getRightArrowPoints(arrowSize);
      }
      for (const point of arrowPoints) {
        ctx.vertex(point[0] - xOffset, point[1] - yOffset);
      }
    }
    ctx.endShape();
  }

  RenderPlus(ctx: p5): void {
    if (this.hover) ctx.fill(0, 0, 0, 64);
    else ctx.fill(255, 255, 255, 255);
    ctx.stroke(0, 0, 0, 255);
    ctx.strokeWeight(1);
    ctx.beginShape(1);

    ctx.circle(this.position.x, this.position.y, this.radius * 2);
    {
      ctx
        .vertex(this.position.x, this.position.y - this.height / 2)
        .vertex(this.position.x, this.position.y + this.height / 2)
        .vertex(this.position.x - this.width / 2, this.position.y)
        .vertex(this.position.x + this.width / 2, this.position.y);
    }
    ctx.endShape();
  }

  RenderCross(ctx: p5): void {
    if (this.hover) {
      ctx.fill(255, 0, 0, 255);
      ctx.stroke(0, 0, 0, 255);
    } else {
      ctx.stroke(255, 0, 0, 255);
      ctx.fill(255, 255, 255, 255);
    }
    ctx.strokeWeight(1);
    ctx.beginShape(1);

    ctx.circle(this.position.x, this.position.y, this.radius * 2);
    {
      ctx
        .vertex(
          this.position.x - this.width / 3,
          this.position.y - this.height / 3
        )
        .vertex(
          this.position.x + this.width / 3,
          this.position.y + this.height / 3
        )
        .vertex(
          this.position.x + this.width / 3,
          this.position.y - this.height / 3
        )
        .vertex(
          this.position.x - this.width / 3,
          this.position.y + this.height / 3
        );
    }
    ctx.endShape();
  }

  RenderSync(ctx: p5): void {
    const arrowSize = 2;
    if (this.hover) {
      ctx.fill(0, 255, 64, 255);
      ctx.stroke(0, 0, 0, 255);
    } else {
      ctx.fill(255, 255, 255, 255);
      ctx.stroke(0, 255, 0, 255);
    }
    ctx.strokeWeight(1);

    ctx.square(
      this.position.x - this.radius * 1.05,
      this.position.y - this.radius * 1.05,
      this.radius * 2.1
    );

    ctx.beginShape(1);
    {
      let [xOffset, yOffset] = [0, 0];
      let [distX, distY] = [0, 0];
      let arrowPoints: number[][] = [];
      if (this.direction === 'UP' || this.direction === 'DOWN') {
        yOffset = -this.height / 2;
        distX = 1.5;
        arrowPoints = this.getUpArrowPoints(arrowSize);
      } else if (this.direction === 'LEFT' || this.direction === 'RIGHT') {
        xOffset = -this.width / 2;
        distY = 1.5;
        arrowPoints = this.getLeftArrowPoints(arrowSize);
      }
      ctx
        .vertex(
          arrowPoints[0][0] - xOffset - distX,
          arrowPoints[0][1] - yOffset - distY
        )
        .vertex(
          arrowPoints[1][0] - xOffset - distX,
          arrowPoints[1][1] - yOffset - distY
        )
        .vertex(
          arrowPoints[2][0] - xOffset - distX,
          arrowPoints[2][1] - yOffset - distY
        )
        .vertex(
          arrowPoints[3][0] - xOffset - distX,
          arrowPoints[3][1] - yOffset - distY
        )
        .vertex(
          arrowPoints[0][0] - xOffset + distX,
          arrowPoints[0][1] - yOffset + distY
        )
        .vertex(
          arrowPoints[1][0] - xOffset + distX,
          arrowPoints[1][1] - yOffset + distY
        )
        .vertex(
          arrowPoints[0][0] - xOffset + distX,
          arrowPoints[0][1] - yOffset + distY
        )
        .vertex(
          arrowPoints[5][0] - xOffset + distX,
          arrowPoints[5][1] - yOffset + distY
        );
    }
    ctx.endShape();
  }

  Render(ctx: p5): void {
    if (this.shape === 'ARROW') {
      this.RenderArrow(ctx);
    } else if (this.shape === 'PLUS') {
      this.RenderPlus(ctx);
    } else if (this.shape === 'CROSS') {
      this.RenderCross(ctx);
    } else if (this.shape === 'SYNC') {
      this.RenderSync(ctx);
    }
  }
}
