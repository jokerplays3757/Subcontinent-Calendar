import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Save } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  editingEvent?: any;
}

export function AddEventModal({ open, onOpenChange, selectedDate, editingEvent }: AddEventModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    if (editingEvent) {
      setTitle(editingEvent.title);
      setDescription(editingEvent.description || '');
      setEventDate(editingEvent.event_date);
    } else if (selectedDate) {
      setTitle('');
      setDescription('');
      setEventDate(format(selectedDate, 'yyyy-MM-dd'));
    }
  }, [editingEvent, selectedDate, open]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const payload = { title, description: description || null, event_date: eventDate, user_id: user.id };
      
      if (editingEvent) {
        const { error } = await supabase.from('user_events').update(payload).eq('id', editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_events').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      toast.success(editingEvent ? 'Event updated!' : 'Event saved!');
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{editingEvent ? 'Edit Event' : 'Save Event'}</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(); }} className="space-y-4">
          <div className="space-y-1"><Label>Title</Label><Input value={title} onChange={e => setTitle(e.target.value)} required /></div>
          <div className="space-y-1"><Label>Date</Label><Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} required /></div>
          <div className="space-y-1"><Label>Description</Label><Textarea value={description} onChange={e => setDescription(e.target.value)} /></div>
          <Button type="submit" className="w-full" disabled={saveMutation.isPending}>
            {editingEvent ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
            {saveMutation.isPending ? 'Processing...' : (editingEvent ? 'Update' : 'Save')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function useUserEvents(monthStart: string, monthEnd: string) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['user-events', monthStart, monthEnd, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from('user_events').select('*').eq('user_id', user.id).gte('event_date', monthStart).lte('event_date', monthEnd);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}