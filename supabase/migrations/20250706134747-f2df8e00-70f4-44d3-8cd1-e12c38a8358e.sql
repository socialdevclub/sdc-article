-- Remove view-related columns from articles table
ALTER TABLE public.articles 
DROP COLUMN view_count,
DROP COLUMN daily_views,
DROP COLUMN monthly_views,
DROP COLUMN yearly_views;

-- Create likes table for user likes
CREATE TABLE public.likes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    article_id UUID NOT NULL REFERENCES public.articles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(user_id, article_id)
);

-- Enable Row Level Security
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Create policies for likes
CREATE POLICY "Users can view all likes" 
ON public.likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own likes" 
ON public.likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes" 
ON public.likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for performance
CREATE INDEX idx_likes_article_created ON public.likes(article_id, created_at);
CREATE INDEX idx_likes_user_created ON public.likes(user_id, created_at);