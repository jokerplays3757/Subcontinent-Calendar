import { useState } from 'react';
import { format } from 'date-fns';
import { gregorianToVikramSamvat, gregorianToSaka } from '@/lib/calendar-utils';
import { ArrowRightLeft, Calendar as CalIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export function DateConverterModal() {
  const [dateStr, setDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [result, setResult] = useState<{
    gregorian: string;
    vikramSamvat: string;
    saka: string;
  } | null>(null);

  const handleConvert = () => {
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return;

    const vs = gregorianToVikramSamvat(date);
    const saka = gregorianToSaka(date);

    setResult({
      gregorian: format(date, 'MMMM d, yyyy'),
      vikramSamvat: `${vs.month} ${vs.year} VS`,
      saka: `${saka.month} ${saka.year} SE`,
    });
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowRightLeft className="h-4 w-4" />
          Date Converter
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl flex items-center gap-2">
            <CalIcon className="h-5 w-5 text-primary" />
            Date Converter
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Gregorian Date</Label>
            <Input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
            />
          </div>
          <Button onClick={handleConvert} className="w-full">
            Convert
          </Button>
          {result && (
            <div className="space-y-3 rounded-lg border p-4 animate-fade-in">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Gregorian</p>
                <p className="text-lg font-display">{result.gregorian}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Vikram Samvat</p>
                <p className="text-lg font-display text-primary">{result.vikramSamvat}</p>
              </div>
              <div className="border-t pt-3">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Saka Era</p>
                <p className="text-lg font-display text-secondary">{result.saka}</p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
