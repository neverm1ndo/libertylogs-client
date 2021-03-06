import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppConfig } from '../environments/environment';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  readonly URL_LAST: string = AppConfig.api.main + 'logs/last';
  readonly URL_SEARCH: string =  AppConfig.api.main + 'logs/search';
  readonly URL_CONFIGS: string =  AppConfig.api.main + 'configs/config-files-tree';
  readonly URL_CONFIG: string =  AppConfig.api.main + 'configs/config-file';
  readonly URL_FILE_INFO: string =  AppConfig.api.main + 'configs/file-info';
  readonly URL_UPLOAD_CFG: string =  AppConfig.api.main + 'configs/upload-cfg';
  readonly URL_SAVE_CONFIG: string =  AppConfig.api.main + 'configs/save-config';
  readonly URL_UPLOAD_MAP: string =  AppConfig.api.main + 'maps/upload-map';
  readonly URL_MAPS: string =  AppConfig.api.main + 'maps/maps-files-tree';
  readonly URL_MAPINFO: string = AppConfig.api.main + 'maps/map-file';
  readonly URL_DELETE_FILE: string = AppConfig.api.main + 'utils/delete-file';
  readonly URL_ADMINS_LIST: string = AppConfig.api.main + 'admins/list';
  readonly URL_ADMINS_ALL: string = AppConfig.api.main + 'admins/all';
  readonly URL_ADMIN_CHANGE_GROUP: string = AppConfig.api.main + 'admins/change-group';
  readonly URL_ADMIN_SUB_GROUP: string = AppConfig.api.main + 'admins/sub-groups';
  readonly URL_ADMIN_TOKEN_EXPIRATION: string = AppConfig.api.main + 'admins/expire-token';

  reloader$: BehaviorSubject<any> = new BehaviorSubject(null);

  public loading: boolean = false;
  public lazy: boolean = false;

  lastQuery: any = { page: '0', lim: '50'};

  currentPage: number = 0;

  qtype: string;
  chunkSize: string;


  constructor(
    private http: HttpClient,
    private user: UserService
  ) {
    this.chunkSize = this.user.getUserSettings().lineChunk;
  }
  getAdminsList(): Observable<any> {
    return this.http.get(this.URL_ADMINS_LIST);
  }
  getAdminsAll(): Observable<any> {
    return this.http.get(this.URL_ADMINS_LIST);
  }
  setAdminGroup(username: string, group: number) {
    return this.http.put(this.URL_ADMIN_CHANGE_GROUP, { username: username, group: group })
  }
  closeAdminSession(username: string): Observable<any> {
    return this.http.get(this.URL_ADMIN_TOKEN_EXPIRATION, { params: { username: username }})
  }
  getAdminSubGroup() {
    return this.http.get(this.URL_ADMIN_SUB_GROUP)
  }
  getConfigsDir(): Observable<any> {
    return this.http.get(this.URL_CONFIGS);
  }
  getMapsDir(): Observable<any> {
    return this.http.get(this.URL_MAPS);
  }
  getConfigText(path: string): Observable<any> {
     const headers = new HttpHeaders().set('Content-Type', 'text/plain; charset=utf-8');
     return this.http.get(this.URL_CONFIG, { params: { path: path }, headers, responseType: 'text'});
  }
  getMap(path: string) {
    this.loading = true;
    const headers = new HttpHeaders({ 'Content-Type': 'text/xml' }).set('Accept', 'text/xml');
    return this.http.get(this.URL_MAPINFO, { params: { path: path }, headers: headers, responseType: 'text' });
  }
  deleteMap(path: string) {
    return this.http.delete(this.URL_DELETE_FILE, { params: { path: path }});
  }
  getLast(): Observable<any> {
    return this.http.get(this.URL_LAST, { params: { page: this.currentPage.toString(), lim: this.chunkSize}});
  }
  getLogFile(): Observable<any> {
    this.loading = true;
      return this.reloader$.pipe(
        switchMap(() => {
          if (this.qtype == 'search') {
            if (!this.lastQuery.lim) this.lastQuery.lim = this.chunkSize;
            this.lastQuery.page = this.currentPage.toString();
            return this.search(this.lastQuery)
          } else {
            return this.getLast();
          }
        })
      )
  }
  getFileInfo(path: string): Observable<any> {
    return this.http.get(this.URL_FILE_INFO, { params: { path: path }});
  }
  saveFile(path: string, data: string): Observable<any> {
    return this.http.post(this.URL_SAVE_CONFIG, {
      file: {
        path: path,
        data: data
      }
    }, { responseType: 'json' });
  }
  uploadFileMap(form: FormData): Observable<any> {
    return this.http.post(this.URL_UPLOAD_MAP, form, { reportProgress: true, observe: 'events', responseType: 'blob' });
  }
  uploadFileCfg(form: FormData): Observable<any> {
    return this.http.post(this.URL_UPLOAD_CFG, form, { reportProgress: true, observe: 'events', responseType: 'blob' });
  }
  lazyUpdate(page: number): void {
    if (this.currentPage >= 0 && (this.currentPage + page) !== -1) {
      this.lazy = true;
      this.currentPage += page;
      this.refresh();
    }
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
    // this.loading = true;
    return this.http.get(this.URL_SEARCH, { params: query });
  }
  addToRecent(key: string, val: any): void {
    let last = JSON.parse(localStorage.getItem('last'));
    function exists() {
      for (let i = 0; i < last[key].length; i++) {
        if (typeof last[key][i] == 'string') {
          if (last[key][i] === val) {
            return true;
          }
        } else {
          if (last[key][i].path === val.path) {
            return true;
          }
        }
      }
      return false;
    }
    if (!exists()) {
      if (last[key].length >= (key=='search'?15:7)) {
        last[key].splice(-(last[key].length), 0, val);
        last[key].pop();
      } else {
        last[key].push(val);
      }
      localStorage.setItem('last', JSON.stringify(last));
    }
  }

  refresh() {
    this.reloader$.next(null);
  }
  sync() {
    this.loading = true;
    this.reloader$.next(null);
  }
}
