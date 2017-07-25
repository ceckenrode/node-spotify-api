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
 * @type {Error} 
 * @type {Response}
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

    const _credentials = {
      id: credentials.id,
      secret: credentials.secret
    };

    let _token;

    /**
   * @param {Search} search search - An object describing what should be searched for.
   * @param {function(Error, Response)=} cb cb - A callback function to be executed once the search is completed. Accepts an error and response parameter. If no callback function is provided, search will return a promise.
   * @return {Promise<any> | Void}
   * 
   * @memberof Spotify
   */
    this.search = function(search, cb) {
      let request;
      const opts = {
        method: "GET",
        uri: SEARCH_URI +
          search.type +
          "&q=" +
          search.query +
          "&limit=" +
          (search.limit || "20"),
        json: true
      };

      if (!search || !search.type || !search.query) {
        throw new Error("You must specify a type and query for your search.");
      }

      if (
        !_token ||
        !_token.expires_in ||
        !_token.access_token ||
        _isTokenExpired()
      ) {
        request = _setToken().then(() => {
          opts.headers = _getTokenHeader();
          return rp(opts);
        });
      } else {
        opts.headers = _getTokenHeader();
        request = rp(opts);
      }

      if (cb) {
        request
          .then(response => cb(null, response))
          .catch(err => cb(err, null));
      } else {
        return request;
      }
    };

    /**
     * Checks to see if the token is expired or about to expire.
     * @returns {boolean}
     */
    function _isTokenExpired() {
      if (Date.now() / 1000 >= _token.expires_at - 300) {
        return true;
      }
    }

    /**
     * Gets and sets an authorization token using the client id and secret
     * @returns {Promise<any>} token
     */
    function _setToken() {
      const opts = {
        method: "POST",
        uri: TOKEN_URI,
        form: {
          grant_type: "client_credentials"
        },
        headers: _getCredentialHeader(),
        json: true
      };
      return rp(opts).then(token => {
        _token = token;
        const currentTime = new Date();
        const expireTime = new Date(currentTime);
        return (_token.expires_at = expireTime / 1000 + _token.expires_in);
      });
    }

    /**
     * Returns a formatted token header
     * @returns {Object}
     */
    function _getTokenHeader() {
      if (!_token || !_token.access_token) {
        throw new Error(
          "An error has occurred. Make sure you're using a valid client id and secret.'"
        );
      }
      return { Authorization: "Bearer " + _token.access_token };
    }

    /**
     * 
     * 
     * @returns {string}
     */
    function _getCredentialHeader() {
      return {
        Authorization: "Basic " +
          new Buffer(_credentials.id + ":" + _credentials.secret).toString(
            "base64"
          )
      };
    }
  }
}

module.exports = Spotify;
