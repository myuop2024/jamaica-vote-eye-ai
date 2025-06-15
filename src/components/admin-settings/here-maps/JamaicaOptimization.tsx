
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export const JamaicaOptimization: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Jamaica Optimization</CardTitle>
        <CardDescription>
          This configuration is optimized for Jamaican addresses and locations.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Geocoding biased to Jamaica bounding box</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Parish validation for 14 Jamaican parishes</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Address formatting for Jamaican addresses</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>Places search centered on Jamaica</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
