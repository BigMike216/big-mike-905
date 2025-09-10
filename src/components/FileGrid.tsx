import type { FileItem } from '@/types/fileTypes';
import { FileText, Video, Image, Download } from 'lucide-react';
import { Button } from './ui/button';

interface FileGridProps {
  files: FileItem[];
}

export const FileGrid = ({ files }: FileGridProps) => {
  const getFileIcon = (type: FileItem['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-6 w-6 text-red-500" />;
      case 'mp4':
        return <Video className="h-6 w-6 text-blue-500" />;
      case 'img':
        return <Image className="h-6 w-6 text-green-500" />;
      default:
        return <FileText className="h-6 w-6 text-gray-500" />;
    }
  };

  const getFileColor = (type: FileItem['type']) => {
    switch (type) {
      case 'pdf':
        return 'border-red-200 hover:bg-red-50';
      case 'mp4':
        return 'border-blue-200 hover:bg-blue-50';
      case 'img':
        return 'border-green-200 hover:bg-green-50';
      default:
        return 'border-gray-200 hover:bg-gray-50';
    }
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-4">No files yet</div>
        <p className="text-muted-foreground/70">Upload your first file to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {files.map((file) => (
        <div
          key={file.id}
          className={`group border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-md cursor-pointer ${getFileColor(file.type)}`}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="p-2 bg-white/80 rounded-lg">
              {getFileIcon(file.type)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
          
          <h4 className="font-medium text-foreground mb-1 truncate">
            {file.name}
          </h4>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="uppercase">{file.type}</span>
            {file.size && <span>{file.size}</span>}
          </div>
          
          {file.dateModified && (
            <div className="text-xs text-muted-foreground mt-2">
              Modified {new Date(file.dateModified).toLocaleDateString()}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};