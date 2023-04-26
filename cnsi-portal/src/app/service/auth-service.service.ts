import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private http: HttpClient) { }


  login(username: string, password: string): Observable<any> {
    return this.http.post('/user/login', {
      username,
      password
    });
  }

  logout(): Observable<any> {
    return this.http.post('/user/logout', {
    });
  }

  getLCMServiceStatus() : Observable<any> {
    return this.http.get<any>('/status')
  }
}
