import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Upload, FileText, Image, Video } from 'lucide-react';
import type { FileItem } from '@/types/fileTypes';

interface FileUploadProps {
  onFileUpload: (files: FileItem[]) => void;
  children: React.ReactNode;
}

export const FileUpload = ({ onFileUpload, children }: FileUploadProps) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: FileItem[] = acceptedFiles.map(file => {
      const fileType = getFileType(file.type, file.name);
      return {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        type: fileType,
        size: formatFileSize(file.size),
        dateModified: new Date().toLocaleDateString()
      };
    });
    
    onFileUpload(newFiles);
  }, [onFileUpload]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    noClick: true,
    multiple: true
  });

  const getFileType = (mimeType: string, fileName: string): 'pdf' | 'mp4' | 'img' => {
    if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
      return 'img';
    }
    if (mimeType.startsWith('video/') || /\.(mp4|mov|avi|mkv)$/i.test(fileName)) {
      return 'mp4';
    }
    return 'pdf';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog>
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
      </DialogContent>
    </Dialog>
  );
};