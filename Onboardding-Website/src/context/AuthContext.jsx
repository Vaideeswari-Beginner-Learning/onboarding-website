import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

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

    const loginAdmin = async (email, password) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Login failed');
            }
            const data = await response.json();
            setUser(data.user);
            localStorage.setItem('onboarding_user', JSON.stringify(data.user));
            return { success: true };
        } catch (error) {
            console.error(error);
            return { success: false, message: error.message };
        }
    };

    const sendOtp = async (email) => {
        try {
            await fetch('/api/auth/otp/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            return true;
        } catch (error) {
            console.error(error);
            return false;
        }
    };

    const updateCandidate = async (updateData) => {
        try {
            // We need the email to identify the user. Use the one from context if available, or from the data.
            const email = user?.email || updateData.email;
            if (!email) throw new Error('No user email found to update');

            const response = await fetch('/api/candidates/update', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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
            const response = await fetch('/api/auth/otp/verify', {
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
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData),
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Registration failed');
            }
            const data = await response.json();
            setUser(data.user);
            localStorage.setItem('onboarding_user', JSON.stringify(data.user));
            return true;
        } catch (error) {
            console.error(error);
            alert(error.message);
            return false;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loginAdmin, sendOtp, verifyOtp, register, updateCandidate, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
