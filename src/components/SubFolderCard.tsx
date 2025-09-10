import type { SubFolder } from '@/types/fileTypes';
import { Folder, FileText } from 'lucide-react';

interface SubFolderCardProps {
  subFolder: SubFolder;
  onClick: () => void;
}

export const SubFolderCard = ({ subFolder, onClick }: SubFolderCardProps) => {
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-300 hover:scale-105"
    >
      <div className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-all duration-300 hover:bg-accent/30">
        <div className="flex items-center justify-between mb-3">
          <div className="p-2 bg-folder-primary/20 rounded-lg group-hover:bg-folder-primary/30 transition-colors duration-300">
            <Folder className="h-6 w-6 text-folder-primary" />
          </div>
          <div className="text-right">
            <div className="text-muted-foreground text-sm">
              {subFolder.files.length} files
            </div>
          </div>
        </div>
        
        <h4 className="text-foreground font-medium text-base mb-2 group-hover:text-folder-primary transition-colors duration-300">
          {subFolder.name}
        </h4>
        
        <div className="flex items-center text-muted-foreground text-sm">
          <FileText className="h-3 w-3 mr-2" />
          <span>Created {new Date(subFolder.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
};