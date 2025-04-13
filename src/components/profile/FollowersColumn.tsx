
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck } from 'lucide-react';
import { UsersList, User } from './UsersList';
import { getFollowers, getFollowing } from './FollowersService';

interface FollowersColumnProps {
  userId: string;
}

export const FollowersColumn: React.FC<FollowersColumnProps> = ({ userId }) => {
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFollowersData = async () => {
      setIsLoading(true);
      try {
        // Load followers and following in parallel
        const [followersData, followingData] = await Promise.all([
          getFollowers(userId),
          getFollowing(userId)
        ]);
        
        setFollowers(followersData);
        setFollowing(followingData);
      } catch (error) {
        console.error('Error loading followers/following data:', error);
        // Set empty arrays on error
        setFollowers([]);
        setFollowing([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      loadFollowersData();
    }
  }, [userId]);

  const handleViewProfile = (id: string) => {
    navigate(`/usuario/${id}`);
  };

  return (
    <>
      <Card className="mb-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <Users className="h-4 w-4 mr-2 text-blue-500" />
            Seguidores ({followers.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsersList
            title=""
            users={followers}
            isLoading={isLoading}
            emptyMessage="Nenhum seguidor ainda"
            icon={<></>}
            onViewProfile={handleViewProfile}
            onViewAll={() => navigate(`/usuario/${userId}/seguidores`)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center">
            <UserCheck className="h-4 w-4 mr-2 text-green-500" />
            Seguindo ({following.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <UsersList
            title=""
            users={following}
            isLoading={isLoading}
            emptyMessage="Não seguindo ninguém ainda"
            icon={<></>}
            onViewProfile={handleViewProfile}
            onViewAll={() => navigate(`/usuario/${userId}/seguindo`)}
          />
        </CardContent>
      </Card>
    </>
  );
};
