import axios from 'axios';
import router from './router';
// Mengambil URL root backend dari environment variable (.env / .env.production)
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

const axiosInstance = axios.create({
    baseURL: `${backendUrl}/api/v1/user`, // Otomatis menyesuaikan environment
    withCredentials: true,
    withXSRFToken: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Response Interceptor untuk 401
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            if (router.currentRoute.value.name !== 'login') {
                router.push({ name: 'login' });
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;