import { Log, User, UserManager } from 'oidc-client';

export class AuthService {
  userManager;
  constructor() {
    const settings = {
      authority: process.env.REACT_APP_STS_AUTHORITY,
      client_id: process.env.REACT_APP_CLIENT_ID,
      redirect_uri: window.location.origin,
      silent_redirect_uri: window.location.origin + '?silent-renew=true',
      post_logout_redirect_uri: window.location.origin,
      response_type: process.env.REACT_APP_RESPONSE_TYPE,
      scope: process.env.REACT_APP_CLIENT_SCOPE
    };

    this.userManager = new UserManager(settings);

    Log.logger = console;
    Log.level = Log.INFO;
  }

  getUser() {
    return this.userManager.getUser();
  }

  login() {
    return this.userManager.signinRedirect();
  }

  renewToken() {
    return this.userManager.signinSilent();
  }

  logout() {
    return this.userManager.signoutRedirect();
  }
}
