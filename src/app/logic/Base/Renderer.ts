import * as p5 from 'p5';

export abstract class Renderable {
  abstract Render(ctx: p5): void | Promise<void>;
}

export default class Renderer {
  static __renderer: Renderer;
  static get renderer() {
    return Renderer.__renderer;
  }

  static Render() {
    Renderer.renderer.dirty = true;
  }

  render_objects: Renderable[] = [];
  backgroundColor: number[];

  dirty: boolean = true;

  constructor(backgroundColor: number[] = [255, 255, 255, 255]) {
    if (backgroundColor.length === 4) this.backgroundColor = backgroundColor;
    else throw '`backgroundColor` should be an array of length 4';
    this.render_objects = [];
    Renderer.__renderer = this;
  }

  AddRenderObject(renderable: Renderable) {
    this.render_objects.push(renderable);
  }

  Render(ctx: p5) {
    if (this.dirty) {
      ctx.background(255, 255, 255, 255);
      for (const obj of this.render_objects) {
        obj.Render(ctx);
      }
      this.dirty = false;
    }
  }
}
