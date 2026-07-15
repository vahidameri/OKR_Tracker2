'use client';

import { Button } from '@/components/ui/button';

export function PrintButton() {
  return (
    <Button className="no-print" onClick={() => window.print()}>
      چاپ / ذخیره PDF
    </Button>
  );
}
