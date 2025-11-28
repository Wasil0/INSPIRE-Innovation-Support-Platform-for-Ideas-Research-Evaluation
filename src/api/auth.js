import axios from "./axiosConfig";

export async function signup(gsuite_id, password, role) {
  return axios.post("/auth/signup/", {
    gsuite_id,
    password,
    role,
  });
}

export async function login(gsuite_id, password) {
  return axios.post("/auth/signin/", {
    gsuite_id,
    password,
  });
}
