import { getVedicZodiacForMonth } from '@/lib/calendar-utils';
import { Sparkles } from 'lucide-react';

interface ZodiacInsightProps {
  month: number; // 0-11
}

export function ZodiacInsight({ month }: ZodiacInsightProps) {
  const zodiac = getVedicZodiacForMonth(month);

  return (
    <div className="rounded-xl border bg-card p-5 animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-4 w-4 text-secondary" />
        <h3 className="font-display text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Vedic Zodiac
        </h3>
      </div>
      <div className="text-center py-2">
        <span className="text-5xl">{zodiac.symbol}</span>
        <h4 className="font-display text-xl font-bold mt-2">{zodiac.name}</h4>
        <p className="text-sm text-muted-foreground">{zodiac.english}</p>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-muted p-2">
            <span className="text-muted-foreground">Element</span>
            <p className="font-medium">{zodiac.element}</p>
          </div>
          <div className="rounded-lg bg-muted p-2">
            <span className="text-muted-foreground">Ruler</span>
            <p className="font-medium">{zodiac.ruling}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{zodiac.dates}</p>
      </div>
    </div>
  );
}
