export type credentials = {
  id: string;
  secret: string;
};

export type search = {
  type: string;
  query: string;
  limit?: number;
};

export type token = {
  expires_in: number;
  expires_at: number;
  access_token: string;
};

export type header = {
  Authorization: string;
};

export type searchOpts = { method: "GET"; uri: string; json: true; headers?: header };

export type tokenOpts = { method: "POST"; uri: string; form: { grant_type: "client_credentials" }; headers: header; json: true };

export type cb = (err: Error | null, data: any | null) => void;
