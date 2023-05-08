import { Injectable } from '@angular/core';
import Image from 'src/app/logic/Components/Image';
import Context from 'src/app/logic/Base/Context';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Table from './logic/Components/Table';
import Cell from './logic/Components/Cell';
import { ApiService } from './api.service';
import Crop from './logic/Components/Crop';
@Injectable({
  providedIn: 'root'
})
export class AppServiceService {
  context?: Context;
  fileUploaded: boolean = false;
  BASE64_MARKER = ';base64,';
  var_DisplayTable = false;
  globalTableId = 1;
  public newTableForm!: FormGroup;
  constructor(private fb: FormBuilder, public apiService: ApiService) {
    //table form for create new table
    this.newTableForm = this.fb.group(
      {
        name: ['Table_' + this.globalTableId, [Validators.required]],
        id: [this.globalTableId],
        rows: [1, Validators.required],
        columns: [1, Validators.required]
      }
    );
  }
  fileToSend: Object | undefined
  //gives the less value 
  limitOption(option: number, limit: number) {
    if (option > limit) return limit;
    else return option;
  }
  //file upload functions
  fileAdded(evt: Event) {
    this.fileUploaded = true;
    const files: FileList = (evt.target as any).files;
    this.fileToSend = files[0];
    const img = document.createElement('img');
    const src = URL.createObjectURL(files[0]);
    img.src = src;
    img.onload = () => {
      this.context = new Context(this.limitOption(img.width, 1000), this.limitOption(img.height, 800), 'canvas');
      this.context.InitRenderer();
      const image = new Image(src, img.width, img.height);
      this.context?.AddObject(image);
      img.remove();
    };
  }
  //file upload functions
  b64toBlob(dataURI: any) {
    return new Blob([this._base64ToArrayBuffer(dataURI)], {
      type: "image/png"
    });
  }
  //file upload functions
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
  //remove image
  removeImage() {
    //canvas element from html is already deleted from processing component .ts file
    this.context?.removeAllObjects()
    this.fileUploaded = false;
  }
  //toggle display table function
  toggle_DisplayTable() {
    if (this.var_DisplayTable == false) {
      this.var_DisplayTable = true;
      return;
    }
    else this.var_DisplayTable = false;
    return;
  }
  //create table function
  createTable() {
    if (this.newTableForm.value.rows < 1 || this.newTableForm.value.rows > 20 ||
      this.newTableForm.value.columns < 1 || this.newTableForm.value.columns > 20
      || this.newTableForm.value.name == '') {
      console.log('Invalid Table Fields');
      return;
    }
    else {
      const table = new Table();
      table.CreateTable(50, 50, this.newTableForm.value.rows, this.newTableForm.value.columns, 50);
      this.context?.AddObject(table);
    }
  }
  //returns current zoom of canvas
  getZoom() {
    console.log(Context.context);
  }
  //are both numbers in range from 2 to -2
  isCloseNumbers(a: number, b: number) {
    if (a - b >= -2 && a - b <= 2) {
      return true;
    }
    return false;

  }
  //are both cells in range of 0 to -2
  isCloseCells(a: Cell, b: Cell) {
    if ((a.y + a.height) - (b.y) == -1 || (a.y + a.height) - (b.y) == -2) {
      b.y = a.y + a.height;
      return b;
    }
    else return b;
  }
  //sort cells wrt row
  cellsSortWRTRow(cells: Cell[]) {
    cells.sort((a, b) => {
      if (a.y !== b.y) {
        return a.y - b.y;
      } else {
        return a.x - b.x;
      }
    });
    return cells;
  }
  //sort cells wrt coluumn
  cellsSortWRTCol(cells: Cell[]) {
    cells.sort((a, b) => {
      if (a.x !== b.x) {
        return a.x - b.x;
      } else {
        return a.y - b.y;
      }
    });
    return cells;
  }
  //returns current scale ratio
  getScaleRatio() {
    let origImageWidth = Context.context?.__renderer?.render_objects[0];
    origImageWidth = (origImageWidth as any).width;
    let origImageHeight = Context.context?.__renderer?.render_objects[0];
    origImageHeight = (origImageHeight as any).height;
    let canvasWidth = Context.context?.width;
    let canvasHeight = Context.context?.height;
    return  Math.min(
      canvasHeight / (origImageHeight as any),
      canvasWidth / (origImageWidth as any),
    )
  }
  //transform response cells to correct format
  transformIncomingCellsToCellObjArray(allCells: any[], scaleRatio: number,hybrid: boolean) {
    let cells: Cell[] = [];
    for (let x = 0; x < allCells.length; x++) {
      let cell = new Cell(allCells[x].row, 1, allCells[x].id, allCells[x].rows,
        1, Math.round(allCells[x]['x-cord'] * (hybrid?1:scaleRatio)), Math.round(allCells[x]['y-cord'] * (hybrid?1:scaleRatio)), Math.round(allCells[x].height * (hybrid?1:scaleRatio)),
        Math.round(allCells[x].width * (hybrid?1:scaleRatio)))
      cells.push(cell);
    }
    return cells;
  }
  //finds max id in cells
  findMaxId(cells: Cell[], maxId: number) {
    for (let x = 0; x < cells.length; x++) {
      if (x != 0) {
        cells[x] = this.isCloseCells(cells[x - 1], cells[x])
      }
      if (cells[x].id > maxId) maxId = cells[x].id;
    }
    return maxId;
  }
  //adds 1x1 new cells to array
  addNew1x1Cells(cells: Cell[], xCordsCells: number[], yCordsCells: number[], maxId: number) {
    for (let x = 0; x < xCordsCells.length - 1; x++) {
      let check1 = false;
      for (let y = 0; y < yCordsCells.length - 1; y++) {
        for (let z = 0; z < cells.length; z++) {
          if (cells[z].x == xCordsCells[x] && cells[z].y == yCordsCells[y]) {
            check1 = true;
            break;
          }
        }
        if (check1 == false) {
          //add new cell here to cells Array
          let cell = new Cell(1, 1, maxId, 1, 1, xCordsCells[x], yCordsCells[y],
            yCordsCells[y + 1] - yCordsCells[y], xCordsCells[x + 1] - xCordsCells[x]);
          cell.isNewCell = true;
          cells.push(cell)
        }
        check1 = false;
      }
    }
    return cells;
  }
  //fixes height and width of cells which are within range
  fixCellsHeightWidth(cells: Cell[]) {
    cells = this.cellsSortWRTCol(cells)
    //fix height of cells 
    for (let x = 0; x < cells.length - 1; x++) {
      if (cells[x].x == cells[x + 1].x) {
        cells[x].height = cells[x + 1].y - cells[x].y
      }
    }

    cells = this.cellsSortWRTRow(cells)
    for (let x = 0; x < cells.length - 1; x++) {
      if (cells[x].y == cells[x + 1].y) {
        cells[x].width = cells[x + 1].x - cells[x].x
      }
    }
    return cells;
  }

