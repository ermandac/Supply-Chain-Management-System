import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { map, retryWhen, mergeMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Router } from '@angular/router';

export interface User {
  _id: string;  // MongoDB uses _id
  username: string;
  email: string;
  role: string;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  constructor(private http: HttpClient, private router: Router) {
    const storedUser = localStorage.getItem(environment.tokenKey);
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  login(username: string, password: string) {
    return this.http.post<any>(`${environment.apiUrl}/auth/login`, { username, password })
      .pipe(
        retryWhen(errors =>
          errors.pipe(
            mergeMap((error, index) => {
              // Only retry on 503 errors, up to 2 times
              if (error.status === 503 && index < 2) {
                // Wait 2 seconds before retrying
                return timer(2000);
              }
              return throwError(() => error);
            })
          )
        ),
        map(user => {
          if (user && user.token) {
            // store user details and jwt token in local storage
            localStorage.setItem(environment.tokenKey, JSON.stringify(user));
            this.currentUserSubject.next(user);
            return user;
          }
          throw new Error('Login failed: Invalid response from server');
        })
      );
  }

  logout() {
    // remove user from local storage to log user out
    localStorage.removeItem(environment.tokenKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  hasRole(requiredRole: string): boolean {
    const user = this.currentUserValue;
    if (!user) return false;
    return user.role === requiredRole;
  }

  isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  getUserRole(): string {
    return this.currentUserValue?.role || '';
  }
}
