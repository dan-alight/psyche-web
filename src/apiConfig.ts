const protocol = import.meta.env.VITE_API_PROTOCOL;
const host = import.meta.env.VITE_API_HOST;
const port = import.meta.env.VITE_API_PORT;

export const apiConfig = {
  HTTP_URL: `${protocol}://${host}:${port}`,
  WS_URL: `${protocol === "https" ? "wss" : "ws"}://${host}:${port}`,
};
