import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    return this.http.post('http://18.143.184.206:8000/table_split',formData)
  }
}