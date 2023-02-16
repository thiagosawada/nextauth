import axios, { AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";

let cookies = parseCookies();
let isRefreshing = false; // Identifica se o app está atualizando o token
let failedRequestsQueue = [];

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

      // Configuração da requisição feita ao backend
      // Traz informações necessárias para repetir uma requisição ao backend
      // Rotas chamadas, parâmetros enviados, callbacks
      const originalConfig = error.config;

      if (!isRefreshing) {
        isRefreshing = true;

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
          failedRequestsQueue.forEach(request => request.onSuccess(token));
          failedRequestsQueue = [];
        }).catch(err => {
          failedRequestsQueue.forEach(request => request.onFailure(err));
          failedRequestsQueue = [];
        }).finally(() => {
          isRefreshing = false;
        });
      }

      // Retorna uma promise porque os interceptors do axios não aceitam o async
      return new Promise((resolve, reject) => {
        failedRequestsQueue.push({
          // O que acontece após a atualização do token
          onSuccess: (token: string) => {
            originalConfig.headers["Authorization"] = `Bearer ${token}`;

            // Passa todas as informações para fazer uma chamada à API de novo
            // A função resolve aguarda a execução de outros códigos
            resolve(api(originalConfig));
          },
          onFailure: (err: AxiosError) => {
            reject(err);
          },
        })
      })
    } else {
      // Deslogar o usuário
    }
  }
});
