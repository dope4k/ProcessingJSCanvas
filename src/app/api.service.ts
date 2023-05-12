import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import Crop from './logic/Components/Crop';
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) { }
  autoTableDetection(file:Object | undefined)
  {
    var formData: any = new FormData(); 
    formData.append('image', file); 
    formData.append('data',JSON.stringify({"border_table":1,"borderless_table":0}))
    return this.http.post('http://13.212.67.201:8000/table_split',formData)
  }
  extractTable(file:Object | undefined,data:Crop,scaleRatio:number,hybrid:boolean)
  {
    var formData:any = new FormData();
    formData.append('image',file);
    formData.append('data',
    JSON.stringify({
      "border_table": 0, "borderless_table": 1,
      "scaleRatio":scaleRatio,"crops":[data.getCrop()]
    })
    )
    return this.http.post(hybrid?'http://13.212.67.201:8000/hybrid_split':'http://13.212.67.201:8000/table_split',formData)
  }
  magicSplit(formData : FormData)
  {
    return this.http.post('http://13.212.67.201:8000/magic_split_merge',formData)
  }
}