import * as p5 from 'p5';
import Context, { ContextObject } from '../Base/Context';
import Renderer, { Renderable } from '../Base/Renderer';
import { Image as P5Image } from 'p5';
export default class Image implements ContextObject, Renderable {
  zIndex: number = -1;

  id: number;

  src: string;
  width: number;
  height: number;
  loaded: boolean = false;

  __image?: P5Image;
  constructor(src: string, width: number, height: number) {
    this.width = width;
    this.height = height;
    this.src = src;
    this.id = Context.id;
  }

  OnContextInit(ctx: Context): void {
    this.__image = ctx.renderer.loadImage(this.src, () => {
      this.loaded = true;
      Renderer.Render();
    });
  }

  Render(ctx: p5): void {
    if (this.loaded && this.__image) {
      const factor =
        this.width > this.height
          ? this.width / ctx.width
          : this.height / ctx.height;
      ctx.image(this.__image, 0, 0, this.width / factor, this.height / factor);
    }
  }
}
