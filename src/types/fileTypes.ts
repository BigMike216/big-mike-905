export interface FileItem {
  id: string;
  name: string;
  type: 'pdf' | 'mp4' | 'img';
  size?: string;
  dateModified?: string;
}

export interface SubFolder {
  id: string;
  name: string;
  files: FileItem[];
  createdAt: string;
}

export interface MainFolder {
  id: string;
  name: string;
  subFolders: SubFolder[];
  createdAt: string;
}