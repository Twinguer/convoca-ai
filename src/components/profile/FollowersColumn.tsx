
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Users } from 'lucide-react';
import { getFollowers } from './FollowersService';

interface Follower {
  id: string;
  name: string;
  avatar_url?: string | null;
}

interface FollowersColumnProps {
  userId: string;
}

export const FollowersColumn: React.FC<FollowersColumnProps> = ({ userId }) => {
  const [followers, setFollowers] = useState<Follower[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadFollowers = async () => {
      try {
        setLoading(true);
        const followersList = await getFollowers(userId);
        setFollowers(followersList);
      } catch (error) {
        console.error('Error loading followers:', error);
      } finally {
        setLoading(false);
      }
    };
    
    if (userId) {
      loadFollowers();
    }
  }, [userId]);
  
  const handleViewProfile = (followerId: string) => {
    navigate(`/usuario/${followerId}`);
  };
  
  const handleViewAllFollowers = () => {
    navigate(`/seguidores/${userId}`);
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Seguidores
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 flex justify-center">
            <div className="animate-spin h-6 w-6 border-2 border-emerald-600 rounded-full border-t-transparent"></div>
          </div>
        ) : followers.length > 0 ? (
          <div className="space-y-1">
            {followers.slice(0, 5).map(follower => (
              <div 
                key={follower.id} 
                className="flex items-center p-2 rounded-md hover:bg-gray-50 cursor-pointer"
                onClick={() => handleViewProfile(follower.id)}
              >
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={follower.avatar_url || undefined} alt={follower.name} />
                  <AvatarFallback>{follower.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{follower.name}</span>
              </div>
            ))}
            
            {followers.length > 5 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-2"
                onClick={handleViewAllFollowers}
              >
                Ver todos ({followers.length})
              </Button>
            )}
          </div>
        ) : (
          <p className="text-center text-sm text-muted-foreground py-4">
            Nenhum seguidor encontrado
          </p>
        )}
      </CardContent>
    </Card>
  );
};