  //auto table creation
  autoTableCreation() {
    this.apiService.autoTableDetection(this.fileToSend).subscribe(data => {
      let allCells = (data as any).cells;
      let allXCords = (data as any).xCords;
      let allYCords = (data as any).yCords;
      //function to get cells from backend and convert them to frontend cells
      var { cells, firstX, firstY, lastX, lastY, xCordsCells, yCordsCells }: 
      { cells: Cell[]; firstX: number; firstY: number; lastX: number; lastY: number; xCordsCells: number[]; yCordsCells: number[]; }
       = this.backendCellsToFrontendCells(allCells, allXCords, allYCords,false);
      //create a table and send those cells
      let table = new Table()
      table.autoTableCreation(cells, Math.round(firstX), Math.round(firstY), Math.round(lastX), Math.round(lastY)
        , xCordsCells, yCordsCells)
      Context.context?.AddObject(table)
    })
  }

  //get frontend formated cells from backend . adds missing cells aswell
  private backendCellsToFrontendCells(allCells: any, allXCords: any, allYCords: any,hybrid: boolean) {
    let cells: Cell[] = [];
    hybrid=false;
    //find scaleRatio
    let scaleRatio = this.getScaleRatio();
    //find maxId 
    let maxId = this.findMaxId(cells, 0);
    // push incoming cells to Cell Format array
    cells = this.transformIncomingCellsToCellObjArray(allCells, scaleRatio,hybrid);
    //first 2 coordinates to send in function to detect top and left
    const firstX = allXCords[0] * (hybrid?1:scaleRatio);
    const firstY = allYCords[0] * (hybrid?1:scaleRatio);
    //check for out of index
    let allXCordsLength = allXCords.length;
    let allYCordsLength = allYCords.length;
    const lastX = (allXCordsLength>2)?(allXCords[allXCords.length - 2] * (hybrid?1:scaleRatio)):0;
    const lastY = (allYCordsLength>2)?(allYCords[allYCords.length - 2] * (hybrid?1:scaleRatio)):0;
    //--code for missing cells--
    let xCordsCells: number[] = [];
    let yCordsCells: number[] = [];
    //get new xCords & yCords from cells made
    for (let x in cells) {
      if (!xCordsCells.includes(cells[x].x)) {
        xCordsCells.push(cells[x].x);
      }
      if (!yCordsCells.includes(cells[x].y)) {
        yCordsCells.push(cells[x].y);
      }
    }
    //add last cell width and height
    for (let x = 0; x < cells.length; x++) {
      if (cells[x].x == xCordsCells[xCordsCells.length - 1]) {
        if (!xCordsCells.includes(cells[x].x + cells[x].width))
          xCordsCells.push(cells[x].x + cells[x].width);
      }
      if (cells[x].y == yCordsCells[yCordsCells.length - 1]) {
        if (!yCordsCells.includes(cells[x].y + cells[x].height))
          yCordsCells.push(cells[x].y + cells[x].height);
      }
    }
    //sort the cords and remove duplicates
    yCordsCells = this.removeDuplicateCordsAndSort(yCordsCells);
    xCordsCells = this.removeDuplicateCordsAndSort(xCordsCells);
    // check if a cell exists on the (x,y) from coordinates
    // if not add a cell to the array
    cells = this.addNew1x1Cells(cells, xCordsCells, yCordsCells, maxId);
    //fix cells height width if necessary
    cells = this.fixCellsHeightWidth(cells);
    return { cells, firstX, firstY, lastX, lastY, xCordsCells, yCordsCells };
  }

