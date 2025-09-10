import type { MainFolder } from '@/types/fileTypes';
import { Folder, FileText } from 'lucide-react';

interface FolderCardProps {
  folder: MainFolder;
  onClick: () => void;
}

export const FolderCard = ({ folder, onClick }: FolderCardProps) => {
  const totalFiles = folder.subFolders.reduce((sum, sf) => sum + sf.files.length, 0);
  
  return (
    <div
      onClick={onClick}
      className="group cursor-pointer transition-all duration-300 transform hover:scale-105"
    >
      <div className="bg-gradient-to-br from-folder-primary to-folder-secondary rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 bg-white/20 rounded-xl group-hover:bg-white/30 transition-colors duration-300">
            <Folder className="h-8 w-8 text-white" />
          </div>
          <div className="text-right">
            <div className="text-white/80 text-sm">
              {folder.subFolders.length} folders
            </div>
            <div className="text-white/60 text-xs">
              {totalFiles} files
            </div>
          </div>
        </div>
        
        <h3 className="text-white font-semibold text-lg mb-2 group-hover:text-white/90 transition-colors duration-300">
          {folder.name}
        </h3>
        
        <div className="flex items-center text-white/70 text-sm">
          <FileText className="h-4 w-4 mr-2" />
          <span>Modified recently</span>
        </div>
      </div>
    </div>
  );
};