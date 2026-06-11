import api from "../axios"

export interface LoginInput {
  email: string
  password: string
}

export interface LoginResponse {
  token: string
  agent: {
    id: string
    email: string
    role: string
  }
}

export const login = async (data: LoginInput): Promise<LoginResponse> => {
  const response = await api.post("/api/v1/auth/login", data)
  return response.data
}