import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot) {
    const roles = route.data['roles'] as Array<string>;
    const user = this.authService.currentUserValue;

    if (user && roles.includes(user.role)) {
      return true;
    }

    // role not authorized so redirect to home page
    this.router.navigate(['/']);
    return false;
  }
}
