
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Plus, Edit, Trash2 } from 'lucide-react';

interface PollingStation {
  id: string;
  station_code: string;
  station_name: string;
  constituency: string;
  parish: string;
  address: string;
  assigned_observers: string[];
}

const fetchPollingStations = async (): Promise<PollingStation[]> => {
  const { data, error } = await supabase
    .from('polling_stations')
    .select('*')
    .order('station_code');

  if (error) throw error;
  return data || [];
};

const createPollingStation = async (station: Omit<PollingStation, 'id' | 'assigned_observers'>) => {
  const { data, error } = await supabase
    .from('polling_stations')
    .insert([station])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const PollingStationsManager: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [newStation, setNewStation] = useState({
    station_code: '',
    station_name: '',
    constituency: '',
    parish: '',
    address: ''
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stations, isLoading, error } = useQuery({
    queryKey: ['polling-stations'],
    queryFn: fetchPollingStations,
  });

  const createMutation = useMutation({
    mutationFn: createPollingStation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['polling-stations'] });
      setNewStation({
        station_code: '',
        station_name: '',
        constituency: '',
        parish: '',
        address: ''
      });
      setIsCreating(false);
      toast({
        title: "Success",
        description: "Polling station created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateStation = () => {
    if (!newStation.station_code || !newStation.station_name || !newStation.constituency) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(newStation);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Error loading polling stations</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Polling Stations</h1>
          <p className="text-gray-600">Manage polling station information and assignments</p>
        </div>
        <Button onClick={() => setIsCreating(!isCreating)} className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Station
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Polling Station</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="station_code">Station Code *</Label>
                <Input
                  id="station_code"
                  value={newStation.station_code}
                  onChange={(e) => setNewStation({ ...newStation, station_code: e.target.value })}
                  placeholder="e.g., ST001"
                />
              </div>
              <div>
                <Label htmlFor="station_name">Station Name *</Label>
                <Input
                  id="station_name"
                  value={newStation.station_name}
                  onChange={(e) => setNewStation({ ...newStation, station_name: e.target.value })}
                  placeholder="e.g., Kingston Primary School"
                />
              </div>
              <div>
                <Label htmlFor="constituency">Constituency *</Label>
                <Input
                  id="constituency"
                  value={newStation.constituency}
                  onChange={(e) => setNewStation({ ...newStation, constituency: e.target.value })}
                  placeholder="e.g., Kingston Central"
                />
              </div>
              <div>
                <Label htmlFor="parish">Parish</Label>
                <Input
                  id="parish"
                  value={newStation.parish}
                  onChange={(e) => setNewStation({ ...newStation, parish: e.target.value })}
                  placeholder="e.g., Kingston"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={newStation.address}
                onChange={(e) => setNewStation({ ...newStation, address: e.target.value })}
                placeholder="Full address of the polling station"
              />
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handleCreateStation}
                disabled={createMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {createMutation.isPending ? 'Creating...' : 'Create Station'}
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {stations?.map((station) => (
          <Card key={station.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-green-600" />
                  <CardTitle className="text-lg">{station.station_code}</CardTitle>
                </div>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h3 className="font-semibold text-gray-900">{station.station_name}</h3>
                <p className="text-sm text-gray-600">{station.address}</p>
              </div>
              <div className="flex space-x-2">
                <Badge variant="outline">{station.constituency}</Badge>
                {station.parish && <Badge variant="outline">{station.parish}</Badge>}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Assigned Observers: {station.assigned_observers?.length || 0}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stations?.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No polling stations found</h3>
          <p className="text-gray-600 mb-4">Get started by creating your first polling station.</p>
          <Button onClick={() => setIsCreating(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add First Station
          </Button>
        </div>
      )}
    </div>
  );
};
