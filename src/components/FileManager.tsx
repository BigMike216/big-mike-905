import { useState, useEffect } from 'react';
import { FolderCard } from './FolderCard';
import { FolderView } from './FolderView';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './ui/breadcrumb';
import { Button } from './ui/button';
import { ChevronLeft } from 'lucide-react';
import { useSupabaseData } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';

const FileManager = () => {
  const [currentView, setCurrentView] = useState<'main' | 'folder' | 'subfolder'>('main');
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [currentSubFolderId, setCurrentSubFolderId] = useState<string | null>(null);
  
  const { loading, hasUnsavedChanges, saveChanges, addSubfolder, updateSubfolder, deleteSubfolder, subfolders, loadData } = useSupabaseData();

  // Initialize with 10 main folders (Team 0 through Team 9) - now with real subfolders
  const mainFolders = Array.from({ length: 10 }, (_, i) => {
    const teamId = `team-${i}`;
    return {
      id: teamId,
      name: `Team ${i}`,
      subfolders: subfolders.filter(sf => sf.parent_folder_id === teamId)
    };
  });

  // Set up real-time updates for subfolders and team members
  useEffect(() => {
    const channel = supabase
      .channel('folder-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subfolders'
        },
        () => {
          loadData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'team_members'
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  const foldersForDisplay = mainFolders.map(folder => ({
    ...folder,
    subFolders: [
      {
        id: `${folder.id}-members`,
        name: 'Team Members',
        files: [],
        createdAt: new Date().toISOString()
      },
      ...folder.subfolders.map(sf => ({
        id: sf.id,
        name: sf.name,
        files: [],
        createdAt: sf.created_at
      }))
    ],
    createdAt: new Date().toISOString()
  }));

  const handleFolderClick = (folderId: string) => {
    setCurrentFolderId(folderId);
    setCurrentView('folder');
  };

  const handleSubFolderClick = (subFolderId: string) => {
    setCurrentSubFolderId(subFolderId);
    setCurrentView('subfolder');
  };

  const handleBack = () => {
    if (currentView === 'subfolder') {
      setCurrentView('folder');
      setCurrentSubFolderId(null);
    } else if (currentView === 'folder') {
      setCurrentView('main');
      setCurrentFolderId(null);
    }
  };

  // Add subfolder functionality
  const handleAddSubFolder = async (folderName: string) => {
    if (!currentFolderId) return;
    
    try {
      await addSubfolder(folderName, currentFolderId);
      // Refresh the current view to show the new subfolder
      setCurrentView('folder'); // This will trigger a re-render
    } catch (error) {
      console.error('Error creating subfolder:', error);
    }
  };

  const handleEditSubFolder = async (subFolderId: string, newName: string) => {
    try {
      await updateSubfolder(subFolderId, newName);
    } catch (error) {
      console.error('Error editing subfolder:', error);
    }
  };

  const handleDeleteSubFolder = async (subFolderId: string) => {
    try {
      await deleteSubfolder(subFolderId);
    } catch (error) {
      console.error('Error deleting subfolder:', error);
    }
  };

  const handleFileUpload = (files: any[], targetFolderId?: string, targetSubFolderId?: string) => {
    // This is handled by the Supabase components now
    console.log('File upload:', files, targetFolderId, targetSubFolderId);
  };

  const getCurrentFolder = () => {
    return foldersForDisplay.find(f => f.id === currentFolderId);
  };

  const getCurrentSubFolder = () => {
    const folder = getCurrentFolder();
    return folder?.subFolders.find(sf => sf.id === currentSubFolderId);
  };

  const getBreadcrumbItems = () => {
    const items = [{ href: '#', label: 'My Files' }];
    
    if (currentView === 'folder' || currentView === 'subfolder') {
      const folder = getCurrentFolder();
      if (folder) {
        items.push({ href: '#', label: folder.name });
      }
    }
    
    if (currentView === 'subfolder') {
      const subFolder = getCurrentSubFolder();
      if (subFolder) {
        items.push({ href: '#', label: subFolder.name });
      }
    }
    
    return items;
  };

  if (loading && currentView === 'main') {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-muted-foreground text-lg">Loading...</div>
      </div>
    );
  }

  if (currentView === 'main') {
    return (
      <div className="min-h-screen bg-background p-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Dr.B Monikar Nair's class 905</h1>
          <p className="text-muted-foreground">Organize your documents, videos, and images</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
          {foldersForDisplay.map((folder) => (
            <FolderCard
              key={folder.id}
              folder={folder}
              onClick={() => handleFolderClick(folder.id)}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="hover:bg-secondary"
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Breadcrumb>
            <BreadcrumbList>
              {getBreadcrumbItems().map((item, index) => (
                <BreadcrumbItem key={index}>
                  {index === getBreadcrumbItems().length - 1 ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : (
                    <>
                      <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
                      <BreadcrumbSeparator />
                    </>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        
        {hasUnsavedChanges && (
          <Button onClick={saveChanges} className="bg-green-600 hover:bg-green-700">
            Save All Changes
          </Button>
        )}
      </div>

      <FolderView
        view={currentView}
        folder={getCurrentFolder()}
        subFolder={getCurrentSubFolder()}
        onSubFolderClick={handleSubFolderClick}
        onAddSubFolder={handleAddSubFolder}
        onFileUpload={handleFileUpload}
        onEditSubFolder={handleEditSubFolder}
        onDeleteSubFolder={handleDeleteSubFolder}
        currentFolderId={currentFolderId}
        currentSubFolderId={currentSubFolderId}
      />
    </div>
  );
};

export default FileManager;