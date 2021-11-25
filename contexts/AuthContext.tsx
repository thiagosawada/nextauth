import { createContext, ReactNode, useState } from "react";
import { setCookie } from "nookies";
import Router from "next/router";
import { api } from "../services/api";

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type SignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  user: User;
  isAuthenticated: boolean;
}

type AuthProviderProps = {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User>();
  const isAuthenticated = !!user;

  async function signIn({ email, password }: SignInCredentials) {
    try {
      const response = await api.post("sessions", { email, password, });
      const {
        permissions,
        roles,
        // Necessário preservá-las mesmo se o usuário atualiza a página
        token,
        refreshToken,
      } = response.data;

      setCookie(undefined, "nextauth.token", token, {
        // Por quanto tempo vai manter o cookie salvo no navegador
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: "/", // Quais caminhos da aplicação terão acesso ao cookie (cookie global)
      });
      setCookie(undefined, "nextauth.refreshToken", refreshToken, {
        maxAge: 60 * 60 * 24 * 30, // 30 dias
        path: "/",
      });

      setUser({ email, permissions, roles, });
      Router.push("/dashboard");
    } catch (err) {
      console.log(err);
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, signIn }}>
      { children }
    </AuthContext.Provider>
  )
}