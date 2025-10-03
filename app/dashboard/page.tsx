'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { supabase, ReliefPin } from '@/lib/supabase-client';
import { autoCompleteReliefPins, getActiveReliefPins } from '@/lib/relief-utils';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Plus, LogOut, Settings, Filter, CircleAlert as AlertCircle } from 'lucide-react';
import { HeartPinIcon } from '@/components/ui/HeartPinIcon';
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
  const [statusFilter, setStatusFilter] = useState<'active' | 'all' | 'approved' | 'pending' | 'completed'>('active');
  const [signingOut, setSigningOut] = useState(false);
  const fetchingRef = useRef(false);
  const hasInitialFetch = useRef(false);

  const fetchPins = useCallback(async () => {
    // Prevent duplicate fetches
    if (fetchingRef.current) {
      console.log('Fetch already in progress, skipping...');
      return;
    }

    try {
      if (!user) {
        console.log('No user, skipping fetch');
        setLoadingPins(false);
        return;
      }

      fetchingRef.current = true;

      // Fetch all pins including completed ones for filtering
      let query = supabase
        .from('relief_pins')
        .select('*, user_profile:user_profiles(*)')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Check if user is admin (based on profile role)
      const userIsAdmin = profile?.role === 'admin';

      if (!userIsAdmin) {
        // Public users see approved pins and their own pins (all statuses)
        query = query.or(`status.eq.approved,user_id.eq.${user.id}`);
      }
      // Admins see all active pins

      const { data, error } = await query;
      
      if (error) {
        console.error('Query error:', error);
        throw error;
      }
      
      console.log(`Fetched ${data?.length || 0} pins (isAdmin: ${userIsAdmin})`);
      setPins(data || []);
      hasInitialFetch.current = true;
    } catch (error: any) {
      console.error('Error fetching pins:', error);
      toast.error('Failed to load relief pins');
      setPins([]); // Set empty array on error to prevent infinite loading
    } finally {
      setLoadingPins(false);
      fetchingRef.current = false;
    }
  }, [user, profile]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user && !loading && profile && !hasInitialFetch.current) {
      // Wait for both user AND profile to be loaded
      console.log('User and profile loaded, fetching pins...');
      
      // Auto-complete pins first, then fetch (only on initial load)
      autoCompleteReliefPins().then(() => {
        fetchPins();
      }).catch((error) => {
        console.error('Error in auto-complete:', error);
        // Still fetch pins even if auto-complete fails
        fetchPins();
      });
    }
  }, [user, loading, profile, fetchPins]);

  // Set up realtime subscription separately
  useEffect(() => {
    if (user && hasInitialFetch.current) {
      const channel = supabase
        .channel('relief_pins_changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'relief_pins' },
          () => {
            console.log('Realtime update detected, refetching pins...');
            fetchPins();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, fetchPins]);

  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredPins(pins);
    } else if (statusFilter === 'active') {
      // Show only non-completed pins (approved, pending, rejected)
      setFilteredPins(pins.filter(pin => pin.status !== 'completed'));
    } else {
      setFilteredPins(pins.filter(pin => pin.status === statusFilter));
    }
  }, [pins, statusFilter]);

  const handleMapClick = (lat: number, lng: number) => {
    setSelectedLatLng({ lat, lng });
    setSelectedPin(null);
    setShowPinModal(true);
  };

  const handlePinClick = (pin: ReliefPin) => {
    setSelectedPin(pin);
  };

  const stats = useMemo(() => ({
    total: pins.length,
    active: pins.filter(p => p.status !== 'completed').length,
    approved: pins.filter(p => p.status === 'approved').length,
    pending: pins.filter(p => p.status === 'pending').length,
    completed: pins.filter(p => p.status === 'completed').length,
    myPins: pins.filter(p => p.user_id === user?.id).length,
  }), [pins, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    router.push('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <HeartPinIcon className="w-6 h-6" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Aginod</h1>
                <p className="text-sm text-gray-600">
                  {profile?.full_name || profile?.email || user?.email || 'User'}
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
              <Button 
                variant="outline" 
                disabled={signingOut}
                onClick={async () => {
                  try {
                    setSigningOut(true);
                    await signOut();
                  } catch (error) {
                    console.error('Sign out error:', error);
                    toast.error('Failed to sign out. Please try again.');
                  } finally {
                    setSigningOut(false);
                  }
                }}
              >
                {signingOut ? (
                  <>
                    <div className="w-4 h-4 mr-2 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                    Signing Out...
                  </>
                ) : (
                  <>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Active Relief</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
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
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">My Pins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.myPins}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Relief Distribution Map</CardTitle>
                <CardDescription>Click on the map to add a new relief pin (auto-approved)</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const filters = ['active', 'all', 'approved', 'pending', 'completed'];
                    const currentIndex = filters.indexOf(statusFilter);
                    const nextIndex = (currentIndex + 1) % filters.length;
                    setStatusFilter(filters[nextIndex] as any);
                  }}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  {statusFilter === 'active' ? 'Active' : 
                   statusFilter === 'all' ? 'All' : 
                   statusFilter === 'approved' ? 'Approved' : 
                   statusFilter === 'pending' ? 'Pending' : 'Completed'}
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
                currentUserId={user?.id}
              />
            )}
          </CardContent>
        </Card>

        {stats.pending > 0 && !isAdmin && (
          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <MapPin className="w-5 h-5" />
                Recent Activity
              </CardTitle>
              <CardDescription className="text-green-700">
                You have {stats.pending} pin{stats.pending > 1 ? 's' : ''} that are currently being processed.
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
