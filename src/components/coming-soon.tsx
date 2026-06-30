import { Hammer } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-4">
      <h1 className="font-serif text-2xl font-bold tracking-tight">{title}</h1>
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <Hammer className="size-6 text-primary" />
          </div>
          <p className="font-medium">Segera hadir</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {description ??
              "Modul ini sedang dibangun dan akan aktif pada tahap berikutnya."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
