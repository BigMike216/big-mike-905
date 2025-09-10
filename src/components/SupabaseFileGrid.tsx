import { useState, useEffect } from 'react';
import { FileText, Video, Image, Download, Edit2, Trash2, Save, X, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from './ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { useSupabaseData, type DatabaseFile } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SupabaseFileGridProps {
  files: DatabaseFile[];
  folderId?: string;
  subFolderId?: string;
}

export const SupabaseFileGrid = ({ files, folderId, subFolderId }: SupabaseFileGridProps) => {
  const { user } = useAuth();
  const { updateFile, deleteFile, loadData } = useSupabaseData();
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [previewFile, setPreviewFile] = useState<DatabaseFile | null>(null);

  const canEdit = user?.role === 'host';

  // Set up real-time updates for files
  useEffect(() => {
    const channel = supabase
      .channel('files-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files'
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

  // Filter files based on folder/subfolder
  const filteredFiles = files.filter(file => {
    if (subFolderId) return file.subfolder_id === subFolderId;
    if (folderId) return file.folder_id === folderId && !file.subfolder_id;
    return !file.folder_id && !file.subfolder_id;
  });

  const getFileIcon = (file: DatabaseFile) => {
    if (file.is_drive_link) {
      return <ExternalLink className="h-6 w-6 text-blue-500" />;
    }
    
    switch (file.file_type) {
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

  const getFileColor = (file: DatabaseFile) => {
    if (file.is_drive_link) {
      return 'border-blue-200 hover:bg-blue-50';
    }
    
    switch (file.file_type) {
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

  const handleStartEdit = (file: DatabaseFile) => {
    setEditingFile(file.id);
    setEditingName(file.display_name);
  };

  const handleSaveEdit = async () => {
    if (editingFile && editingName.trim()) {
      await updateFile(editingFile, editingName.trim());
      setEditingFile(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingFile(null);
    setEditingName('');
  };

  const handleDelete = async (fileId: string) => {
    await deleteFile(fileId);
    setDeleteConfirm(null);
  };

  const handleDownload = (file: DatabaseFile) => {
    if (file.is_drive_link && file.original_drive_url) {
      window.open(file.original_drive_url, '_blank');
    } else {
      window.open(file.file_url, '_blank');
    }
  };

  const handlePreview = (file: DatabaseFile) => {
    setPreviewFile(file);
  };

  if (filteredFiles.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-4">No files yet</div>
        <p className="text-muted-foreground/70">Upload your first file to get started</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className={`group border-2 rounded-xl p-4 transition-all duration-300 hover:shadow-md cursor-pointer ${getFileColor(file)}`}
            onClick={() => handlePreview(file)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-white/80 rounded-lg">
                {getFileIcon(file)}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(file);
                  }}
                  title={file.is_drive_link ? "Open in Drive" : "Download"}
                >
                  {file.is_drive_link ? <ExternalLink className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                </Button>
                {canEdit && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(file);
                      }}
                      title="Rename"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirm(file.id);
                      }}
                      title="Delete"
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
            
            {editingFile === file.id ? (
              <div className="space-y-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveEdit();
                    if (e.key === 'Escape') handleCancelEdit();
                  }}
                  className="text-sm"
                  autoFocus
                />
                <div className="flex gap-1">
                  <Button size="sm" onClick={handleSaveEdit}>
                    <Save className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <h4 className="font-medium text-foreground mb-1 truncate">
                {file.display_name}
              </h4>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="uppercase">
                {file.is_drive_link ? 'Google Drive' : file.file_type}
              </span>
            </div>
            
            <div className="text-xs text-muted-foreground mt-2">
              {file.is_drive_link ? 'Added' : 'Uploaded'} {new Date(file.uploaded_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Preview Dialog */}
      <Dialog open={!!previewFile} onOpenChange={() => setPreviewFile(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>{previewFile?.display_name}</DialogTitle>
          </DialogHeader>
          <div className="p-6 pt-2">
            {previewFile?.is_drive_link ? (
              <iframe
                src={previewFile.file_url}
                className="w-full h-[60vh] border rounded"
                title={previewFile.display_name}
              />
            ) : previewFile?.file_type === 'img' ? (
              <div className="w-full h-[60vh] flex items-center justify-center border rounded bg-gray-50">
                <img
                  src={previewFile.file_url}
                  alt={previewFile.display_name}
                  className="max-w-full max-h-full object-contain"
                />
              </div>
            ) : previewFile?.file_type === 'mp4' ? (
              <div className="w-full h-[60vh] flex items-center justify-center border rounded bg-gray-50">
                <video
                  src={previewFile.file_url}
                  controls
                  className="max-w-full max-h-full"
                >
                  Your browser does not support the video tag.
                </video>
              </div>
            ) : previewFile?.file_type === 'pdf' ? (
              <iframe
                src={previewFile.file_url}
                className="w-full h-[60vh] border rounded"
                title={previewFile.display_name}
              />
            ) : (
              <div className="w-full h-[60vh] flex items-center justify-center border rounded bg-gray-50">
                <div className="text-center">
                  <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Preview not available for this file type</p>
                  <Button onClick={() => handleDownload(previewFile!)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download File
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};