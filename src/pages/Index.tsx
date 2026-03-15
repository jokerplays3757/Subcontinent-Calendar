import { useEffect, useState } from 'react';
import { format, addMonths, subMonths } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  LogIn,
  LogOut,
  Plus,
  Layers,
  RefreshCw,
} from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from '@/components/ui/dropdown-menu';
import { gapi } from 'gapi-script';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface GoogleCalendarEvent {
  id: string;
  title: string;
  startDate: string; // yyyy-MM-dd
}

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
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly';

  useEffect(() => {
    function initClient() {
      gapi.client.init({
        apiKey: GOOGLE_API_KEY,
        clientId: GOOGLE_CLIENT_ID,
        discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
        scope: GOOGLE_SCOPES,
      }).catch(() => {});
    }
    gapi.load('client:auth2', initClient);
  }, [GOOGLE_API_KEY, GOOGLE_CLIENT_ID]);

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
      setAddEventOpen(false);
      setEditingEvent(null);
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
    }
  };

  const handleSyncGoogleCalendar = async () => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      toast.error('Google Calendar is not configured.');
      return;
    }
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      if (!authInstance) {
        await gapi.client.init({
          apiKey: GOOGLE_API_KEY,
          clientId: GOOGLE_CLIENT_ID,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          scope: GOOGLE_SCOPES,
        });
      }
      const updatedAuth = gapi.auth2.getAuthInstance();
      await updatedAuth.signIn();
      
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const timeMin = monthStart.toISOString();
      const timeMax = new Date(monthEnd.getTime() + 86400000).toISOString();
  
      // FIX: Cast gapi.client to 'any' so TypeScript allows the '.calendar' property
      const response = await (gapi.client as any).calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        singleEvents: true,
      });
  
      const mapped: GoogleCalendarEvent[] = (response.result.items ?? []).map((event: any) => {
        const start = event.start?.date || event.start?.dateTime;
        if (!start) return null;
        const d = new Date(start);
        return { 
          id: event.id, 
          title: event.summary || '(No title)', 
          startDate: d.toISOString().slice(0, 10) 
        };
      }).filter((e: any): e is GoogleCalendarEvent => e !== null);
  
      setGoogleEvents(mapped);
      toast.success(`Synced ${mapped.length} Google events.`);
    } catch (error) {
      console.error("Sync Error:", error);
      toast.error('Failed to sync Google Calendar.');
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
            <Button variant="outline" size="sm" onClick={handleSyncGoogleCalendar} className="gap-1">
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Sync Google Calendar</span>
            </Button>
            {user ? (
              <div className="flex items-center gap-2">
                <Button size="sm" onClick={() => handleDateClick(new Date())} className="gap-1">
                  <Plus className="h-4 w-4" /> <span className="hidden sm:inline">Add Event</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}><LogOut className="h-4 w-4" /></Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)}><LogIn className="h-4 w-4" /></Button>
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
             <Button variant="ghost" size="sm" onClick={() => setCurrentDate(new Date())} className="text-xs">Today</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Layers className="mr-2 h-4 w-4" /> View Options</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Base Calendar</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={baseCalendar === 'gregorian'} onClick={() => setBaseCalendar('gregorian')}>Gregorian</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={baseCalendar === 'vikram'} onClick={() => setBaseCalendar('vikram')}>Vikram Samvat</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={baseCalendar === 'saka'} onClick={() => setBaseCalendar('saka')}>Saka Era</DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Overlay</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={overlayCalendar === 'none'} onClick={() => setOverlayCalendar('none')}>None</DropdownMenuCheckboxItem>
                {baseCalendar !== 'vikram' && <DropdownMenuCheckboxItem checked={overlayCalendar === 'vikram'} onClick={() => setOverlayCalendar('vikram')}>Vikram Samvat</DropdownMenuCheckboxItem>}
                {baseCalendar !== 'saka' && <DropdownMenuCheckboxItem checked={overlayCalendar === 'saka'} onClick={() => setOverlayCalendar('saka')}>Saka Era</DropdownMenuCheckboxItem>}
                {baseCalendar !== 'gregorian' && <DropdownMenuCheckboxItem checked={overlayCalendar === 'gregorian'} onClick={() => setOverlayCalendar('gregorian')}>Gregorian</DropdownMenuCheckboxItem>}
                <DropdownMenuSeparator />
                <DropdownMenuLabel>VS Scheme</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem checked={monthScheme === 'amanta'} onClick={() => setMonthScheme('amanta')}>Amanta (South/West)</DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem checked={monthScheme === 'purnimanta'} onClick={() => setMonthScheme('purnimanta')}>Purnimanta (North)</DropdownMenuCheckboxItem>
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
            googleEvents={googleEvents}
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