import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import hostProfileImage from '@/assets/host-profile.png';

export const Login = () => {
  const {
    login
  } = useAuth();
  const [showHostLogin, setShowHostLogin] = useState(false);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const handleStudentLogin = async () => {
    setLoading(true);
    try {
      await login('student');
    } catch (error) {
      console.error('Student login error:', error);
      setError('Failed to enter as student. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleHostLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    if (password !== 'bigmike@905') {
      setError('Incorrect password');
      return;
    }
    setLoading(true);
    try {
      await login('host', name.trim());
    } catch (error) {
      console.error('Host login error:', error);
      setError('Failed to log in as host. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center p-4 relative" style={{
    backgroundColor: 'hsl(var(--login-bg))'
  }}>
      {/* Main content */}
      <div className="flex flex-col items-center space-y-8 w-full max-w-md">
        <h1 className="font-brush text-6xl md:text-7xl text-white text-center drop-shadow-lg">
          Welcome
        </h1>
        
        {!showHostLogin ? <div className="space-y-4 w-full">
            <Button onClick={handleStudentLogin} disabled={loading} className="w-full h-14 text-lg bg-white text-gray-800 hover:bg-gray-100 shadow-lg">
              {loading ? 'Entering...' : 'Enter as Student'}
            </Button>
            
            <Button onClick={() => setShowHostLogin(true)} disabled={loading} className="w-full h-14 text-lg bg-white text-gray-800 hover:bg-gray-100 shadow-lg">
              Enter as Host/Team Leader
            </Button>
          </div> : <Card className="w-full bg-white/95 backdrop-blur shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center justify-center gap-3 text-gray-800">
                <img 
                  src={hostProfileImage} 
                  alt="Host Profile" 
                  className="w-10 h-10 rounded-full object-cover border-2 border-primary/20"
                />
                Host Login
              </CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access host features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleHostLogin} className="space-y-4">
                <div>
                  <Input type="text" placeholder="Name" value={name} onChange={e => setName(e.target.value)} className="h-12" disabled={loading} />
                </div>
                
                <div>
                  <Input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="h-12" disabled={loading} />
                </div>
                
                {error && <div className="flex items-center space-x-2 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                  </div>}
                
                <div className="flex space-x-2">
                  <Button type="button" variant="outline" onClick={() => {
                setShowHostLogin(false);
                setError('');
                setName('');
                setPassword('');
              }} disabled={loading} className="flex-1">
                    Back
                  </Button>
                  <Button type="submit" disabled={loading} className="flex-1 bg-primary hover:bg-primary/90">
                    {loading ? 'Logging in...' : 'Login'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>}
      </div>
      
      {/* Bottom left attribution */}
      <div className="absolute bottom-4 left-4 text-white/80 text-sm">made by Big Mike :)</div>
    </div>;
};