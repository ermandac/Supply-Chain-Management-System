import { Component, ViewChild } from '@angular/core';
import { MatSidenav } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-navbar',
  template: `
    <mat-toolbar color="primary" class="navbar">
      <div class="navbar-brand">
        <span class="brand-text">Megaion SCMS</span>
      </div>
      
      <div class="navbar-links" *ngIf="isLoggedIn">
        <button mat-button routerLink="/dashboard" routerLinkActive="active">
          <mat-icon>dashboard</mat-icon>
          <span>Dashboard</span>
        </button>
        
        <button mat-button routerLink="/inventory" routerLinkActive="active" *ngIf="!isCustomer">
          <mat-icon>inventory_2</mat-icon>
          <span>Inventory</span>
        </button>
        
        <button mat-button routerLink="/orders" routerLinkActive="active">
          <mat-icon>shopping_cart</mat-icon>
          <span>Orders</span>
        </button>
        
        <button mat-button routerLink="/delivery" routerLinkActive="active" *ngIf="!isCustomer">
          <mat-icon>local_shipping</mat-icon>
          <span>Delivery</span>
        </button>
      </div>
      
      <span class="navbar-spacer"></span>
      
      <div class="navbar-actions">
        <ng-container *ngIf="isLoggedIn; else loginButton">
          <button mat-button [matMenuTriggerFor]="userMenu" class="user-menu-button">
            <mat-icon>account_circle</mat-icon>
            <span>{{ currentUser?.name }}</span>
            <mat-icon>arrow_drop_down</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <button mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>Profile</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>exit_to_app</mat-icon>
              <span>Logout</span>
            </button>
          </mat-menu>
        </ng-container>
        
        <ng-template #loginButton>
          <button mat-button routerLink="/login">
            <mat-icon>login</mat-icon>
            <span>Login</span>
          </button>
        </ng-template>
      </div>
    </mat-toolbar>

    <div class="content-container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      display: flex;
      align-items: center;
      padding: 0 16px;
      height: 64px;
      background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .brand-text {
      font-size: 1.2rem;
      font-weight: 500;
      letter-spacing: 0.5px;
    }

    .navbar-links {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: 24px;
    }

    .navbar-links button {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 36px;
      padding: 0 16px;
      border-radius: 18px;
      font-weight: 500;
    }

    .navbar-spacer {
      flex: 1;
    }

    .navbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .user-menu-button {
      display: flex;
      align-items: center;
      gap: 4px;
      height: 36px;
      padding: 0 12px;
      border-radius: 18px;
      background: rgba(255,255,255,0.1);
    }

    .active {
      background: rgba(255,255,255,0.1);
    }

    .content-container {
      padding: 24px;
      max-width: 1200px;
      margin: 84px auto 20px;
    }
  `]
})
export class NavbarComponent {
  isLoggedIn = false;
  isCustomer = false;
  currentUser: any = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authService.currentUser.subscribe(user => {
      this.isLoggedIn = !!user;
      this.currentUser = user;
      this.isCustomer = user?.role === 'CUSTOMER';
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
