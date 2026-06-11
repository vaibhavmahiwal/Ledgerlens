import api from "../axios"

export const uploadStatement = async (formData: FormData) => {
  const response = await api.post("/api/v1/statements/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data
}

export const getJobs = async (params?: {
  page?: number
  limit?: number
  status?: string
}) => {
  const response = await api.get("/api/v1/jobs", { params })
  return response.data
}

export const getJobStatus = async (jobId: string) => {
  const response = await api.get(`/api/v1/statements/status/${jobId}`)
  return response.data
}