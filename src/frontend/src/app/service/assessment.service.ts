import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment'
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AssessmentService {
  public environment:any = environment
  constructor(private http: HttpClient) { }

  getKubeBenchReport(limit:number = 10, continues:string='') {
    return this.http.get(this.environment.api.goharbor + '/settings')
  }

  getKubeBenchResult() {
    return this.http.get(this.environment.api.goharbor + '/settings')
  }
}
