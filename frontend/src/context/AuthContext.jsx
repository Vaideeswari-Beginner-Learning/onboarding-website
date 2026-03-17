import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const FRONTEND_VERSION = '1.0.4-DEBUG';
export const API_BASE = import.meta.env.VITE_API_URL || 'https://onboarding-website-1.onrender.com';
// Fallback logic for local development if VITE_API_URL is missing
const getApiBase = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl && envUrl.startsWith('http')) return envUrl;

    if (typeof window !== 'undefined') {
        const { hostname, protocol } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
            return `${protocol}//${hostname}:5000`;
        }
    }
    return 'https://onboarding-website-1.onrender.com';
};
export const ACTUAL_API_BASE = getApiBase();

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


    const loginAdmin = async (email, password) => {
        try {
            const url = `${ACTUAL_API_BASE}/api/auth/login`;
            console.log(`DEBUG: Calling Login URL: ${url}`);
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
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, message: error.message };
        }
    };

    const loginCandidate = async (email) => {
        try {
            const url = `${ACTUAL_API_BASE}/api/auth/candidate/login`;
            console.log(`DEBUG: Calling Candidate Login URL: ${url}`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            if (!response.ok) {
                const text = await response.text();
                console.error(`DEBUG: Candidate Login response not OK (${response.status}):`, text.substring(0, 100));
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
            return { success: true };
        } catch (error) {
            console.error('Candidate Login Error:', error);
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
            console.log(`DEBUG: Calling Register URL: ${url}`);
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
            alert(error.message);
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
            user, loginAdmin, loginCandidate, sendOtp, verifyOtp, register, updateCandidate, logout, loading, submitOnboarding
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
