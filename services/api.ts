import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";

let cookies = parseCookies();

export const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    // Importante atualizar esse header depois de fazer login
    Authorization: `Bearer ${cookies["nextauth.token"]}`
  }
});

// use("o que fazer se a resposta deu sucesso", "o que fazer se deu erro")
api.interceptors.response.use(response => {
  return response;
}, (error: AxiosError) => {
  if (error.response.status === 401) {
    if (error.response.data?.code === "token.expired") {
      // Renovar o token
      cookies = parseCookies();

      const { "nextauth.refreshToken": refreshToken } = cookies;
      api.post("/refresh", { refreshToken }).then(response => {
        const { token } = response.data;

        setCookie(undefined, "nextauth.token", token, {
          maxAge: 60 * 60 * 24 * 30, // 30 di as
          path: "/"
        });

        setCookie(undefined, "nextauth.refreshToken", response.data.refreshToken, {
          maxAge: 60 * 60 * 24 * 30, // 30 dias
          path: "/"
        });

        api.defaults.headers["Authorization"] = `Bearer ${token}`;
      })
    } else {
      // Deslogar o usuário
    }
  }
});