  //remove duplicate cords and then sort them
  private removeDuplicateCordsAndSort(cords:number[])
  {
    cords = cords.filter((value, index) => cords.indexOf(value) === index)
    cords= cords.sort(function(a, b){return a - b});
    return cords
  }

  //extract table  -- (hybrid == true for hybrid split)
  extractTable(hybrid: boolean)
  {
    let table: Table | undefined;
    this.context?.OnKeyDispatchers.forEach((obj:any)=>{
      if(obj.cells)
      {
          let scaleRatio= this.getScaleRatio()
          table=obj
          if(table) 
          {
            //crop variables
            let x1=table.bbox[0]+20;
            let y1=table.bbox[1]+20;
            let x2=table.bbox[2]-x1-20;
            let y2=table.bbox[3]-y1-20;
            
            //for hybrid split we send crop by dividing it by scale ratio
            let crop = new Crop(x1?x1/(hybrid?this.getScaleRatio():1):2,
            y1?y1/(hybrid?this.getScaleRatio():1):2,
            x2/(hybrid?this.getScaleRatio():1),
            y2/(hybrid?this.getScaleRatio():1))

            //removes the already created table
            this.context?.RemoveObject(table?.id) 
            this.apiService.extractTable(this.fileToSend,crop,scaleRatio,hybrid?true:false).subscribe(data=>{
              this.extractHybridApiResponseToTable(hybrid?data:(data as [0]),hybrid)            
            })
            return;      
          }
      }
    })
  }


