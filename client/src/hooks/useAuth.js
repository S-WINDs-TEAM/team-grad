import { useSelector, useDispatch } from "react-redux";
import { setUser, clearUser, setLoading } from "../store/authSlice";
import { loginApi, logoutApi, getMeApi } from "../api/authApi";

const useAuth = () => {
  const dispatch = useDispatch();
  // NOTE: "(state)=>" (no space) IS valid JS, so this was not actually a bug.
  // Kept the space for readability/consistency. The selector grabs the auth slice.
  const { user, isAuthenticated, loading } = useSelector((state) => state.auth);

  const login = async (credentials) => {
    dispatch(setLoading(true));
    try {
      const response = await loginApi(credentials);
      dispatch(setUser(response.data.user));
      return response; // needed so callers (LoginPage) can redirect based on response.data.user.role
    } finally {
      dispatch(setLoading(false));
    }
    // return response;
  };

  const logout = async () => {
    dispatch(setLoading(true));
    try {
      await logoutApi();
      dispatch(clearUser());
    } finally {
      dispatch(setLoading(false));
    }
  };

  const loadUser = async () => {
    dispatch(setLoading(true));
    try {
      const response = await getMeApi();
      dispatch(setUser(response.data.user));
    } catch {
      dispatch(clearUser());
    } finally {
      dispatch(setLoading(false));
    }
  };

  return { user, isAuthenticated, loading, login, logout, loadUser };
};

export default useAuth;
