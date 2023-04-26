import { Injectable } from '@angular/core';
import Image from 'src/app/logic/Components/Image';
import Context from 'src/app/logic/Base/Context';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Table from './logic/Components/Table';
import Cell from './logic/Components/Cell';
import { ApiService } from './api.service';
@Injectable({
  providedIn: 'root'
})
export class AppServiceService {
 
  context?: Context;
  fileUploaded:boolean=false;
  constructor(private fb: FormBuilder, public apiService: ApiService)
  {
    this.newTableForm = this.fb.group(
      {
        name:  ['Table_' + this.globalTableId, [Validators.required]],
        id: [this.globalTableId],
        rows: [1, Validators.required],
        columns: [1, Validators.required] 
      }
    );
  }
  fileToSend:Object | undefined
  fileAdded(evt: Event) {
    console.log('fr',evt);
    this.fileUploaded=true;
    const files: FileList = (evt.target as any).files;
    this.fileToSend=files[0];
    const img = document.createElement('img');
    const src = URL.createObjectURL(files[0]);
    img.src = src;
    img.onload = () => {
      this.context = new Context(1000, 800, 'canvas');
      this.context.InitRenderer();
      const image = new Image(src, img.width, img.height);
      this.context?.AddObject(image);
      img.remove();
    };
  }
  b64toBlob(dataURI: any) {
    return new Blob([this._base64ToArrayBuffer(dataURI)], {
      type: "image/png"
    });
  }
  BASE64_MARKER = ';base64,';
  _base64ToArrayBuffer(base64: string) {
    var base64Index = base64.indexOf(this.BASE64_MARKER) + this.BASE64_MARKER.length;
    var base64 = base64.substring(base64Index);
    var raw = window.atob(base64);
    var rawLength = raw.length;
    var array = new Uint8Array(new ArrayBuffer(rawLength));
    for (let i = 0; i < rawLength; i++) {
      array[i] = raw.charCodeAt(i);
    }
    return array;
  }
  removeImage()
  {
    //canvas element from html is already deleted from processing component .ts file
    this.context?.removeAllObjects()
    this.fileUploaded=false;
  }
  var_DisplayTable=false;
  toggle_DisplayTable()
  {
    if(this.var_DisplayTable==false)
    {
      this.var_DisplayTable=true;
      return;
    }
    else this.var_DisplayTable=false;
    return;
  }
  globalTableId=1;
  public newTableForm!: FormGroup;
  createTable()
  {
    console.log(this.newTableForm.value);
    if(this.newTableForm.value.rows<1 || this.newTableForm.value.rows>20 || 
      this.newTableForm.value.columns<1 || this.newTableForm.value.columns>20
      || this.newTableForm.value.name=='')
      {
        console.log('Invalid Table Fields');
        return;
      }
    else
    {
      const table = new Table();
      table.CreateTable(50, 50, this.newTableForm.value.rows, this.newTableForm.value.columns, 50);
      this.context?.AddObject(table);
    }
  }
  getZoom()
  {
    console.log(Context.context);
  }
  scaledDimensionWidth=800;
  ngAfterViewInit() {
  }
  isClose(a:Cell,b:Cell)
  {
    if((a.y+a.height)-(b.y) == -1 || (a.y+a.height)-(b.y) == -2)
    {
      b.y=a.y+a.height;
      return b;
    }
    else return b;
  }
  autoTableCreation()
  {
    this.apiService.autoTableDetection(this.fileToSend).subscribe(data=>{
      let allCells=(data as any).cells;
      let allXCords=(data as any).xCords;
      let allYCords=(data as any).yCords;      
      let cells:Cell[]=[]
      let scaleRatio=0.5;
      let origImageWidth=Context.context?.__renderer?.render_objects[0];
      origImageWidth=(origImageWidth as any).width;
      let origImageHeight=Context.context?.__renderer?.render_objects[0];
      origImageHeight=(origImageHeight as any).height;
      let canvasWidth=Context.context?.width;
      let canvasHeight=Context.context?.height;
      scaleRatio=Math.min(
        canvasHeight/(origImageHeight as any),
        canvasWidth/(origImageWidth as any),
      )      
      for(let x=0;x < allCells.length;x++)
      {
          let cell= new Cell(allCells[x].row, allCells[x].column, allCells[x].id, allCells[x].rows,
            allCells[x].columns, Math.round(allCells[x]['x-cord']*scaleRatio),Math.round(allCells[x]['y-cord']*scaleRatio),Math.round(allCells[x].height*scaleRatio),
             Math.round(allCells[x].width*scaleRatio))
          cells.push(cell); 
      } 
      for(let x =0 ; x <cells.length;x++)
      {
        if(x!=0)
        {
          cells[x]=this.isClose(cells[x-1],cells[x])
        }
      } 
    let table= new Table()
    table.autoTableCreation(cells,Math.round(allXCords[0]*scaleRatio),Math.round(allYCords[0]*scaleRatio))
    Context.context?.AddObject(table)
  })
  }
}
