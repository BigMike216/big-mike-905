import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Link, AlertCircle } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';

interface GoogleDriveUploadProps {
  children: React.ReactNode;
  folderId?: string;
  subFolderId?: string;
}

export const GoogleDriveUpload = ({ children, folderId, subFolderId }: GoogleDriveUploadProps) => {
  const { user } = useAuth();
  const { addGoogleDriveLink } = useSupabaseData();
  const [fileName, setFileName] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [error, setError] = useState('');

  // Check if user has permission to upload
  if (user?.role !== 'host') {
    return null;
  }

  const extractFileId = (url: string): string | null => {
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /folders\/([a-zA-Z0-9-_]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fileName.trim()) {
      setError('Please enter a file name');
      return;
    }

    if (!driveUrl.trim()) {
      setError('Please enter a Google Drive URL');
      return;
    }

    const fileId = extractFileId(driveUrl);
    if (!fileId) {
      setError('Invalid Google Drive URL. Please use a sharing link from Google Drive.');
      return;
    }

    setUploading(true);
    try {
      await addGoogleDriveLink(
        fileName.trim(),
        driveUrl.trim(),
        fileId,
        folderId,
        subFolderId
      );
      
      // Reset form
      setFileName('');
      setDriveUrl('');
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to add Google Drive link');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Google Drive Link</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              placeholder="File Name"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              disabled={uploading}
            />
          </div>
          
          <div>
            <Input
              placeholder="Google Drive Link"
              value={driveUrl}
              onChange={(e) => setDriveUrl(e.target.value)}
              disabled={uploading}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste the sharing link from Google Drive (e.g., https://drive.google.com/file/d/...)
            </p>
          </div>
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => {
                setIsDialogOpen(false);
                setFileName('');
                setDriveUrl('');
                setError('');
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={uploading || !fileName.trim() || !driveUrl.trim()}
            >
              {uploading ? 'Adding...' : 'Add Link'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};