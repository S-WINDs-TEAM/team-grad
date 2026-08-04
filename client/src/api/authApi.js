import axiosInstance from "./axiosInstance";

const registerApi = (data) => axiosInstance.post("/auth/register", data);
const registerCompanyApi = (data) =>
  axiosInstance.post("/auth/register-company", data);
const loginApi = (data) => axiosInstance.post("/auth/login", data);
const logoutApi = () => axiosInstance.post("/auth/logout"); // data params removed
const getMeApi = () => axiosInstance.get("/auth/me");

// company_driver invite flow (link sent by the company_admin)
const validateInviteApi = (token) => axiosInstance.get(`/auth/invite/${token}`);
const acceptInviteApi = (token, data) =>
  axiosInstance.post(`/auth/invite/${token}/accept`, data);

const uploadProfilePhotoApi = (formData) =>
  axiosInstance.post("/auth/me/photo", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
export {
  registerApi,
  registerCompanyApi,
  loginApi,
  logoutApi,
  getMeApi,
  validateInviteApi,
  acceptInviteApi,
  uploadProfilePhotoApi,
};
