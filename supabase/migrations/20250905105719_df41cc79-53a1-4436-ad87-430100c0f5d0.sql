-- Add Google Drive link support to files table
ALTER TABLE public.files 
ADD COLUMN drive_file_id TEXT,
ADD COLUMN original_drive_url TEXT,
ADD COLUMN is_drive_link BOOLEAN DEFAULT FALSE;

-- Update existing files to not be drive links
UPDATE public.files SET is_drive_link = FALSE WHERE is_drive_link IS NULL;

-- Make is_drive_link not null with default false
ALTER TABLE public.files ALTER COLUMN is_drive_link SET NOT NULL;

-- Create user roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('student', 'host')),
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for user_roles (public access for this simple auth system)
CREATE POLICY "User roles are publicly accessible" 
ON public.user_roles 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Add trigger for user_roles updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();