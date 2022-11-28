import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment'
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  public environment:any = environment
  constructor(private http: HttpClient) { }

  getKubeBenchReport (data: {url: string, index: string, username: string, password: string, query: any, client: string, ca: string}) :Observable<any>{
    return this.http.post<any>('/open-search', data)
  }
}
