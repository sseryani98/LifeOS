import axios from "axios";

import type { HttpClient } from "./types.js";

/** Default HTTP client — delegates to axios so jest.mock('axios') can stub it. */
export const defaultHttpClient: HttpClient = {
  get: url => axios.get(url),
  post: (url, body) => axios.post(url, body),
};
