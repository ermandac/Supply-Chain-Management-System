import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthService } from '../auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  returnUrl: string = '/';
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    // redirect to home if already logged in
    if (this.authService.currentUserValue) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });

    // get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // convenience getter for easy access to form fields
  get f() { return this.loginForm.controls; }

  onSubmit() {
    this.submitted = true;
    this.error = '';

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      this.snackBar.open('Please fill in all required fields.', 'Close', {
        duration: 3000
      });
      return;
    }

    this.loading = true;
    this.authService.login(this.f['username'].value, this.f['password'].value)
      .pipe(first())
      .subscribe({
        next: (user) => {
          console.log('Login successful:', user);
          this.router.navigate([this.returnUrl]);
        },
        error: error => {
          console.error('Login error:', error);
          this.error = error?.error?.message || error?.message || 'An unexpected error occurred';
          
          let errorMessage = 'Login failed. ';
          if (error?.status === 503) {
            errorMessage += 'The service is temporarily unavailable. Please try again in a few moments.';
          } else if (error?.error?.message) {
            errorMessage += error.error.message;
          } else if (error?.status === 401) {
            errorMessage += 'Please check your credentials.';
          } else {
            errorMessage += 'An unexpected error occurred. Please try again.';
          }

          this.snackBar.open(errorMessage, 'Close', {
            duration: 6000,
            panelClass: ['error-snackbar']
          });
          
          this.loading = false;
        }
      });
  }
}
