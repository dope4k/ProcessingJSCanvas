import { Injectable } from '@angular/core';
import Image from 'src/app/logic/Components/Image';
import Context from 'src/app/logic/Base/Context';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import Table from './logic/Components/Table';
import Cell from './logic/Components/Cell';
import { ApiService } from './api.service';
import Crop from './logic/Components/Crop';
import Renderer from './logic/Base/Renderer';
import Edge from './logic/Components/Edge';
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
    console.log(this.displayAllRowsColumnsSelected());
    
    // let table= Context.context?.OnKeyDispatchers[0];
    // (table as any).edges.forEach((edge:Edge)=>{
      
      // if(edge.start.topEdge==undefined && edge.isHorizontal==true)
      // console.log(edge.row,edge.column);

      // if(edge.start.leftEdge==undefined && edge.isVertical==true)
      // {
      //   console.log(edge.row,edge.column);
      // }
      
    // })
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

  //returns true if edge is topmost or leftmost 
  isEdgeTopVerticeOrLeftVertice(edge: Edge)
  {
    if(edge.end.topEdge==undefined || edge.end.leftEdge==undefined){
      return true
    }
    return false;
  }

  //magic split active toggle variable
  magicSplit: boolean = false; 
  makeTablesEdgesIconsForMagicSplit(table: Table | undefined)
  {
    if(this.magicSplit==false)
    {
      if(table) 
      {
        table.edges.forEach((edge)=>{
          edge.magicSplitActive=true;
        })
        
        //loop through all edges of the table
        table.edges.forEach((edge)=>{
          //find the top most and left most edges 
          if(this.isEdgeTopVerticeOrLeftVertice(edge))
          {
            //Flag for magic split icons 
            edge.magicAdd=true
            edge.magicRemove=false;
            //Displays the Magic Split add icons
            edge.InitNewAddButton();  
            // edge.InitNewDeleteButton()
          }
        })
      }
      this.magicSplit=true;
    }
    else if(this.magicSplit==true)
    {
      if(table) 
      {
        table.edges.forEach((edge)=>{
          edge.magicSplitActive=false;
        })
        
        //loop through all edges of the table
        table.edges.forEach((edge)=>{
          //find the top most and left most edges 
          if(edge.magicAdd) {
            edge.magicSplit_addBtn=undefined
            edge.magicAdd=false;
          }
          if(edge.magicRemove)
          {
            edge.magicSplit_deleteBtn=undefined
            edge.magicRemove=false;
          } 
        })
      }
      this.magicSplit=false;
    }

  }

  //shows magic split icons
  showMagicSplitIcons(rowOrCol:'Both' | 'Row' | 'Column')
  {
    if(rowOrCol=='Both')
    {
      let table: Table | undefined;
      this.context?.OnKeyDispatchers.forEach((obj:any)=>{
        if(obj.cells)
        {
            table=obj
            this.makeTablesEdgesIconsForMagicSplit(table)
        }
      })
      Renderer.Render()
    }
    else if(rowOrCol=='Row')
    {

    }
    else if(rowOrCol=='Column')
    {

    }
  }


  selectedRows:number[] =[];
  selectedColumns:number[]=[];
  loadPage:boolean=true;
  displayAllRowsColumnsSelected()
  {
    let table= Context.context.OnKeyDispatchers[0];
    console.log('columns->', (table as Table).edges.forEach(edge=>{
      if(edge.magicRemove==true && edge.isHorizontal)
      {  console.log(edge.column) }})
    );
    console.log('rows->', (table as Table).edges.forEach(edge=>{
      if(edge.magicRemove==true && edge.isVertical)
      {  console.log(edge.row) }})
    );
    
    

  }
  
}
