import axios from "axios";
import { parseCookies } from "nookies";

const cookies = parseCookies();

export const api = axios.create({
  baseURL: "http://localhost:3333",
  headers: {
    // Importante atualizar esse header depois de fazer login
    Authorization: `Bearer ${cookies["nextauth.token"]}`
  }
});