  //takes input from extract table Api and makes cell
  extractHybridApiResponseToTable(data:any,hybrid:boolean)
  {
      let xCords= hybrid?data['xCords']:data[0]['xCords'];
      let yCords= hybrid?data['yCords']:data[0]['yCords'];
      //cells from api response
      let backendCells= hybrid?data['cells']:data[0]['cells'];
      //find the right bottom most cell to calculate last xcord and ycord 
      let rightBottomMostCell= this.findCornerCellInDirection(backendCells,'RightBottom');
      //add that last xcord and ycord to arrays
      if(!hybrid)
      {
        (xCords as number[]).push(rightBottomMostCell?
          (rightBottomMostCell['x-cord'] + rightBottomMostCell['width']):0);
        (yCords as number[]).push(rightBottomMostCell?
            rightBottomMostCell['y-cord'] + rightBottomMostCell['height']:0);
      }
      
      //remove duplicates and sort
      (xCords as number[])=this.removeDuplicateCordsAndSort(xCords);
      (yCords as number[])=this.removeDuplicateCordsAndSort(yCords);
      if(!hybrid)
      {
        let cells: Cell[] = [];
        cells=this.addNew1x1Cells(cells,xCords,yCords,1)
          
        //create table and display
        let table = new Table()
        table.autoTableCreation(cells,xCords[0],yCords[0],xCords[(xCords as any).length-1],yCords[(yCords as any).length-1],
          xCords,yCords)
        Context.context?.AddObject(table)
      }
      if(hybrid)
      {
        var { cells, firstX, firstY, lastX, lastY, xCordsCells, yCordsCells }: 
        { cells: Cell[]; firstX: number; firstY: number; lastX: number; lastY: number; xCordsCells: number[]; yCordsCells: number[]; }
         = this.backendCellsToFrontendCells(backendCells, xCords, yCords,hybrid);
        //create a table and send those cells
        let table = new Table()
        table.autoTableCreation(cells,
        Math.round(firstX),
         Math.round(firstY),
          Math.round(lastX),
           Math.round(lastY)
          , xCordsCells, yCordsCells)
        Context.context.AddObject(table)
      }  
  }
  
  //find corner cells in direction -
  //direction can 'RightBottom' or 'LeftTop'
  findCornerCellInDirection(backendCells: Cell[] | any, direction: string)
  {

    if(backendCells.length==0) return null
    let cell;
    let xcord= (direction=='LeftTop')?10000:0;
    let ycord= (direction=='LeftTop')?10000:0;
    if(direction=='RightBottom')
    {
      for(let x = 0 ; x < backendCells.length ; x++)
      {
        if(backendCells[x]['x-cord'] ? backendCells[x]['x-cord']:backendCells[x].x  > xcord)
        {
          xcord=backendCells[x]['x-cord']?backendCells[x]['x-cord']:backendCells[x].x;
        }
        if(backendCells[x]['y-cord'] ? backendCells[x]['y-cord']:backendCells[x].y  > ycord)
        {
          ycord=backendCells[x]['y-cord']?backendCells[x]['y-cord']:backendCells[x].y;
        }
      }
    }
    else if(direction=='LeftTop')
    {
      for(let x = 0 ; x < backendCells.length ; x++)
      {
        if(backendCells[x]['x-cord'] ? backendCells[x]['x-cord']:backendCells[x].x  < xcord)
        {
          xcord=backendCells[x]['x-cord']?backendCells[x]['x-cord']:backendCells[x].x;
        }
        if(backendCells[x]['y-cord'] ? backendCells[x]['y-cord']:backendCells[x].y  < ycord)
        {
          ycord=backendCells[x]['y-cord']?backendCells[x]['y-cord']:backendCells[x].y;
        }
      }
    }
    for(let x in backendCells)
    {
      if((backendCells[x]['x-cord']?backendCells[x]['x-cord']:backendCells[x].x)==xcord && 
      (backendCells[x]['y-cord']?backendCells[x]['y-cord']:backendCells[x].y)==ycord)
      {
        return backendCells[x]
      }
    }
    return cell;
  }

  //icons for magic split
  // plusPath = "data:image/png;base64,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"
  // minusPath = "data:image/png;base64,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"

}
