import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, Subject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { UserData, UserLoginData } from './interfaces/app.interfaces';
import { Router } from '@angular/router';
import { AppConfig } from '../environments/environment.dev';
import { ElectronService } from './core/services/electron/electron.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  readonly URL_LOGIN: string = AppConfig.api.auth;
  user: Subject<UserData | undefined> = new Subject();
  headers: HttpHeaders = new HttpHeaders ({
    'Content-Type': 'application/json'
  });
  error: Subject<any> = new Subject();

  constructor(
    private http: HttpClient,
    private router: Router,
    public electron: ElectronService
  ) {
  }

  getUserInfo(): UserData | null {
    if (localStorage.getItem('user') !== null) {
      return JSON.parse(localStorage.getItem('user'));
    } else {
      return null;
    }
  }
  isAuthenticated(): boolean {
    if (this.getUserInfo()) {
      const token = this.getUserInfo().token;
      if (token) return true;
    } else {
      return false;
    }
  }
  loginUser(value: UserLoginData): Observable<UserData> {
    return this.http.post<UserLoginData>(this.URL_LOGIN, value, { headers: this.headers })
    .pipe(
      catchError((error) => this.handleError(error))
    ).pipe(
      tap(user => {
        if (user && user.token) {
          localStorage.setItem('user', JSON.stringify(user));
        }
        this.user.next(user);
        return user;
    }))
  }
  logOut(): void {
    const dialogOpts = {
        type: 'question',
        buttons: ['Да, выйти', 'Отмена'],
        title: 'Подтверждение выхода',
        message: 'Вы точно хотите выйти с аккаунта?'
      }
    this.electron.dialog.showMessageBox(dialogOpts).then((returnValue) => {
      if (returnValue.response === 0) {
        this.user.next(undefined);
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
      }
    })
  }
  private handleError(error: HttpErrorResponse): Observable<any> {
    if (error.error instanceof ErrorEvent) {
      console.error('An error occurred:', error.error.message);
      this.error.next(error.error);
    } else {
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
        this.error.next(error);
    }
    return throwError(error);
  }
}