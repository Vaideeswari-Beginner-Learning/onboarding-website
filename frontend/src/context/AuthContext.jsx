import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const FRONTEND_VERSION = '2.1.0-STABLE';
// NOTE: API_BASE is set AFTER getApiBase is defined below. See line ~34.
// Fallback logic for local development if VITE_API_URL is missing
const getApiBase = () => {
    // Determine if we are running in a local dev environment vs production
    const isLocalhost = typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

    // For local development with Vite
    if (isLocalhost) {
        return `http://${window.location.hostname}:5000`;
    }
    
    // FORCED PRODUCTION URL: 
    // This absolutely guarantees that the frontend won't attempt to use localhost
    // or rely on a broken Vercel /api proxy. It points directly to the live Render backend.
    return 'https://onboarding-website-1.onrender.com'; 
};
export const ACTUAL_API_BASE = getApiBase();
// API_BASE is an alias for ACTUAL_API_BASE - properly resolves to Render in production
export const API_BASE = ACTUAL_API_BASE;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulate checking local storage for session
        const storedUser = localStorage.getItem('onboarding_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    console.log('DEBUG: VITE_API_URL =', import.meta.env.VITE_API_URL);
    console.log('DEBUG: ACTUAL_API_BASE =', ACTUAL_API_BASE);
    if (typeof window !== 'undefined') {
        console.log('DEBUG: Current Location =', window.location.origin);
        console.log('DEBUG: Frontend Version =', FRONTEND_VERSION);
    }


    const login = async (email, password) => {
        try {
            const url = `${ACTUAL_API_BASE}/api/auth/login`;
            console.log('--- UNIFIED LOGIN START ---');
            console.log('URL:', url);
            console.log('Method: POST');
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const text = await response.text();
                console.error(`DEBUG: Login response not OK (${response.status}):`, text.substring(0, 100));
                let errorData = {};
                try {
                    errorData = JSON.parse(text);
                } catch (e) {
                    throw new Error(`Server Error (${response.status}): ${text.includes('<!DOCTYPE html>') ? 'Received HTML instead of JSON' : text.substring(0, 50)}...`);
                }
                throw new Error(errorData.message || 'Login failed');
            }
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("Invalid response from server. Please check backend deployment.");
            }
            setUser(data.user);
            if (data.token) {
                localStorage.setItem('onboarding_token', data.token);
            }
            localStorage.setItem('onboarding_user', JSON.stringify(data.user));
            return { success: true, role: data.user.role };
        } catch (error) {
            console.error(error);
            alert(`LOGIN FAILED\nURL: ${url}\nError: ${error.message}`);
            return { success: false, message: error.message };
        }
    };



    // Deprecated: OTP Functions (kept for reference if needed later, but unused)
    const sendOtp = async (email) => { return true; };
    // const verifyOtp = ... (removed to clean up)

    const updateCandidate = async (updateData) => {
        try {
            // We need the email to identify the user. Use the one from context if available, or from the data.
            const email = user?.email || updateData.email;
            if (!email) throw new Error('No user email found to update');

            const token = localStorage.getItem('onboarding_token');
            const response = await fetch(`${ACTUAL_API_BASE}/api/candidates/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email, ...updateData }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Update failed');
            }

            const data = await response.json();

            // Merge updated fields into current user state
            const updatedUser = { ...user, ...data.user };
            setUser(updatedUser);
            localStorage.setItem('onboarding_user', JSON.stringify(updatedUser));

            return { success: true };
        } catch (error) {
            console.error('Update Candidate Error:', error);
            return { success: false, message: error.message };
        }
    };

    const verifyOtp = async (email, otp) => {
        try {
            const response = await fetch(`${ACTUAL_API_BASE}/api/auth/otp/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, otp }),
            });
            if (!response.ok) throw new Error('Verification failed');
            const data = await response.json();
            setUser(data.user);
            localStorage.setItem('onboarding_user', JSON.stringify(data.user));
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('onboarding_user');
        setUser(null);
    };

    const register = async (userData) => {
        try {
            const url = `${ACTUAL_API_BASE}/api/auth/register`;
            console.log('--- REGISTER START ---');
            console.log('URL:', url);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            if (!response.ok) {
                const text = await response.text();
                console.error(`DEBUG: Register response not OK (${response.status}):`, text.substring(0, 100));
                let err = {};
                try {
                    err = JSON.parse(text);
                } catch (e) {
                    throw new Error(`Server Error (${response.status}): ${text.includes('<!DOCTYPE html>') ? 'Received HTML instead of JSON' : text.substring(0, 50)}...`);
                }
                throw new Error(err.message || 'Registration failed');
            }
            const text = await response.text();
            let data;
            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("Invalid response from server. Please check backend deployment.");
            }
            setUser(data.user);
            if (data.token) {
                localStorage.setItem('onboarding_token', data.token);
            }
            localStorage.setItem('onboarding_user', JSON.stringify(data.user));
            return true;
        } catch (error) {
            console.error(error);
            alert(`REGISTRATION FAILED\nURL: ${url}\nError: ${error.message}`);
            return false;
        }
    };

    const submitOnboarding = async (name, email) => {
        try {
            const token = localStorage.getItem('onboarding_token');
            const response = await fetch(`${ACTUAL_API_BASE}/api/onboard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name, email }),
            });
            const text = await response.text();
            try {
                return JSON.parse(text);
            } catch (e) {
                return { success: false, message: "Invalid server response" };
            }
        } catch (error) {
            console.error('Submit Onboarding Error:', error);
            return { success: false, message: error.message };
        }
    };

    return (
        <AuthContext.Provider value={{
            user, login, sendOtp, verifyOtp, register, updateCandidate, logout, loading, submitOnboarding
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
