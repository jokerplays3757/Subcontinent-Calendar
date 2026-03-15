import { useEffect, useState } from 'react';
import {
  format,
  addMonths,
  subMonths,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  LogIn,
  LogOut,
  Plus,
  Layers,
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
import { gregorianToVikramSamvat, gregorianToSaka } from '@/lib/calendar-utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { gapi } from 'gapi-script';

interface GoogleCalendarEvent {
  id: string;
  title: string;
  startDate: string; // yyyy-MM-dd
}

const Index = () => {
  const { user, signOut } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [overlay, setOverlay] = useState<'none' | 'vikram' | 'saka'>('none');
  const [authOpen, setAuthOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [googleEvents, setGoogleEvents] = useState<GoogleCalendarEvent[]>([]);

  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  console.log({TEST_ENV: import.meta.env.TEST_ENV}); //just for testing
  console.log("DEBUG - Google Client ID:", GOOGLE_CLIENT_ID);
  console.log("DEBUG - Google API Key:", GOOGLE_API_KEY ? "Present" : "Missing");
  const GOOGLE_SCOPES = 'https://www.googleapis.com/auth/calendar.events.readonly';

  useEffect(() => {
    function initClient() {
      gapi.client
        .init({
          apiKey: GOOGLE_API_KEY,
          clientId: GOOGLE_CLIENT_ID,
          discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'],
          scope: GOOGLE_SCOPES,
        })
        .catch(() => {
          // ignore init errors until user actually tries to sync
        });
    }

    gapi.load('client:auth2', initClient);
  }, [GOOGLE_API_KEY, GOOGLE_CLIENT_ID]);

  const vs = gregorianToVikramSamvat(currentDate);
  const saka = gregorianToSaka(currentDate);

  const handleDateClick = (date: Date) => {
    if (user) {
      setSelectedDate(date);
      setAddEventOpen(true);
    }
  };

  const handleSyncGoogleCalendar = async () => {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
      toast.error('Google Calendar is not configured. Missing client ID or API key.');
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
      if (!updatedAuth) {
        toast.error('Unable to initialize Google authentication.');
        return;
      }

      await updatedAuth.signIn();

      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const timeMin = monthStart.toISOString();
      const timeMax = new Date(monthEnd.getTime() + 24 * 60 * 60 * 1000).toISOString();

      const response = await gapi.client.calendar.events.list({
        calendarId: 'primary',
        timeMin,
        timeMax,
        showDeleted: false,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const items = response.result.items ?? [];
      const mapped: GoogleCalendarEvent[] = items
        .map((event) => {
          const start = event.start?.date || event.start?.dateTime;
          if (!start) return null;
          const date = new Date(start);
          const yyyyMmDd = date.toISOString().slice(0, 10);
          return {
            id: event.id || `${yyyyMmDd}-${event.summary}`,
            title: event.summary || '(No title)',
            startDate: yyyyMmDd,
          };
        })
        .filter((e): e is GoogleCalendarEvent => e !== null);

      setGoogleEvents(mapped);
      toast.success(`Synced ${mapped.length} Google Calendar event(s) for this month.`);
    } catch (error) {
      console.error('Error syncing Google Calendar', error);
      toast.error('Failed to sync Google Calendar events.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalIcon className="h-6 w-6 text-primary" />
            <h1 className="font-display text-xl font-bold">
              Subcontinent Calendar
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <DateConverterModal />
            {user ? (
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={() => { setSelectedDate(new Date()); setAddEventOpen(true); }}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Event</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAuthOpen(true)} className="gap-1">
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Month navigation + overlay info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center min-w-[180px]">
              <h2 className="font-display text-2xl font-bold">
                {format(currentDate, 'MMMM yyyy')}
              </h2>
              {overlay !== 'none' && (
                <p className="text-sm text-primary animate-fade-in">
                  {overlay === 'vikram'
                    ? `${vs.month}, ${vs.year} VS`
                    : `${saka.month}, ${saka.year} SE`}
                </p>
              )}
            </div>
            <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="text-xs"
              onClick={handleSyncGoogleCalendar}
            >
              Sync Google Calendar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentDate(new Date())}
              className="text-xs"
            >
              Today
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                  <Layers className="h-4 w-4" />
                  {overlay === 'none' ? 'Regional Overlay' : overlay === 'vikram' ? 'Vikram Samvat' : 'Saka Era'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setOverlay('none')}>
                  None (Gregorian only)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOverlay('vikram')}>
                  Vikram Samvat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setOverlay('saka')}>
                  Saka Era
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Main layout: calendar + sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <div>
            <CalendarGrid
              currentDate={currentDate}
              showOverlay={overlay}
              onDateClick={handleDateClick}
              googleEvents={googleEvents}
            />
            {!user && (
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Sign in to save personal events by clicking on a date
              </p>
            )}
          </div>

          <div className="space-y-6">
            <FestivalSidebar currentDate={currentDate} />
            <ZodiacInsight month={currentDate.getMonth()} />
          </div>
        </div>
      </main>

      {/* Modals */}
      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <AddEventModal open={addEventOpen} onOpenChange={setAddEventOpen} selectedDate={selectedDate} />
    </div>
  );
};

export default Index;
