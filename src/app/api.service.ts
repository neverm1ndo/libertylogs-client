import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppConfig } from '../environments/environment.dev';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  readonly URL_LAST: string = AppConfig.api.main + 'last';
  readonly URL_CONFIGS: string =  AppConfig.api.main + 'config-files-tree';
  readonly URL_CONFIG: string =  AppConfig.api.main + 'config-file';
  readonly URL_CONFIG_SAVE: string =  AppConfig.api.main + 'save-config-file';
  readonly URL_SEARCH: string =  AppConfig.api.main + 'search';

  reloader$: BehaviorSubject<any> = new BehaviorSubject(null);

  public loading: boolean = true;

  lastQuery: any = { page: '0', lim: '50'};

  currentPage: number = 0;

  qtype: string;


  constructor(
    private http: HttpClient
  ) { }

  getConfigsDir(): Observable<any> {
    return this.http.get(this.URL_CONFIGS);
  }
  getConfigText(path: string): Observable<any> {
     const headers = new HttpHeaders().set('Content-Type', 'text/plain; charset=utf-8');
     return this.http.get(this.URL_CONFIG, { params: { path: path }, headers, responseType: 'text'});
  }
  getLast(): Observable<any> {
    return this.http.get(this.URL_LAST, { params: { page: this.currentPage.toString(), lim: '50'}});
  }
  getLogFile(): Observable<any> {
    this.loading = true;
      return this.reloader$.pipe(
        switchMap(() => {
          if (this.qtype == 'search') {
            if (!this.lastQuery.lim) this.lastQuery.lim = '50';
            this.lastQuery.page = this.currentPage.toString();
            return this.search(this.lastQuery)
          } else {
            return this.getLast();
          }
        })
      )
  }
  lazyUpdate(): void {
    this.currentPage++;
    // this.lastQuery = this.http.get(this.URL, { params: { page: this.currentPage.toString(), lim: '50'}})
    this.refresh();
  }
  search(query: {
    nickname?: Array<string>;
    date?: Array<string>;
    process?: Array<string>;
    as?: string;
    ss?: string;
    page?: string;
    lim?: string
  }): Observable<any> {
    this.loading = true;
    return this.http.get(this.URL_SEARCH, { params: query });
  }
  saveConfigFile(path:string, data: string): Observable<any> {
    return this.http.post(this.URL_CONFIG_SAVE, {
      file: {
        path: path,
        data: data
      }
    }, { responseType: 'text' })
  }
  addToRecent(key: string, val: string): void {
    let last = JSON.parse(localStorage.getItem('last'));
    function exists() {
      for (let i = 0; i < last[key].length; i++) {
        if (last[key][i] === val) {
          return true;
        }
      }
      return false;
    }
    if (!exists()) {
      if (last[key].length >= 10) {
        last[key].splice(-(last[key].length), 0, val);
        last[key].pop();
      } else {
        last[key].push(val);
      }
      localStorage.setItem('last', JSON.stringify(last));
    }
  }

  refresh() {
    // this.loading = true;
    this.reloader$.next(null);
  }
}
