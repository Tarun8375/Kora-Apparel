'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-6 text-center">
      <div
        className="glass p-12 max-w-lg flex flex-col items-center justify-center gap-6 border-0"
      >
        <span className="text-[10px] uppercase tracking-widest font-bold text-destructive px-3 py-1 bg-destructive/10">System Error</span>
        <h2 className="text-3xl font-serif uppercase tracking-luxury">We've Hit A Snag</h2>
        <p className="text-muted-foreground text-xs uppercase tracking-widest leading-relaxed">
          Something unexpected occurred while processing your request. Our minimal interface requires minimal disruption.
        </p>
        <Button 
          onClick={() => reset()}
          size="lg"
          className="rounded-none bg-foreground text-background hover:bg-transparent hover:text-foreground border border-transparent hover:border-foreground uppercase tracking-luxury text-xs px-8 mt-4 transition-all duration-300"
        >
          <RefreshCcw className="w-4 h-4 mr-3" />
          Attempt Recovery
        </Button>
      </div>
    </div>
  );
}
