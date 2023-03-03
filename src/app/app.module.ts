import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { ProcessingCanvasComponent } from './components/processing-canvas/processing-canvas.component';

@NgModule({
  declarations: [AppComponent, ProcessingCanvasComponent],
  imports: [BrowserModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
