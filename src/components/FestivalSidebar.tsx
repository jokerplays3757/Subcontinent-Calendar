import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { CalendarHeart, MapPin, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

interface FestivalSidebarProps {
  currentDate: Date;
}

export function FestivalSidebar({ currentDate }: FestivalSidebarProps) {
  const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

  const { data: festivals, isLoading } = useQuery({
    queryKey: ['festivals', monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('festivals')
        .select('*')
        .gte('gregorian_date', monthStart)
        .lte('gregorian_date', monthEnd)
        .order('gregorian_date');
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="rounded-xl border bg-card p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <CalendarHeart className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Festivals This Month
        </h3>
      </div>
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      ) : festivals && festivals.length > 0 ? (
        <div className="space-y-3">
          {festivals.map((f) => (
            <div
              key={`${f.id}-${f.gregorian_date}`}
              className="rounded-lg bg-muted/50 p-3 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{f.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(f.gregorian_date + 'T00:00:00'), 'MMM d, yyyy')}
                  </p>
                </div>
                {f.is_national_holiday && (
                  <Star className="h-3.5 w-3.5 text-secondary flex-shrink-0 mt-0.5" />
                )}
              </div>
              {f.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.description}</p>
              )}
              <div className="flex gap-1.5 mt-2">
                {f.region && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
                    <MapPin className="h-2.5 w-2.5 mr-0.5" />
                    {f.region}
                  </Badge>
                )}
                {f.religion && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5">
                    {f.religion}
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-6">
          No festivals this month
        </p>
      )}
    </div>
  );
}
