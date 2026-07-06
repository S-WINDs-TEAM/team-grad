import { useSelector, useDispatch } from 'react-redux';
import { setUser, clearUser, setLoading } from '../store/authSlice';
import { loginApi, logoutApi, getMeApi } from '../api/authApi';

const useAuth = () => {
    const dispatch = useDispatch();
    const {user, isAuthenticated, loading} = useSelector((state)=> state.auth);

    const login = async (credentials) => {
        dispatch(setLoading(true));
        try{
            const response = await loginApi(credentials);
            dispatch(setUser(response.data.user));

        }finally{
            dispatch(setLoading(false));
        }
        // return response;
    }


const logout = async ()=> {
    dispatch(setLoading(true));
    try {
        await logoutApi();
        dispatch(clearUser());
        
    } finally  {
        dispatch(setLoading(false));
    }
};

const loadUser = async () => {
    dispatch(setLoading(true));
    try{
        const response = await getMeApi();
        dispatch(setUser(response.data.user));
    }catch{
        dispatch(clearUser());
    }finally{
        dispatch(setLoading(false));
    }
};

return {user, isAuthenticated, loading, login, logout, loadUser}
};

export default useAuth;