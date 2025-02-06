import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { LoginComponent } from './auth/login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { InventoryComponent } from './inventory/inventory.component';
import { OrdersComponent } from './orders/orders.component';
import { DeliveryComponent } from './delivery/delivery.component';

import { AuthGuard } from './auth/auth.guard';
import { RoleGuard } from './auth/role.guard';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { 
    path: 'dashboard', 
    component: DashboardComponent, 
    canActivate: [AuthGuard] 
  },
  { 
    path: 'inventory', 
    component: InventoryComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'INVENTORY_STAFF'] }
  },
  { 
    path: 'orders', 
    component: OrdersComponent, 
    canActivate: [AuthGuard],
    data: { roles: ['ADMIN', 'CUSTOMER', 'INVENTORY_STAFF'] }
  },
  { 
    path: 'delivery', 
    component: DeliveryComponent, 
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'LOGISTICS_MANAGER'] }
  },
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: '**', redirectTo: '/dashboard' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
