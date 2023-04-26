/*
 * Copyright 2022 VMware, Inc.
 * SSPDX-License-Identifier: Apache-2.0
 */

import { Component, OnInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
// import { compile } from 'src/utils/compile';
// import jwt_decode from 'jwt-decode';
import { AuthService } from 'src/app/service/auth-service.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.less']
})
export class LoginComponent implements OnInit {
  //form is login information form
  form: any = {
    username: null,
    password: null
  };
  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    const redirect = sessionStorage.getItem('lifecycleManager-redirect')
    if (redirect) {
    }
  }

  username: string = "";
  password: string = "";
  loading = false;
  submitted = false;
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = "Service Error!";
  decode: any;
  //onSubmit is to submit the login information
  onSubmit(): void {
    this.submitted = true;
    this.loading = true;
    const { username, password } = this.form;
    this.authService.login(username, password)
      .subscribe(
        data => {
          this.isLoginFailed = false;
          this.isLoggedIn = true;
          //decode JWT token
          var token = data.data;
          // this.decode = jwt_decode(token);
          // store username, id in seesion storage
          // const encryptName: string = compile(this.decode["name"]);
          sessionStorage.setItem('username', 'encryptName');
          sessionStorage.setItem('userId', this.decode["id"]);
          // redirect pre page
          const redirect = sessionStorage.getItem('lifecycleManager-redirect')
          if (redirect) {
            this.router.navigate([redirect])
            sessionStorage.removeItem('lifecycleManager-redirect')
            try {
            } catch (error) {

            }
          } else {
            this.router.navigate(['']);
            try {
            } catch (error) {

            }
          }
        },
        err => {
          if (err.error.message) this.errorMessage = err.error.message
          this.isLoginFailed = true;
        }
      );
  }
}

