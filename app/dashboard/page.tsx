'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase, ReliefPin } from '@/lib/supabase-client';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, LogOut, Settings, Filter, CircleAlert as AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import PinFormModal from '@/components/PinFormModal';

const ReliefMap = dynamic(() => import('@/components/ReliefMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[600px] bg-gray-100 rounded-lg flex items-center justify-center">
      <p className="text-gray-500">Loading map...</p>
    </div>
  ),
});

export default function Dashboard() {
  const { user, profile, loading, signOut, isAdmin } = useAuth();
  const router = useRouter();
  const [pins, setPins] = useState<ReliefPin[]>([]);
  const [filteredPins, setFilteredPins] = useState<ReliefPin[]>([]);
  const [loadingPins, setLoadingPins] = useState(true);
  const [showPinModal, setShowPinModal] = useState(false);
  const [selectedPin, setSelectedPin] = useState<ReliefPin | null>(null);
  const [selectedLatLng, setSelectedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending'>('approved');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchPins();

      const channel = supabase
        .channel('relief_pins_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'relief_pins' },
          () => {
            fetchPins();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredPins(pins);
    } else {
      setFilteredPins(pins.filter(pin => pin.status === statusFilter));
    }
  }, [pins, statusFilter]);

  const fetchPins = async () => {
    try {
      let query = supabase
        .from('relief_pins')
        .select('*, user_profile:user_profiles(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (!isAdmin) {
        query = query.or(`status.eq.approved,user_id.eq.${user?.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPins(data || []);
    } catch (error: any) {
      console.error('Error fetching pins:', error);
      toast.error('Failed to load relief pins');
    } finally {
      setLoadingPins(false);
    }
  };

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLatLng({ lat, lng });
    setSelectedPin(null);
    setShowPinModal(true);
  };

  const handlePinClick = (pin: ReliefPin) => {
    setSelectedPin(pin);
  };

  const stats = {
    total: pins.length,
    approved: pins.filter(p => p.status === 'approved').length,
    pending: pins.filter(p => p.status === 'pending').length,
    myPins: pins.filter(p => p.user_id === user?.id).length,
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Northern Cebu Relief Tracker</h1>
                <p className="text-sm text-gray-600">
                  {profile.full_name || profile.email}
                  {isAdmin && (
                    <Badge className="ml-2 bg-purple-600">Admin</Badge>
                  )}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <Button
                  variant="outline"
                  onClick={() => router.push('/admin')}
                  className="hidden md:flex"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Admin Panel
                </Button>
              )}
              <Button variant="outline" onClick={signOut}>
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Pins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Approved</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">My Pins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.myPins}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Relief Distribution Map</CardTitle>
                <CardDescription>Click on the map to add a new relief pin</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setStatusFilter(statusFilter === 'all' ? 'approved' : statusFilter === 'approved' ? 'pending' : 'all')}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {statusFilter === 'all' ? 'All' : statusFilter === 'approved' ? 'Approved' : 'Pending'}
                </Button>
                <Button onClick={() => setShowPinModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Pin
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loadingPins ? (
              <div className="h-[600px] flex items-center justify-center">
                <p className="text-gray-500">Loading pins...</p>
              </div>
            ) : (
              <ReliefMap
                pins={filteredPins}
                onPinClick={handlePinClick}
                onMapClick={handleMapClick}
                height="600px"
              />
            )}
          </CardContent>
        </Card>

        {stats.pending > 0 && !isAdmin && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                Pending Approval
              </CardTitle>
              <CardDescription className="text-yellow-700">
                You have {stats.pending} pin{stats.pending > 1 ? 's' : ''} awaiting admin approval.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
      </main>

      <PinFormModal
        open={showPinModal}
        onClose={() => {
          setShowPinModal(false);
          setSelectedPin(null);
          setSelectedLatLng(null);
        }}
        pin={selectedPin}
        defaultLat={selectedLatLng?.lat}
        defaultLng={selectedLatLng?.lng}
        onSuccess={fetchPins}
      />
    </div>
  );
}
