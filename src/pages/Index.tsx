import FileManager from '@/components/FileManager';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

const Index = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar with user info and logout */}
      <div className="bg-white border-b px-6 py-3 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-foreground">
            {user?.name || `${user?.role === 'student' ? 'Student' : 'Host'}`}
          </span>
          <span className="text-xs text-muted-foreground">
            ({user?.role})
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
      
      <FileManager />
    </div>
  );
};

export default Index;
