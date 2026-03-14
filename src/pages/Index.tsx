import { useState } from 'react';
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

const Index = () => {
  const { user, signOut } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [overlay, setOverlay] = useState<'none' | 'vikram' | 'saka'>('none');
  const [authOpen, setAuthOpen] = useState(false);
  const [addEventOpen, setAddEventOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();

  const vs = gregorianToVikramSamvat(currentDate);
  const saka = gregorianToSaka(currentDate);

  const handleDateClick = (date: Date) => {
    if (user) {
      setSelectedDate(date);
      setAddEventOpen(true);
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
