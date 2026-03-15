import { useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isToday,
} from 'date-fns';
import { gregorianToVikramSamvat, gregorianToSaka, type MonthScheme, type CalendarId } from '@/lib/calendar-utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserEvents } from '@/components/AddEventModal';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Pencil, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface CalendarGridProps {
  currentDate: Date;
  baseCalendar: CalendarId;
  overlayCalendar: 'none' | CalendarId;
  onDateClick: (date: Date) => void;
  monthScheme?: MonthScheme;
  googleEvents?: { id: string; title: string; startDate: string }[];
  onDeleteEvent?: (eventId: string) => void;
  onEditEvent?: (event: any) => void;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({
  currentDate,
  baseCalendar,
  overlayCalendar,
  onDateClick,
  monthScheme = 'purnimanta',
  googleEvents = [],
  onDeleteEvent,
  onEditEvent,
}: CalendarGridProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  const { data: festivals } = useQuery({
    queryKey: ['festivals', monthStartStr, monthEndStr],
    queryFn: async () => {
      const { data, error } = await supabase.from('festivals').select('*').gte('gregorian_date', monthStartStr).lte('gregorian_date', monthEndStr);
      if (error) throw error;
      return data;
    },
  });

  const { data: userEvents } = useUserEvents(monthStartStr, monthEndStr);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const getOverlayText = (date: Date): string => {
    if (overlayCalendar === 'vikram') {
      const vs = gregorianToVikramSamvat(date, monthScheme);
      return `${vs.month.slice(0, 3)} ${vs.day}`;
    }
    if (overlayCalendar === 'saka') {
      const saka = gregorianToSaka(date);
      return `${saka.month.slice(0, 3)} ${saka.day}`;
    }
    if (overlayCalendar === 'gregorian') return format(date, 'MMM d');
    return '';
  };

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-xs font-medium text-muted-foreground py-2">{wd}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border">
        {days.map((d, i) => {
          const dateKey = format(d, 'yyyy-MM-dd');
          const fests = festivals?.filter(f => f.gregorian_date === dateKey) || [];
          const evs = userEvents?.filter(e => e.event_date === dateKey) || [];
          const inMonth = isSameMonth(d, currentDate);

          let displayNumber: string;
          if (baseCalendar === 'vikram') displayNumber = gregorianToVikramSamvat(d, monthScheme).day.toString();
          else if (baseCalendar === 'saka') displayNumber = gregorianToSaka(d).day.toString();
          else displayNumber = format(d, 'd');

          return (
            <div key={i} onClick={() => onDateClick(d)} className={cn('relative flex flex-col min-h-[100px] p-1 bg-card hover:bg-accent/30 cursor-pointer', !inMonth && 'bg-muted/30 opacity-40')}>
              <div className="flex justify-between items-start w-full">
                <span className={cn('text-xs font-medium', isToday(d) && 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center')}>{displayNumber}</span>
                {overlayCalendar !== 'none' && <span className="text-[10px] text-muted-foreground">{getOverlayText(d)}</span>}
              </div>

              <div className="mt-1 flex flex-col gap-1">
                {fests.map(f => (
                  <div key={f.id} className="truncate rounded-md bg-primary/10 text-primary px-1 py-0.5 text-[10px] font-medium">{f.name}</div>
                ))}
                {evs.map(ev => (
                  <Popover key={ev.id}>
                    <PopoverTrigger asChild>
                      <div className="truncate rounded-md bg-secondary/30 text-secondary-foreground px-1 py-0.5 text-[10px] font-medium" onClick={(e) => e.stopPropagation()}>{ev.title}</div>
                    </PopoverTrigger>
                    <PopoverContent className="p-3 w-64">
                      <div className="flex justify-between items-start mb-2">
                        <div><p className="text-sm font-bold">{ev.title}</p><p className="text-xs text-muted-foreground">{format(d, 'PPP')}</p></div>
                        <div className="flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); onEditEvent?.(ev); }} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary"><Pencil className="h-3 w-3" /></button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild><button onClick={(e) => e.stopPropagation()} className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button></AlertDialogTrigger>
                            <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete Event?</AlertDialogTitle></AlertDialogHeader>
                              <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => onDeleteEvent?.(ev.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction></AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}