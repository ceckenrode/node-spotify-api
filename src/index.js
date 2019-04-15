const rp =  require("request-promise");
const TOKEN_URI = "https://accounts.spotify.com/api/token";
const SEARCH_URI = "https://api.spotify.com/v1/search?type=";

class Spotify {
  constructor(credentials) {
    if (!credentials || !credentials.id || !credentials.secret) {
      throw new Error(
        'Could not initialize Spotify client. You must supply an object containing your Spotify client "id" and "secret".'
      );
    }
    this.credentials = { id: credentials.id, secret: credentials.secret };
    this.token;
  }

  search(search, cb) {
    let request;
    const opts = {
      method: "GET",
      uri:
        SEARCH_URI +
        search.type +
        "&q=" +
        encodeURIComponent(search.query) +
        "&limit=" +
        (search.limit || "20"),
      json: true
    };

    if (!search || !search.type || !search.query) {
      throw new Error("You must specify a type and query for your search.");
    }

    if (
      !this.token ||
      !this.token.expires_in ||
      !this.token.expires_at ||
      !this.token.access_token ||
      this.isTokenExpired()
    ) {
      request = this.setToken().then(() => {
        opts.headers = this.getTokenHeader();
        return rp(opts);
      });
    } else {
      opts.headers = this.getTokenHeader();
      request = rp(opts);
    }

    if (cb) {
      request
        .then((response) => cb(null, response))
        .catch((err) => cb(err, null));
    } else {
      return request;
    }
  }

  request(query, cb) {
    if (!query || typeof query !== "string") {
      throw new Error(
        "You must pass in a Spotify API endpoint to use this method."
      );
    }
    let request;
    const opts = { method: "GET", uri: query, json: true };

    if (
      !this.token ||
      !this.token.expires_in ||
      !this.token.expires_at ||
      !this.token.access_token ||
      this.isTokenExpired()
    ) {
      request = this.setToken().then(() => {
        opts.headers = this.getTokenHeader();
        return rp(opts);
      });
    } else {
      opts.headers = this.getTokenHeader();
      request = rp(opts);
    }

    if (cb) {
      request
        .then((response) => cb(null, response))
        .catch((err) => cb(err, null));
    } else {
      return request;
    }
  }

  isTokenExpired() {
    if (this.token) {
      if (Date.now() / 1000 >= this.token.expires_at - 300) {
        return true;
      }
    }
    return false;
  }

  setToken() {
    const opts = {
      method: "POST",
      uri: TOKEN_URI,
      form: { grant_type: "client_credentials" },
      headers: this.getCredentialHeader(),
      json: true
    };
    return rp(opts).then((token) => {
      this.token = token;
      const currentTime = new Date();
      const expireTime = new Date(+currentTime);
      return (this.token.expires_at =
        +expireTime / 1000 + this.token.expires_in);
    });
  }

  getTokenHeader() {
    if (!this.token || !this.token.access_token) {
      throw new Error(
        "An error has occurred. Make sure you're using a valid client id and secret.'"
      );
    }
    return { Authorization: "Bearer " + this.token.access_token };
  }

  getCredentialHeader() {
    return {
      Authorization:
        "Basic " +
        Buffer.from(
          this.credentials.id + ":" + this.credentials.secret
        , "ascii").toString("base64")
    };
  }
}

module.exports = Spotify;
