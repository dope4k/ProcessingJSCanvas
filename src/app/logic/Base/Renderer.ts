import * as p5 from 'p5';

export abstract class Renderable {
  abstract Render(ctx: p5): void;
}

export default class Renderer {
  render_objects: Renderable[] = [];
  backgroundColor: number[];

  constructor(backgroundColor: number[] = [255, 255, 255, 255]) {
    if (backgroundColor.length === 4) this.backgroundColor = backgroundColor;
    else throw '`backgroundColor` should be an array of length 4';
    this.render_objects = [];
  }

  AddRenderObject(renderable: Renderable) {
    this.render_objects.push(renderable);
  }

  Render(ctx: p5) {
    ctx.background(255, 255, 255, 255);
    for (const obj of this.render_objects) {
      obj.Render(ctx);
    }
  }
}
