import axios from "axios";
export const api = axios.create({
  baseURL: typeof window !== 'undefined' ? "/api" : process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});
api.interceptors.response.use((response) => {
  return response;
}, async (error) => {
  console.error('Response error:', {
    url: error.config?.url,
    status: error.response?.status,
    data: error.response?.data
  });
  return Promise.reject(error);
});
