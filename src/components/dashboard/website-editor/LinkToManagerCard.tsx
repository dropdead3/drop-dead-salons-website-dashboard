import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LinkToManagerCardProps {
  title: string;
  description: string;
  linkHref: string;
  linkText: string;
}

export function LinkToManagerCard({ title, description, linkHref, linkText }: LinkToManagerCardProps) {
  return (
    <div className="max-w-2xl">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to={linkHref} className="inline-flex items-center gap-2">
              {linkText}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
