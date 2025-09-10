import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useToast } from '@/hooks/use-toast';

export interface DatabaseFile {
  id: string;
  file_url: string;
  display_name: string;
  file_type: 'pdf' | 'mp4' | 'img';
  folder_id: string | null;
  subfolder_id: string | null;
  uploaded_at: string;
  is_drive_link: boolean;
  drive_file_id: string | null;
  original_drive_url: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  team_id: string;
}

export const useSupabaseData = () => {
  const [files, setFiles] = useState<DatabaseFile[]>([]);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [subfolders, setSubfolders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { toast } = useToast();

  // Load data from Supabase
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Load files
      const { data: filesData, error: filesError } = await supabase
        .from('files')
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (filesError) throw filesError;

      // Cast file types properly
      const typedFiles = (filesData || []).map(file => ({
        ...file,
        file_type: file.file_type as 'pdf' | 'mp4' | 'img'
      }));

      // Load team members
      const { data: membersData, error: membersError } = await supabase
        .from('team_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (membersError) throw membersError;

      // Load subfolders
      const { data: subfoldersData, error: subfoldersError } = await supabase
        .from('subfolders')
        .select('*')
        .order('created_at', { ascending: false });

      if (subfoldersError) throw subfoldersError;

      setFiles(typedFiles);
      setMembers(membersData || []);
      setSubfolders(subfoldersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load data from database",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Save all changes to database
  const saveChanges = useCallback(async () => {
    try {
      toast({
        title: "Saving changes...",
        description: "Updating database with your changes",
      });

      // This will be called after individual operations complete
      setHasUnsavedChanges(false);
      
      toast({
        title: "Success",
        description: "All changes saved successfully",
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Upload file to Supabase storage and database
  const uploadFile = useCallback(async (
    file: File, 
    displayName: string,
    folderId?: string, 
    subFolderId?: string
  ): Promise<DatabaseFile | null> => {
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const filePath = `uploads/${fileName}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from('files')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('files')
        .getPublicUrl(filePath);

      // Determine file type
      const getFileType = (mimeType: string, fileName: string): 'pdf' | 'mp4' | 'img' => {
        if (mimeType.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)) {
          return 'img';
        }
        if (mimeType.startsWith('video/') || /\.(mp4|mov|avi|mkv)$/i.test(fileName)) {
          return 'mp4';
        }
        return 'pdf';
      };

      const fileType = getFileType(file.type, file.name);

      // Save to database
      const { data: dbFile, error: dbError } = await supabase
        .from('files')
        .insert({
          file_url: publicUrl,
          display_name: displayName,
          file_type: fileType,
          folder_id: folderId || null,
          subfolder_id: subFolderId || null,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Cast and update local state
      const typedDbFile = {
        ...dbFile,
        file_type: dbFile.file_type as 'pdf' | 'mp4' | 'img'
      };
      setFiles(prev => [typedDbFile, ...prev]);
      setHasUnsavedChanges(true);

      toast({
        title: "Success",
        description: `${displayName} uploaded successfully`,
      });

      return typedDbFile;
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Update file display name
  const updateFile = useCallback(async (fileId: string, newDisplayName: string) => {
    try {
      const { error } = await supabase
        .from('files')
        .update({ display_name: newDisplayName })
        .eq('id', fileId);

      if (error) throw error;

      // Update local state
      setFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, display_name: newDisplayName } : f
      ));
      setHasUnsavedChanges(true);

      toast({
        title: "Success",
        description: "File renamed successfully",
      });
    } catch (error) {
      console.error('Error updating file:', error);
      toast({
        title: "Error",
        description: "Failed to rename file",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    try {
      const file = files.find(f => f.id === fileId);
      if (!file) return;

      // Extract path from URL for storage deletion
      const url = new URL(file.file_url);
      const filePath = url.pathname.split('/').slice(-2).join('/'); // gets "uploads/filename.ext"

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('files')
        .remove([filePath]);

      if (storageError) console.warn('Storage deletion error:', storageError);

      // Delete from database
      const { error: dbError } = await supabase
        .from('files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      // Update local state
      setFiles(prev => prev.filter(f => f.id !== fileId));
      setHasUnsavedChanges(true);

      toast({
        title: "Success",
        description: "File deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting file:', error);
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  }, [files, toast]);

  // Add team member
  const addTeamMember = useCallback(async (name: string, teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .insert({ name: name.trim(), team_id: teamId })
        .select()
        .single();

      if (error) throw error;

      setMembers(prev => [data, ...prev]);
      setHasUnsavedChanges(true);

      toast({
        title: "Success",
        description: "Team member added successfully",
      });

      return data;
    } catch (error) {
      console.error('Error adding team member:', error);
      toast({
        title: "Error",
        description: "Failed to add team member",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Update team member
  const updateTeamMember = useCallback(async (memberId: string, newName: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .update({ name: newName.trim() })
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, name: newName.trim() } : m
      ));
      setHasUnsavedChanges(true);

      toast({
        title: "Success",
        description: "Team member updated successfully",
      });
    } catch (error) {
      console.error('Error updating team member:', error);
      toast({
        title: "Error",
        description: "Failed to update team member",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Delete team member
  const deleteTeamMember = useCallback(async (memberId: string) => {
    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      setMembers(prev => prev.filter(m => m.id !== memberId));
      setHasUnsavedChanges(true);

      toast({
        title: "Success",
        description: "Team member removed successfully",
      });
    } catch (error) {
      console.error('Error deleting team member:', error);
      toast({
        title: "Error",
        description: "Failed to remove team member",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Add Google Drive link
  const addGoogleDriveLink = useCallback(async (
    displayName: string,
    originalUrl: string,
    fileId: string,
    folderId?: string,
    subFolderId?: string
  ): Promise<DatabaseFile | null> => {
    try {
      // Create preview URL
      const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;

      // Determine file type based on Drive file (assume pdf for now, could be enhanced)
      const fileType: 'pdf' | 'mp4' | 'img' = 'pdf';

      // Save to database
      const { data: dbFile, error: dbError } = await supabase
        .from('files')
        .insert({
          file_url: previewUrl,
          display_name: displayName,
          file_type: fileType,
          folder_id: folderId || null,
          subfolder_id: subFolderId || null,
          is_drive_link: true,
          drive_file_id: fileId,
          original_drive_url: originalUrl,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Cast and update local state
      const typedDbFile = {
        ...dbFile,
        file_type: dbFile.file_type as 'pdf' | 'mp4' | 'img',
        is_drive_link: dbFile.is_drive_link,
        drive_file_id: dbFile.drive_file_id,
        original_drive_url: dbFile.original_drive_url,
      };
      setFiles(prev => [typedDbFile, ...prev]);
      setHasUnsavedChanges(true);

      toast({
        title: "Success",
        description: `${displayName} added successfully`,
      });

      return typedDbFile;
    } catch (error) {
      console.error('Error adding Google Drive link:', error);
      toast({
        title: "Error",
        description: "Failed to add Google Drive link",
        variant: "destructive",
      });
      return null;
    }
  }, [toast]);

  // Add subfolder
  const addSubfolder = useCallback(async (name: string, parentFolderId: string) => {
    try {
      const { data, error } = await supabase
        .from('subfolders')
        .insert({
          name,
          parent_folder_id: parentFolderId
        })
        .select()
        .single();

      if (error) throw error;

      setSubfolders(prev => [...prev, data]);
      toast({
        title: "Success",
        description: `Subfolder "${name}" created successfully`,
      });

      return data;
    } catch (error) {
      console.error('Error adding subfolder:', error);
      toast({
        title: "Error",
        description: "Failed to create subfolder",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Update subfolder
  const updateSubfolder = useCallback(async (subFolderId: string, newName: string) => {
    try {
      const { data, error } = await supabase
        .from('subfolders')
        .update({ name: newName })
        .eq('id', subFolderId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      setSubfolders(prev => prev.map(sf => 
        sf.id === subFolderId ? { ...sf, name: newName } : sf
      ));

      toast({
        title: "Success",
        description: `Subfolder renamed to "${newName}"`,
      });

      return data;
    } catch (error) {
      console.error('Error updating subfolder:', error);
      toast({
        title: "Error",
        description: "Failed to rename subfolder",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Delete subfolder
  const deleteSubfolder = useCallback(async (subFolderId: string) => {
    try {
      const { error } = await supabase
        .from('subfolders')
        .delete()
        .eq('id', subFolderId);

      if (error) throw error;

      // Update local state
      setSubfolders(prev => prev.filter(sf => sf.id !== subFolderId));

      toast({
        title: "Success",
        description: "Subfolder deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting subfolder:', error);
      toast({
        title: "Error",
        description: "Failed to delete subfolder",
        variant: "destructive",
      });
      throw error;
    }
  }, [toast]);

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    files,
    members,
    subfolders,
    loading,
    hasUnsavedChanges,
    uploadFile,
    updateFile,
    deleteFile,
    addTeamMember,
    updateTeamMember,
    deleteTeamMember,
    addGoogleDriveLink,
    addSubfolder,
    updateSubfolder,
    deleteSubfolder,
    saveChanges,
    loadData,
  };
};