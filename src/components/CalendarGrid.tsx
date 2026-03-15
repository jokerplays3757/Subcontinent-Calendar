import { useState, useMemo } from 'react';
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
import { useAuth } from '@/hooks/useAuth';
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
  googleEvents?: {
    id: string;
    title: string;
    startDate: string;
  }[];
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
  const { user } = useAuth();
  
  // Grid generation stays Gregorian-based for logic stability
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  const { data: festivals } = useQuery({
    queryKey: ['festivals', monthStartStr, monthEndStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('festivals')
        .select('id, gregorian_date, name')
        .gte('gregorian_date', monthStartStr)
        .lte('gregorian_date', monthEndStr);
      if (error) throw error;
      return data;
    },
  });

  const { data: userEvents } = useUserEvents(monthStartStr, monthEndStr);

  const festivalsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    festivals?.forEach((f) => {
      const existing = map.get(f.gregorian_date) || [];
      existing.push(f);
      map.set(f.gregorian_date, existing);
    });
    return map;
  }, [festivals]);

  const userEventsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    userEvents?.forEach((e) => {
      const existing = map.get(e.event_date) || [];
      existing.push(e);
      map.set(e.event_date, existing);
    });
    return map;
  }, [userEvents]);

  const googleEventsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    googleEvents.forEach((e) => {
      const existing = map.get(e.startDate) || [];
      existing.push(e);
      map.set(e.startDate, existing);
    });
    return map;
  }, [googleEvents]);

  const days: Date[] = [];
  let currentDay = calStart;
  while (currentDay <= calEnd) {
    days.push(currentDay);
    currentDay = addDays(currentDay, 1);
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
    if (overlayCalendar === 'gregorian') {
      return format(date, 'MMM d');
    }
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
          const fests = festivalsByDate.get(dateKey) || [];
          const evs = userEventsByDate.get(dateKey) || [];
          const gapiEvs = googleEventsByDate.get(dateKey) || [];
          const inMonth = isSameMonth(d, currentDate);
          const today = isToday(d);

          // Determine display number based on baseCalendar
          let displayNumber: string;
          if (baseCalendar === 'vikram') displayNumber = gregorianToVikramSamvat(d, monthScheme).day.toString();
          else if (baseCalendar === 'saka') displayNumber = gregorianToSaka(d).day.toString();
          else displayNumber = format(d, 'd');

          return (
            <div
              key={i}
              onClick={() => onDateClick(d)}
              className={cn(
                'relative flex flex-col min-h-[100px] p-1 bg-card transition-colors hover:bg-accent/30 cursor-pointer',
                !inMonth && 'bg-muted/30 opacity-40'
              )}
            >
              <div className="flex justify-between items-start w-full">
                <span className={cn('text-xs font-medium', today && 'bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center')}>
                  {displayNumber}
                </span>
                {overlayCalendar !== 'none' && (
                  <span className="text-[10px] text-muted-foreground">{getOverlayText(d)}</span>
                )}
              </div>

              <div className="mt-1 flex flex-col gap-1">
                {fests.map(f => (
                  <Popover key={f.id}>
                    <PopoverTrigger asChild>
                      <div className="truncate rounded-md bg-primary/10 text-primary px-1 py-0.5 text-[10px] font-medium" onClick={(e) => e.stopPropagation()}>
                        {f.name}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="p-3 w-64">
                      <p className="text-sm font-bold">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{format(d, 'PPP')}</p>
                    </PopoverContent>
                  </Popover>
                ))}
                {evs.map(ev => (
                  <Popover key={ev.id}>
                    <PopoverTrigger asChild>
                      <div 
                        className="truncate rounded-md bg-secondary/30 text-secondary-foreground px-1 py-0.5 text-[10px] font-medium" 
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ev.title}
                      </div>
                    </PopoverTrigger>
                    <PopoverContent className="p-3 w-64 animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-sm font-bold">{ev.title}</p>
                          <p className="text-xs text-muted-foreground">{format(d, 'PPP')}</p>
                        </div>
                        <div className="flex gap-1">
                          <button 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              onEditEvent?.(ev); 
                            }} 
                            className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-primary"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <button 
                                onClick={(e) => e.stopPropagation()} 
                                className="p-1 hover:bg-accent rounded text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </AlertDialogTrigger>
                            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Event?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete your event.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (onDeleteEvent) {
                                      onDeleteEvent(ev.id);
                                    }
                                  }} 
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      {ev.description && <p className="text-xs border-t pt-2 mt-2">{ev.description}</p>}
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