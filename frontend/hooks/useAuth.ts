"use client"

import { useRouter } from "next/navigation"

export const useAuth = () => {
  const router = useRouter()

  const getToken = () => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("token")
  }

  const getAgent = () => {
    if (typeof window === "undefined") return null
    const agent = localStorage.getItem("agent")
    return agent ? JSON.parse(agent) : null
  }

  const saveAuth = (token: string, agent: object) => {
    localStorage.setItem("token", token)
    localStorage.setItem("agent", JSON.stringify(agent))
  }

  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("agent")
    router.push("/login")
  }

const isAuthenticated = () => true

  return { getToken, getAgent, saveAuth, logout, isAuthenticated }
}