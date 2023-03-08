import { Component, OnInit } from '@angular/core';
import Button from 'src/app/logic/Components/Button';
import Image from 'src/app/logic/Components/Image';
import Context from '../../logic/Base/Context';
import Table from '../../logic/Components/Table';

@Component({
  selector: 'app-processing-canvas',
  templateUrl: './processing-canvas.component.html',
  styleUrls: ['./processing-canvas.component.scss'],
})
export class ProcessingCanvasComponent {
  context?: Context;

  fileAdded(evt: Event) {
    const files: FileList = (evt.target as any).files;

    const img = document.createElement('img');
    const src = URL.createObjectURL(files[0]);
    img.src = src;

    img.onload = () => {
      this.context = new Context(1000, 800, 'canvas');
      this.context.InitRenderer();

      const table = new Table();
      table.CreateTable(50, 50, 5, 5, 50);
      this.context.AddObject(table);

      const image = new Image(src, img.width, img.height);
      this.context?.AddObject(image);
      img.remove();
    };
  }
}
