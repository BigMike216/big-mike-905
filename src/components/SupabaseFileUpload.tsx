import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Upload, FileText, Image, Video } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';

interface SupabaseFileUploadProps {
  children: React.ReactNode;
  folderId?: string;
  subFolderId?: string;
}

export const SupabaseFileUpload = ({ children, folderId, subFolderId }: SupabaseFileUploadProps) => {
  const { uploadFile } = useSupabaseData();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [fileNames, setFileNames] = useState<{ [key: string]: string }>({});
  const [uploading, setUploading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setSelectedFiles(acceptedFiles);
    // Initialize display names with original file names
    const names: { [key: string]: string } = {};
    acceptedFiles.forEach(file => {
      names[file.name] = file.name.split('.').slice(0, -1).join('.');
    });
    setFileNames(names);
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    multiple: true
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      // Upload all files
      const uploadPromises = selectedFiles.map(file => 
        uploadFile(file, fileNames[file.name] || file.name, folderId, subFolderId)
      );
      
      await Promise.all(uploadPromises);
      
      // Reset state
      setSelectedFiles([]);
      setFileNames({});
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const updateFileName = (originalName: string, newName: string) => {
    setFileNames(prev => ({
      ...prev,
      [originalName]: newName
    }));
  };

  const removeFile = (fileName: string) => {
    setSelectedFiles(prev => prev.filter(f => f.name !== fileName));
    setFileNames(prev => {
      const { [fileName]: removed, ...rest } = prev;
      return rest;
    });
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Files</DialogTitle>
        </DialogHeader>
        
        <div {...getRootProps()} className="space-y-4">
          <input {...getInputProps()} />
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}>
            <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">
              {isDragActive ? 'Drop files here' : 'Choose files or drag and drop'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Support for PDF, images, and videos
            </p>
            <Button onClick={open} variant="outline">
              Browse Files
            </Button>
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 text-red-500" />
              <span className="text-sm text-muted-foreground">PDF</span>
            </div>
            <div className="p-3 border rounded-lg">
              <Image className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <span className="text-sm text-muted-foreground">Images</span>
            </div>
            <div className="p-3 border rounded-lg">
              <Video className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <span className="text-sm text-muted-foreground">Videos</span>
            </div>
          </div>
        </div>

        {selectedFiles.length > 0 && (
          <div className="space-y-4 mt-4">
            <h4 className="font-medium">Selected Files ({selectedFiles.length})</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {selectedFiles.map((file) => (
                <div key={file.name} className="flex items-center gap-2 p-2 border rounded">
                  <div className="flex-1">
                    <Input
                      value={fileNames[file.name] || ''}
                      onChange={(e) => updateFileName(file.name, e.target.value)}
                      placeholder="Display name"
                      className="text-sm"
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      {file.name} • {(file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.name)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedFiles([]);
                  setFileNames({});
                }}
              >
                Clear All
              </Button>
              <Button 
                onClick={handleUpload} 
                disabled={uploading}
              >
                {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} Files`}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};