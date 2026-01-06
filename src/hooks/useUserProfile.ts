import { useState, useEffect } from 'react';
import pb from '../lib/pocketbase';
import { useAuth } from '../context/AuthContext';

export const useUserProfile = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const updateProfile = async (data: { name?: string; avatar?: File }) => {
        if (!user) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            const formData = new FormData();
            if (data.name) formData.append('name', data.name);
            if (data.avatar) formData.append('avatar', data.avatar);

            await pb.collection('users').update(user.id, formData);
            setSuccess("Profile updated successfully.");
        } catch (err: any) {
            console.error("Profile update failed:", err);
            setError(err.message || "Failed to update profile.");
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (oldPassword: string, newPassword: string, newPasswordConfirm: string) => {
        if (!user) return;
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            // PocketBase doesn't require old password for admin updates, but for user self-update it's good practice
            // However, the SDK method for updating password is just updating the record with password and passwordConfirm
            // BUT, for security, usually you need the old password to verify identity first.
            // PocketBase 'users' collection update checks:
            // If you are updating your own record, you just send 'password', 'passwordConfirm', and 'oldPassword'
            
            await pb.collection('users').update(user.id, {
                oldPassword,
                password: newPassword,
                passwordConfirm: newPasswordConfirm,
            });
            setSuccess("Password changed successfully.");
        } catch (err: any) {
            console.error("Password change failed:", err);
            setError(err.message || "Failed to change password.");
        } finally {
            setLoading(false);
        }
    };

    return { updateProfile, changePassword, loading, error, success };
};
