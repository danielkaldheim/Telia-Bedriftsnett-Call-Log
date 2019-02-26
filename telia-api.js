'use strict';
var MD5 = require('md5.js');
const qs = require('querystring');
const http = require('https');

class TeliaApi {
  constructor() {
    this.BNAPI2 = null;
    this.user = {};
  }

  authenticate(username, password) {
    return new Promise(resolve => {
      const hash = new MD5().update(password).digest('hex');

      const formData = qs.stringify({
        userpassword: password,
        username: username,
        password: hash
      });
      const contentLength = formData.length;
      const headers = {
        'content-length': contentLength,
        'user-agent': 'BedriftsnettTelia/12 CFNetwork/978.0.5 Darwin/18.5.0',
        'content-type': 'application/x-www-form-urlencoded'
      };

      const options = {
        method: 'POST',
        hostname: 'apit.phonero.net',
        port: null,
        path: '/telia/mobileapp/1.0/authenticate',
        headers: headers
      };

      const req = http.request(options, res => {
        const chunks = [];

        res.on('data', chunk => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const cookies = res.headers['set-cookie'];
          this._getCookies(cookies);

          const body = Buffer.concat(chunks);
          const content = JSON.parse(body.toString());
          if (res.statusCode === 200) {
            resolve(content);
          } else {
            if (content.error) {
              throw new Error(content.message);
            } else {
              throw new Error('Failed to fetch content');
            }
          }
        });
      });
      req.write(formData);
      req.end();
    });
  }

  getUserMobileNumber() {
    if (this.user) {
      return this.user.mobilenumber;
    }
    return null;
  }

  getCallLog(limit) {
    return this._sendRequest('/mobileapp/4.0/calllog', {
      queue_calls: 0,
      limit: limit
    });
  }

  _sendRequest(path, form) {
    return new Promise(resolve => {
      const formData = qs.stringify(form);
      const contentLength = formData.length;
      const headers = {
        cookie: 'BNAPI2=' + this.getBNAPI2(),
        'content-length': contentLength,
        'user-agent': 'BedriftsnettTelia/12 CFNetwork/978.0.5 Darwin/18.5.0',
        'content-type': 'application/x-www-form-urlencoded'
      };

      const options = {
        method: 'POST',
        hostname: 'apit.phonero.net',
        port: null,
        path: path,
        headers: headers
      };

      const req = http.request(options, res => {
        const chunks = [];

        res.on('data', chunk => {
          chunks.push(chunk);
        });

        res.on('end', () => {
          const body = Buffer.concat(chunks);
          const content = JSON.parse(body.toString());
          if (res.statusCode === 200) {
            resolve(content);
          } else {
            if (content.error) {
              throw new Error(content.message);
            } else {
              throw new Error('Failed to fetch content');
            }
          }
        });
      });
      req.write(formData);
      req.end();
    });
  }
  _getCookies(cookies) {
    for (const cookie of cookies) {
      const csplit = cookie.split(';');
      const parsedContent = qs.parse(csplit[0]);
      if (parsedContent.BNAPI2) {
        this.setBNAPI2(parsedContent.BNAPI2);
      }
    }
  }
  setBNAPI2(val) {
    this.BNAPI2 = val;
  }

  getBNAPI2() {
    return this.BNAPI2;
  }
}

module.exports = TeliaApi;
