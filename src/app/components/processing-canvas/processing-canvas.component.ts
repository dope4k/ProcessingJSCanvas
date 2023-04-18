import { Component ,ElementRef, ViewChild } from '@angular/core';
import { AppServiceService } from 'src/app/app-service.service';

@Component({
  selector: 'app-processing-canvas',
  templateUrl: './processing-canvas.component.html',
  styleUrls: ['./processing-canvas.component.scss'],
})
export class ProcessingCanvasComponent {
  @ViewChild('canvasContainer') canvasContainer: ElementRef | undefined ;
  constructor(public appService: AppServiceService){}
  removeCanvasElements()
  {
    const canvasElements = this.canvasContainer?.nativeElement.getElementsByTagName('canvas');
    if (canvasElements.length > 0) {
      canvasElements[0].remove();
    }
  }

}
