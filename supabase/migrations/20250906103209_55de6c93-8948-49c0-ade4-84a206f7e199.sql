-- Create subfolders table to properly track folder hierarchy
CREATE TABLE public.subfolders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  parent_folder_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.subfolders ENABLE ROW LEVEL SECURITY;

-- Create policy for public access (same as other tables)
CREATE POLICY "Subfolders are publicly accessible" 
ON public.subfolders 
FOR ALL 
USING (true) 
WITH CHECK (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_subfolders_updated_at
BEFORE UPDATE ON public.subfolders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();