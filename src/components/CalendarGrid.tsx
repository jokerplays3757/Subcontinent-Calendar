import { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  getDay,
} from 'date-fns';
import {
  gregorianToVikramSamvat,
  gregorianToSaka,
  getVikramMonthDays,
  getSakaMonthDays,
  type MonthScheme,
  type CalendarId,
} from '@/lib/calendar-utils';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserEvents, useDeleteEvent } from '@/components/AddEventModal';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';

interface CalendarGridProps {
  currentDate: Date;
  baseCalendar: CalendarId;
  overlayCalendar: 'none' | CalendarId;
  onDateClick: (date: Date) => void;
  onEditEvent?: (event: any) => void;
  monthScheme?: MonthScheme;
  googleEvents?: {
    id: string;
    title: string;
    startDate: string; // yyyy-MM-dd
  }[];
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function CalendarGrid({
  currentDate,
  baseCalendar,
  overlayCalendar,
  onDateClick,
  onEditEvent,
  monthScheme = 'purnimanta',
  googleEvents = [],
}: CalendarGridProps) {
  const { user } = useAuth();
  const deleteEvent = useDeleteEvent();
  const [eventToEdit, setEventToEdit] = useState<any>(null);
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  // Fetch festivals for event bars
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

  // Group items by Gregorian date key
  const festivalsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    festivals?.forEach((f) => {
      const key = f.gregorian_date;
      const existing = map.get(key) || [];
      existing.push(f);
      map.set(key, existing);
    });
    return map;
  }, [festivals]);

  const userEventsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    userEvents?.forEach((e) => {
      const key = e.event_date;
      const existing = map.get(key) || [];
      existing.push(e);
      map.set(key, existing);
    });
    return map;
  }, [userEvents]);

  const googleEventsByDate = useMemo(() => {
    const map = new Map<string, { id: string; title: string; startDate: string }[]>();
    googleEvents.forEach((e) => {
      const existing = map.get(e.startDate) || [];
      existing.push({ id: e.id, title: e.title, startDate: e.startDate });
      map.set(e.startDate, existing);
    });
    return map;
  }, [googleEvents]);

  // Generate base calendar days
  let baseDays: Date[] = [];
  if (baseCalendar === 'gregorian') {
    const calStart = startOfWeek(monthStart);
    const calEnd = endOfWeek(monthEnd);
    let d = calStart;
    while (d <= calEnd) {
      baseDays.push(d);
      d = addDays(d, 1);
    }
  } else if (baseCalendar === 'vikram') {
    baseDays = getVikramMonthDays(currentDate, monthScheme);
  } else {
    baseDays = getSakaMonthDays(currentDate);
  }

  // For non-Gregorian base, align month start to weekday and pad grid
  let gridDays: (Date | null)[] = [];
  if (baseCalendar === 'gregorian') {
    gridDays = baseDays;
  } else if (baseDays.length > 0) {
    const first = baseDays[0];
    const lead = getDay(first); // 0=Sun
    gridDays = [
      ...Array.from({ length: lead }, () => null),
      ...baseDays,
    ];
    // trailing blanks to complete last week
    while (gridDays.length % 7 !== 0) {
      gridDays.push(null);
    }
  }

  const getOverlayText = (date: Date): string => {
    if (overlayCalendar === 'none') return '';

    if (overlayCalendar === 'vikram') {
      const info = gregorianToVikramSamvat(date, monthScheme);
      // Compute day number within this VS month using a local month walk
      const monthDays = getVikramMonthDays(date, monthScheme);
      const idx = monthDays.findIndex(
        (d) => d.toDateString() === date.toDateString()
      );
      const dayNum = idx >= 0 ? idx + 1 : 1;
      return `${info.month.slice(0, 3)} ${dayNum}`;
    }

    if (overlayCalendar === 'saka') {
      const info = gregorianToSaka(date);
      const monthDays = getSakaMonthDays(date);
      const idx = monthDays.findIndex(
        (d) => d.toDateString() === date.toDateString()
      );
      const dayNum = idx >= 0 ? idx + 1 : 1;
      return `${info.month.slice(0, 3)} ${dayNum}`;
    }

    // Gregorian overlay
    return `${format(date, 'MMM')} ${date.getDate()}`;
  };

  return (
    <div className="animate-fade-in">
      {/* Weekday header */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="text-center text-xs font-medium text-muted-foreground py-2">
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {gridDays.map((d, i) => {
          if (!d) {
            return (
              <div
                key={`blank-${i}`}
                className="min-h-[3.5rem] bg-muted/40"
              />
            );
          }

          const dateKey = format(d, 'yyyy-MM-dd');
          const festivalsForDay = festivalsByDate.get(dateKey) || [];
          const userEventsForDay = userEventsByDate.get(dateKey) || [];
          const googleForDay = googleEventsByDate.get(dateKey) || [];
          const inMonth =
            baseCalendar === 'gregorian' ? isSameMonth(d, currentDate) : true;
          const today = isToday(d);

          // Day number according to base calendar
          let dayNumber: number;
          if (baseCalendar === 'gregorian') {
            dayNumber = d.getDate();
          } else {
            const indexInMonth = baseDays.findIndex(
              (bd) => bd.toDateString() === d.toDateString()
            );
            dayNumber = indexInMonth >= 0 ? indexInMonth + 1 : d.getDate();
          }

          return (
            <button
              key={i}
              onClick={() => onDateClick(d)}
              className={cn(
                'relative flex flex-col items-center py-2 px-1 min-h-[3.5rem] bg-card transition-colors hover:bg-accent/50',
                !inMonth && 'opacity-30',
                today && 'ring-2 ring-primary ring-inset'
              )}
            >
              <span
                className={cn(
                  'text-sm font-medium',
                  today && 'text-primary font-bold'
                )}
              >
                {dayNumber}
              </span>

              {overlayCalendar !== 'none' && (
                <span className="absolute top-1 right-1 text-[10px] text-muted-foreground leading-none">
                  {getOverlayText(d)}
                </span>
              )}

              <div className="mt-auto flex w-full flex-col gap-0.5">
                {festivalsForDay.map((fest: any) => (
                  <Popover key={fest.id}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full rounded-md bg-primary/10 text-primary px-1 py-0.5 text-[10px] text-left truncate hover:bg-primary/20 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {fest.name}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{fest.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(fest.gregorian_date + 'T00:00:00'), 'PPP')}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}

                {userEventsForDay.map((ev: any) => (
                  <Popover key={ev.id}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full rounded-md bg-secondary/20 text-secondary-foreground px-1 py-0.5 text-[10px] text-left truncate hover:bg-secondary/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ev.title}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start">
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <div className="text-sm font-semibold">{ev.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(ev.event_date + 'T00:00:00'), 'PPP')}
                          </div>
                          {ev.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {ev.description}
                            </p>
                          )}
                        </div>
                        <div className="border-t border-border mt-1 pt-2" />
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEventToEdit(ev);
                              if (onEditEvent) {
                                onEditEvent(ev);
                              }
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive/90"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEvent.mutate(ev.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}

                {googleForDay.map((ev) => (
                  <Popover key={ev.id}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="w-full rounded-md bg-sky-500/20 text-sky-700 dark:text-sky-200 px-1 py-0.5 text-[10px] text-left truncate hover:bg-sky-500/30 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {ev.title}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent side="top" align="start">
                      <div className="space-y-1">
                        <div className="text-sm font-semibold">{ev.title}</div>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(ev.startDate + 'T00:00:00'), 'PPP')}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                ))}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="h-3 rounded-md bg-primary/20 border border-primary/50 px-1" /> Festival
        </span>
        {user && (
          <span className="flex items-center gap-1">
            <span className="h-3 rounded-md bg-secondary/30 border border-secondary/60 px-1" /> Your Event
          </span>
        )}
        {googleEvents.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="h-3 rounded-md bg-sky-500/30 border border-sky-600 px-1" /> Google Event
          </span>
        )}
      </div>
    </div>
  );
}
