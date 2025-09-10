import { useState } from 'react';
import type { MainFolder, SubFolder, FileItem } from '@/types/fileTypes';
import { EditableSubFolderCard } from './EditableSubFolderCard';
import { SupabaseFileGrid } from './SupabaseFileGrid';
import { SupabaseTeamMemberManager } from './SupabaseTeamMemberManager';
import { SupabaseFileUpload } from './SupabaseFileUpload';
import { GoogleDriveUpload } from './GoogleDriveUpload';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Plus, Upload, Link } from 'lucide-react';

interface FolderViewProps {
  view: 'folder' | 'subfolder';
  folder?: MainFolder;
  subFolder?: SubFolder;
  onSubFolderClick: (id: string) => void;
  onAddSubFolder: (name: string) => void;
  onFileUpload: (files: FileItem[], targetFolderId?: string, targetSubFolderId?: string) => void;
  onEditSubFolder: (subFolderId: string, newName: string) => void;
  onDeleteSubFolder: (subFolderId: string) => void;
  currentFolderId: string | null;
  currentSubFolderId: string | null;
}

export const FolderView = ({ 
  view, 
  folder, 
  subFolder, 
  onSubFolderClick, 
  onAddSubFolder,
  onFileUpload,
  onEditSubFolder,
  onDeleteSubFolder,
  currentFolderId,
  currentSubFolderId
}: FolderViewProps) => {
  const { user } = useAuth();
  const { files, hasUnsavedChanges, saveChanges } = useSupabaseData();
  const [newFolderName, setNewFolderName] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onAddSubFolder(newFolderName.trim());
      setNewFolderName('');
      setIsDialogOpen(false);
    }
  };

  const canEdit = user?.role === 'host';

  if (view === 'folder' && folder) {
    const teamMembersFolder = folder.subFolders.find(sf => sf.name === 'Team Members');
    const otherFolders = folder.subFolders.filter(sf => sf.name !== 'Team Members');
    
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">{folder.name}</h2>
          
          <div className="flex gap-3">
            {canEdit && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <Plus className="h-4 w-4 mr-2" />
                    New Folder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Folder name"
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateFolder}>
                        Create
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
            
            {canEdit && (
              <SupabaseFileUpload folderId={currentFolderId || undefined}>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </SupabaseFileUpload>
            )}
            
            {canEdit && (
              <GoogleDriveUpload folderId={currentFolderId || undefined}>
                <Button variant="outline">
                  <Link className="h-4 w-4 mr-2" />
                  Add Drive Link
                </Button>
              </GoogleDriveUpload>
            )}
            
            {hasUnsavedChanges && canEdit && (
              <Button onClick={saveChanges} className="bg-green-600 hover:bg-green-700">
                Save Changes
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Team Members Card */}
          <div className="lg:col-span-1">
            {teamMembersFolder && (
              <div 
                className="bg-gradient-to-br from-[#F28E9F] to-[#F1AEB9] rounded-lg p-6 text-white cursor-pointer hover:from-[#F1AEB9] hover:to-[#E09AAD] transition-colors"
                onClick={() => onSubFolderClick(teamMembersFolder.id)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mr-3">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"/>
                    </svg>
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">Team Members</h3>
                <p className="text-white/80">View team members</p>
              </div>
            )}
          </div>

          {/* Files and Folders Area */}
          <div className="lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-foreground mb-3">Files & Folders</h3>
              <div className="text-sm text-muted-foreground">
                {otherFolders.length + (teamMembersFolder?.files.length || 0)} items
              </div>
            </div>
            
            {/* Other folders */}
            {otherFolders.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {otherFolders.map((subFolder) => (
                  <EditableSubFolderCard
                    key={subFolder.id}
                    subFolder={subFolder}
                    onClick={() => onSubFolderClick(subFolder.id)}
                    onEdit={(newName) => onEditSubFolder(subFolder.id, newName)}
                    onDelete={() => onDeleteSubFolder(subFolder.id)}
                    canEdit={canEdit && subFolder.name !== 'Team Members'}
                  />
                ))}
              </div>
            )}
            
            {/* Files from database */}
            <SupabaseFileGrid files={files} folderId={currentFolderId || undefined} />
            
            {otherFolders.length === 0 && files.filter(f => f.folder_id === currentFolderId && !f.subfolder_id).length === 0 && (
              <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                <div className="text-muted-foreground text-lg mb-4">No files yet</div>
                <p className="text-muted-foreground/70">Upload files or create folders to organize your content</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'subfolder' && subFolder) {
    // Special handling for Team Members subfolder
    if (subFolder.name === 'Team Members') {
      const teamId = subFolder.id.split('-')[1]; // Extract team number from id like 'team-0-members'
      const teamName = `Team ${teamId}`;
      
      return (
        <div>
          <SupabaseTeamMemberManager teamId={teamId} teamName={teamName} />
        </div>
      );
    }

    // Regular subfolder handling
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">{subFolder.name}</h2>
          
          <div className="flex gap-3">
            {canEdit && (
              <SupabaseFileUpload subFolderId={currentSubFolderId || undefined}>
                <Button variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Files
                </Button>
              </SupabaseFileUpload>
            )}
            
            {canEdit && (
              <GoogleDriveUpload subFolderId={currentSubFolderId || undefined}>
                <Button variant="outline">
                  <Link className="h-4 w-4 mr-2" />
                  Add Drive Link
                </Button>
              </GoogleDriveUpload>
            )}
            
            {hasUnsavedChanges && canEdit && (
              <Button onClick={saveChanges} className="bg-green-600 hover:bg-green-700">
                Save Changes
              </Button>
            )}
          </div>
        </div>

        <SupabaseFileGrid files={files} subFolderId={currentSubFolderId || undefined} />
      </div>
    );
  }

  return null;
};