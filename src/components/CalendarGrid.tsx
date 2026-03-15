import { useState, useMemo } from 'react';
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
import { useUserEvents } from '@/components/AddEventModal';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface CalendarGridProps {
  currentDate: Date;
  baseCalendar: CalendarId;
  overlayCalendar: 'none' | CalendarId;
  onDateClick: (date: Date) => void;
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
  monthScheme = 'purnimanta',
  googleEvents = [],
}: CalendarGridProps) {
  const { user } = useAuth();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const monthStartStr = format(monthStart, 'yyyy-MM-dd');
  const monthEndStr = format(monthEnd, 'yyyy-MM-dd');

  // Fetch festivals for dots
  const { data: festivals } = useQuery({
    queryKey: ['festivals', monthStartStr, monthEndStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('festivals')
        .select('gregorian_date, name')
        .gte('gregorian_date', monthStartStr)
        .lte('gregorian_date', monthEndStr);
      if (error) throw error;
      return data;
    },
  });

  const { data: userEvents } = useUserEvents(monthStartStr, monthEndStr);

  // Build festival/event date sets
  const festivalDates = useMemo(() => {
    const map = new Map<string, string[]>();
    festivals?.forEach((f) => {
      const key = f.gregorian_date;
      const existing = map.get(key) || [];
      existing.push(f.name);
      map.set(key, existing);
    });
    return map;
  }, [festivals]);

  const eventDates = useMemo(() => {
    const map = new Map<string, string[]>();
    userEvents?.forEach((e) => {
      const key = e.event_date;
      const existing = map.get(key) || [];
      existing.push(e.title);
      map.set(key, existing);
    });
    return map;
  }, [userEvents]);

  const googleEventMap = useMemo(() => {
    const map = new Map<string, { id: string; title: string }[]>();
    googleEvents.forEach((e) => {
      const existing = map.get(e.startDate) || [];
      existing.push({ id: e.id, title: e.title });
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
    if (overlayCalendar === 'vikram') {
      const vs = gregorianToVikramSamvat(date, monthScheme);
      return vs.month.slice(0, 3);
    }
    if (overlayCalendar === 'saka') {
      const saka = gregorianToSaka(date);
      return saka.month.slice(0, 3);
    }
    if (overlayCalendar === 'gregorian') {
      return format(date, 'MMM');
    }
    return '';
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
          const hasFestival = festivalDates.has(dateKey);
          const hasEvent = eventDates.has(dateKey);
          const googleForDay = googleEventMap.get(dateKey) || [];
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
                <span className="text-[9px] text-primary/70 leading-none mt-0.5">
                  {getOverlayText(d)}
                </span>
              )}

              <div className="flex gap-0.5 mt-auto">
                {hasFestival && (
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                )}
                {hasEvent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                )}
                {googleForDay.length > 0 && (
                  <TooltipProvider delayDuration={100}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="w-1.5 h-1.5 rounded-full bg-secondary/80"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TooltipTrigger>
                      <TooltipContent className="max-w-xs">
                        <div className="text-xs font-medium mb-1">
                          Google Calendar
                        </div>
                        {googleForDay.map((ev) => (
                          <div key={ev.id} className="text-xs">
                            {ev.title}
                          </div>
                        ))}
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-primary" /> Festival
        </span>
        {user && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-secondary" /> Your Event
          </span>
        )}
        {googleEvents.length > 0 && (
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-secondary/80" /> Google Event
          </span>
        )}
      </div>
    </div>
  );
}
