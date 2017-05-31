const rp = require("request-promise");
const TOKEN_URI = "https://accounts.spotify.com/api/token";
const SEARCH_URI = "https://api.spotify.com/v1/search?type=";

/**
 * @typedef {Object} Search
 * @property {string} type - The type of search which should be performed.
 * @property {string} query - What should be searched for.
 * @typedef {Object} Credentials
 * @property {string} id - A Spotify client id.
 * @property {string} secret - A Spotify client secret.
 */
/**
 * @type {Error} 
 * @type {Response}
 * @type {Promise<object>}
 * @type {Void}
 */

/**
 * Spotify class.
 * @class Spotify
 */
class Spotify {
  /**
   * @param {Credentials} credentials credentials - An object containing a Spotify client id and secret.
   */
  constructor(credentials) {
    if (!credentials || !credentials.id || !credentials.secret) {
      throw new Error(
        'Could not initialize Spotify client. You must supply an object containing your Spotify client "id" and "secret".'
      );
    }
    this.credentials = {
      id: credentials.id,
      secret: credentials.secret
    };
    this.getCredentialHeader = this.getCredentialHeader.bind(this);
    this.getTokenHeader = this.getTokenHeader.bind(this);
    this.setToken = this.setToken.bind(this);
    this.search = this.search.bind(this);
  }
  
  getCredentialHeader() {
    return {
      Authorization: "Basic " +
        new Buffer(
          this.credentials.id + ":" + this.credentials.secret
        ).toString("base64")
    };
  }

  getTokenHeader() {
    if (!this.token || !this.token.access_token) {
      throw new Error(
        "An error has occurred. Make sure you're using a valid client id and secret.'"
      );
    }
    return { Authorization: "Bearer " + this.token.access_token };
  }

  setToken() {
    const opts = {
      method: "POST",
      uri: TOKEN_URI,
      form: {
        grant_type: "client_credentials"
      },
      headers: this.getCredentialHeader()
    };

    return rp(opts).then(token => {
      this.token = JSON.parse(token);
      const currentTime = new Date();
      const expireTime = new Date(currentTime);
      return (this.token.expires_at =
        expireTime / 1000 + this.token.expires_in);
    });
  }
  
  isTokenExpired() {
    if (Date.now() / 1000 >= this.token.expires_at - 300) {
      return true;
    }
  }

  /**
   * @param {Search} search search - An object describing what should be searched for.
   * @param {function(Error, Response)=} cb cb - A callback function to be executed once the search is completed. Accepts an error and response parameter. If no callback function is provided, search will return a promise.
   * @return {Promise<object> | Void}
   * 
   * @memberof Spotify
   */
  search(search, cb) {
    let opts = {};
    let request;
    if (!search || !search.type || !search.query) {
      throw new Error("You must specify a type and query for your search.");
    }
    if (!this.token || this.isTokenExpired()) {
      request = this.setToken().then(() => {
        opts = {
          method: "GET",
          uri: SEARCH_URI +
            search.type +
            "&q=" +
            search.query +
            "&limit=" +
            (search.limit || "20"),
          headers: this.getTokenHeader()
        };
        return rp(opts);
      });
    } else {
      opts = {
        method: "GET",
        uri: SEARCH_URI +
          search.type +
          "&q=" +
          search.query +
          "&limit=" +
          (search.limit || "20"),
        headers: this.getTokenHeader()
      };
      request = rp(opts);
    }
    if (cb) {
      request.then(response => cb(null, response)).catch(err => cb(err, null));
    } else {
      return request;
    }
  }
}

module.exports = Spotify;
