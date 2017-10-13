import * as rp from "request-promise";
import {
  credentials,
  search,
  cb,
  token,
  header,
  searchOpts,
  tokenOpts
} from "./types";
const TOKEN_URI = "https://accounts.spotify.com/api/token";
const SEARCH_URI = "https://api.spotify.com/v1/search?type=";

class Spotify {
  private token: token;
  constructor(private credentials: credentials) {
    if (!credentials || !credentials.id || !credentials.secret) {
      throw new Error(
        'Could not initialize Spotify client. You must supply an object containing your Spotify client "id" and "secret".'
      );
    }
    this.credentials = { id: credentials.id, secret: credentials.secret };
    this.token;
  }

  public search(search: search, cb?: cb) {
    let request;
    const opts: searchOpts = {
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
        .then((response: any) => cb(null, response))
        .catch((err: Error) => cb(err, null));
    } else {
      return request;
    }
  }

  public request(query: string, cb?: cb) {
    if (!query || typeof query !== "string") {
      throw new Error(
        "You must pass in a Spotify API endpoint to use this method."
      );
    }
    let request;
    const opts: searchOpts = { method: "GET", uri: query, json: true };

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
        .then((response: any) => cb(null, response))
        .catch((err: Error) => cb(err, null));
    } else {
      return request;
    }
  }

  private isTokenExpired(): boolean {
    if (this.token) {
      if (Date.now() / 1000 >= this.token.expires_at - 300) {
        return true;
      }
    }
    return false;
  }

  private setToken(): any {
    const opts = {
      method: "POST",
      uri: TOKEN_URI,
      form: { grant_type: "client_credentials" },
      headers: this.getCredentialHeader(),
      json: true
    };
    return rp(opts).then((token: token) => {
      this.token = token;
      const currentTime = new Date();
      const expireTime = new Date(+currentTime);
      return (this.token.expires_at =
        +expireTime / 1000 + this.token.expires_in);
    });
  }

  private getTokenHeader(): never | header {
    if (!this.token || !this.token.access_token) {
      throw new Error(
        "An error has occurred. Make sure you're using a valid client id and secret.'"
      );
    }
    return { Authorization: "Bearer " + this.token.access_token };
  }

  private getCredentialHeader(): header {
    return {
      Authorization:
        "Basic " +
        new Buffer(
          this.credentials.id + ":" + this.credentials.secret
        ).toString("base64")
    };
  }
}

export default Spotify;
