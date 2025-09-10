-- Enable real-time functionality for files table
ALTER TABLE public.files REPLICA IDENTITY FULL;
ALTER TABLE public.subfolders REPLICA IDENTITY FULL;
ALTER TABLE public.team_members REPLICA IDENTITY FULL;

-- Add tables to the supabase_realtime publication
ALTER publication supabase_realtime ADD TABLE public.files;
ALTER publication supabase_realtime ADD TABLE public.subfolders;
ALTER publication supabase_realtime ADD TABLE public.team_members;