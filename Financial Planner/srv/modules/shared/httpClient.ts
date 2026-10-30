import axios from "axios";

import type { HttpClient, HttpResponse } from "./types.js";

/** Default HTTP client — delegates to axios so jest.mock('axios') can stub it. */
export class DefaultHttpClient implements HttpClient {
  /**
   * Issues a GET through axios.
   * @param url Absolute URL to fetch.
   * @returns The axios response, structurally an HttpResponse.
   */
  get<T>(url: string): Promise<HttpResponse<T>> {
    return axios.get<T>(url);
  }

  /**
   * Issues a POST through axios.
   * @param url Absolute URL to post to.
   * @param body Optional request body.
   * @returns The axios response, structurally an HttpResponse.
   */
  post<T>(url: string, body?: unknown): Promise<HttpResponse<T>> {
    return axios.post<T>(url, body);
  }
}
