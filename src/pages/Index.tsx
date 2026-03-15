import { useEffect, useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar as CalIcon, LogIn, LogOut, Plus, Layers } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { CalendarGrid } from '@/components/CalendarGrid';
import { toast } from 'sonner';
import { FestivalSidebar } from '@/components/FestivalSidebar';
import { ZodiacInsight } from '@/components/ZodiacInsight';
import { DateConverterModal } from '@/components/DateConverterModal';
import { AuthModal } from '@/components/AuthModal';
import { AddEventModal } from '@/components/AddEventModal';
import { gregorianToVikramSamvat, gregorianToSaka, type MonthScheme, type CalendarId } from '@/lib/calendar-utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const Index = () => {
  const { user, signOut } = useAuth();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [baseCalendar, setBaseCalendar] = useState<CalendarId>('gregorian');
  const [overlayCalendar, setOverlayCalendar] = useState<'none' | CalendarId>('none');
  const [monthScheme, setMonthScheme] = useState<MonthScheme>('purnimanta');
  const [authOpen, setAuthOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const handleDateClick = (date: Date) => {
    if (user) {
      setSelectedDate(date);
      setEditingEvent(null);
      setAddEventOpen(true);
    }
  };

  const handleEditEvent = (event: any) => {
    setEditingEvent(event);
    setAddEventOpen(true);
  };

  const handleDeleteEvent = async (id: string) => {
    const { error } = await supabase.from('user_events').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete event');
    } else {
      toast.success('Event deleted');
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalIcon className="h-6 w-6 text-primary" />
            <h1 className="font-display text-xl font-bold">Subcontinent Calendar</h1>
          </div>
          <div className="flex items-center gap-2">
            <DateConverterModal />
            {user ? (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleDateClick(new Date())} className="gap-1">
                  <Plus className="h-4 w-4" /> Add Event
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)}>Sign In</Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft /></Button>
            <h2 className="font-display text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</h2>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight /></Button>
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Layers className="mr-2 h-4 w-4" /> View Options</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Base Calendar</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setBaseCalendar('gregorian')}>Gregorian</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBaseCalendar('vikram')}>Vikram Samvat</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setBaseCalendar('saka')}>Saka Era</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Overlay</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setOverlayCalendar('none')}>None</DropdownMenuItem>
                {baseCalendar !== 'vikram' && <DropdownMenuItem onClick={() => setOverlayCalendar('vikram')}>Vikram Samvat</DropdownMenuItem>}
                {baseCalendar !== 'saka' && <DropdownMenuItem onClick={() => setOverlayCalendar('saka')}>Saka Era</DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>VS Scheme</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setMonthScheme('amanta')}>Amanta (South/West)</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMonthScheme('purnimanta')}>Purnimanta (North)</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <CalendarGrid 
            currentDate={currentDate} 
            baseCalendar={baseCalendar} 
            overlayCalendar={overlayCalendar} 
            onDateClick={handleDateClick}
            monthScheme={monthScheme}
            onDeleteEvent={handleDeleteEvent}
            onEditEvent={handleEditEvent}
          />
          <div className="space-y-6">
            <FestivalSidebar currentDate={currentDate} />
            <ZodiacInsight month={currentDate.getMonth()} />
          </div>
        </div>
      </main>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <AddEventModal 
        open={addEventOpen} 
        onOpenChange={setAddEventOpen} 
        selectedDate={selectedDate} 
        editingEvent={editingEvent}
      />
    </div>
  );
};

export default Index;