import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AddEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedDate?: Date;
  editingEvent?: {
    id: string;
    title: string;
    description: string | null;
    event_date: string;
  } | null;
}

export function AddEventModal({ open, onOpenChange, selectedDate, editingEvent }: AddEventModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventDate, setEventDate] = useState(
    selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd')
  );

  const isEditMode = !!editingEvent;

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

  const saveEvent = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');

      if (isEditMode && editingEvent) {
        const { error } = await supabase
          .from('user_events')
          .update({
            title,
            description: description || null,
            event_date: eventDate,
          })
          .eq('id', editingEvent.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('user_events').insert({
          user_id: user.id,
          title,
          description: description || null,
          event_date: eventDate,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      toast.success(isEditMode ? 'Event updated!' : 'Event saved!');
      setTitle('');
      setDescription('');
      onOpenChange(false);
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Save Event</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveEvent.mutate();
          }}
          className="space-y-4 mt-2"
        >
          <div className="space-y-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Event name" required />
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Description (optional)</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add details..." />
          </div>
          <Button type="submit" className="w-full" disabled={saveEvent.isPending}>
            <Plus className="mr-2 h-4 w-4" />
            {saveEvent.isPending ? (isEditMode ? 'Updating...' : 'Saving...') : isEditMode ? 'Update Event' : 'Save Event'}
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
      const { data, error } = await supabase
        .from('user_events')
        .select('*')
        .eq('user_id', user.id)
        .gte('event_date', monthStart)
        .lte('event_date', monthEnd)
        .order('event_date');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('user_events').delete().eq('id', eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
      toast.success('Event deleted');
    },
    onError: (err: any) => toast.error(err.message),
  });
}
