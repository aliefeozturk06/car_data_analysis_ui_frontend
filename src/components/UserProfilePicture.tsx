import React, { useEffect, useState, useCallback } from 'react';
import api from '../api/axiosConfig';
import { User } from 'lucide-react';

interface UserProfilePictureProps {
    username: string;
}

const UserProfilePicture: React.FC<UserProfilePictureProps> = ({ username }) => {
    const [profilePicBlob, setProfilePicBlob] = useState<string | null>(null);

    const fetchProfilePicture = useCallback(async () => {
        if (!username) return;
        try {
            const response = await api.get(`/users/${username}/profile-picture`, {
                responseType: 'blob'
            });

            if (response.data && response.data.size > 0) {
                const imageObjectURL = URL.createObjectURL(response.data);
                setProfilePicBlob(imageObjectURL);
            } else {
                setProfilePicBlob(null);
            }
        } catch (err) {
            console.error(`Profile picture could not be fetched for ${username}.`);
            setProfilePicBlob(null);
        }
    }, [username]);

    useEffect(() => {
        fetchProfilePicture();

        return () => {
            if (profilePicBlob) URL.revokeObjectURL(profilePicBlob);
        };
    }, [fetchProfilePicture]);

    return (
        <div style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#eee',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            border: '1px solid #ddd'
        }}>
            {profilePicBlob ? (
                <img
                    src={profilePicBlob}
                    alt={username}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
            ) : (
                <User size={14} color="#999" />
            )}
        </div>
    );
};

export default UserProfilePicture;