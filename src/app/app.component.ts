import { Component, OnInit, NgZone } from '@angular/core';
import { ElectronService } from './core/services';
import { TranslateService } from '@ngx-translate/core';
import { AppConfig } from '../environments/environment';
import { Router } from '@angular/router';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    private electronService: ElectronService,
    private translate: TranslateService,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.translate.setDefaultLang('en');

    console.warn('%c[WARNING]' + '\n%cНичего не вводите и не копируйте из консоли. Это может привести к потере данных от аккаунта или некорректной работе программы. Информация ниже предназначена только для разработчиков приложения.', 'color: yellow; font-size: 30px', 'font-size: 16px;');
    if (electronService.isElectron && !AppConfig.production) {
      console.log('\x1b[33m[app]\x1b[0m', AppConfig);
      console.log('\x1b[33m[app]\x1b[0m', process.env);
      console.log('\x1b[33m[app]\x1b[0m', 'Run in electron');
      console.log('\x1b[33m[app]\x1b[0m', 'Electron ipcRenderer', this.electronService.ipcRenderer);
      console.log('\x1b[33m[app]\x1b[0m', 'NodeJS childProcess', this.electronService.childProcess);
    } else {
      console.log('\x1b[33m[app]\x1b[0m', 'Run in browser');
    }
  }
  ngOnInit() {
    this.electronService.ipcRenderer.on('token-verify-denied', () => {
      this.ngZone.run(() => {
        localStorage.removeItem('user');
        this.router.navigate(['/login']);
      });
    });
  }
}
