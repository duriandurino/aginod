'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase, ReliefPin, UserProfile } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Check, X, Trash2, UserCheck, UserX, Shield, Eye, Clock, Archive, ArchiveRestore } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Helper functions to convert UTC to Philippines time (UTC+8) for display only
const formatPhilippinesDateOnly = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  };
  return date.toLocaleString('en-US', options);
};

const formatPhilippinesDateTimeFull = (dateString: string) => {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  };
  return date.toLocaleString('en-US', options);
};

export default function AdminPanel() {
  const { user, profile, loading, isAdmin } = useAuth();
  const router = useRouter();
  const [pins, setPins] = useState<ReliefPin[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [actionDialog, setActionDialog] = useState<{ 
    open: boolean; 
    id: string; 
    type: 'pin' | 'user'; 
    action: 'delete' | 'complete' | 'hide' 
  }>({
    open: false,
    id: '',
    type: 'pin',
    action: 'delete',
  });
  const [viewPin, setViewPin] = useState<ReliefPin | null>(null);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      router.push('/dashboard');
    }
  }, [user, loading, isAdmin, router]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchData();
    }
  }, [user, isAdmin]);

  const fetchData = async () => {
    setLoadingData(true);
    try {
      const [pinsResult, usersResult] = await Promise.all([
        supabase
          .from('relief_pins')
          .select('*, user_profile:user_profiles(*)')
          // Don't filter by is_active - show all pins including hidden ones in the list
          .order('created_at', { ascending: false }),
        supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false }),
      ]);

      if (pinsResult.error) throw pinsResult.error;
      if (usersResult.error) throw usersResult.error;

      setPins(pinsResult.data || []);
      setUsers(usersResult.data || []);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoadingData(false);
    }
  };

  const handlePinStatusUpdate = async (pinId: string, status: 'approved' | 'rejected' | 'completed') => {
    try {
      const { error } = await supabase
        .from('relief_pins')
        .update({ status })
        .eq('id', pinId);

      if (error) throw error;

      toast.success(`Pin ${status} successfully`);
      fetchData();
    } catch (error: any) {
      console.error('Error updating pin:', error);
      toast.error('Failed to update pin');
    }
  };

  const handlePinHide = async (pinId: string) => {
    try {
      const { error } = await supabase
        .from('relief_pins')
        .update({ is_active: false })
        .eq('id', pinId);

      if (error) throw error;

      toast.success('Pin hidden from map successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error hiding pin:', error);
      toast.error('Failed to hide pin');
    }
  };

  const handlePinUnhide = async (pinId: string) => {
    try {
      const { error } = await supabase
        .from('relief_pins')
        .update({ is_active: true })
        .eq('id', pinId);

      if (error) throw error;

      toast.success('Pin restored to map successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error unhiding pin:', error);
      toast.error('Failed to unhide pin');
    }
  };

  const handleDeletePin = async (pinId: string) => {
    try {
      const { error } = await supabase
        .from('relief_pins')
        .delete()
        .eq('id', pinId);

      if (error) throw error;

      toast.success('Pin deleted successfully');
      fetchData();
    } catch (error: any) {
      console.error('Error deleting pin:', error);
      toast.error('Failed to delete pin');
    }
  };

  const handleUserToggle = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchData();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user');
    }
  };

  const handleRoleToggle = async (userId: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'admin' ? 'public' : 'admin';
      const { error } = await supabase
        .from('user_profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast.success(`User role updated to ${newRole}`);
      fetchData();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast.error('Failed to update user role');
    }
  };

  const stats = {
    totalPins: pins.length,
    pendingPins: pins.filter(p => p.status === 'pending').length,
    approvedPins: pins.filter(p => p.status === 'approved').length,
    completedPins: pins.filter(p => p.status === 'completed').length,
    totalUsers: users.length,
    activeUsers: users.filter(u => u.is_active).length,
    admins: users.filter(u => u.role === 'admin').length,
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => router.push('/dashboard')}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-purple-600" />
                Admin Panel
              </h1>
              <p className="text-sm text-gray-600">Manage users and relief pins</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Pending Pins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats.pendingPins}</div>
              <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{stats.completedPins}</div>
              <p className="text-xs text-gray-500 mt-1">Finished relief</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.totalUsers}</div>
              <p className="text-xs text-gray-500 mt-1">{stats.activeUsers} active</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats.admins}</div>
              <p className="text-xs text-gray-500 mt-1">Administrator accounts</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pins" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pins">Relief Pins ({stats.totalPins})</TabsTrigger>
            <TabsTrigger value="users">Users ({stats.totalUsers})</TabsTrigger>
          </TabsList>

          <TabsContent value="pins">
            <Card>
              <CardHeader>
                <CardTitle>Manage Relief Pins</CardTitle>
                <CardDescription>Approve, reject, or delete relief distribution pins</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Location</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pins.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                            No pins found
                          </TableCell>
                        </TableRow>
                      ) : (
                        pins.map((pin) => (
                          <TableRow key={pin.id} className={!pin.is_active ? 'opacity-50 bg-gray-50' : ''}>
                            <TableCell className="font-medium">
                              {pin.location_name}
                              {!pin.is_active && (
                                <Badge variant="outline" className="ml-2 text-xs bg-orange-50 text-orange-700 border-orange-300">
                                  Hidden
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{pin.relief_type}</Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {pin.user_profile?.full_name || pin.user_profile?.email || 'Unknown'}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  pin.status === 'approved'
                                    ? 'bg-green-100 text-green-800'
                                    : pin.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : pin.status === 'completed'
                                    ? 'bg-gray-100 text-gray-800'
                                    : 'bg-red-100 text-red-800'
                                }
                              >
                                {pin.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-gray-600">
                              {formatPhilippinesDateOnly(pin.created_at)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setViewPin(pin)}
                                  title="View details"
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                                {pin.status === 'pending' && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-green-600 hover:text-green-700"
                                      onClick={() => handlePinStatusUpdate(pin.id, 'approved')}
                                      title="Approve pin"
                                    >
                                      <Check className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="text-red-600 hover:text-red-700"
                                      onClick={() => handlePinStatusUpdate(pin.id, 'rejected')}
                                      title="Reject pin"
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </>
                                )}
                                {pin.status === 'approved' && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-gray-600 hover:text-gray-700"
                                    onClick={() => setActionDialog({ open: true, id: pin.id, type: 'pin', action: 'complete' })}
                                    title="Mark as completed"
                                  >
                                    <Clock className="w-4 h-4" />
                                  </Button>
                                )}
                                {pin.is_active ? (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-orange-600 hover:text-orange-700"
                                    onClick={() => setActionDialog({ open: true, id: pin.id, type: 'pin', action: 'hide' })}
                                    title="Hide from map (pin stays in list)"
                                  >
                                    <Archive className="w-4 h-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-green-600 hover:text-green-700"
                                    onClick={() => handlePinUnhide(pin.id)}
                                    title="Show on map again"
                                  >
                                    <ArchiveRestore className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-red-600 hover:text-red-700"
                                  onClick={() => setActionDialog({ open: true, id: pin.id, type: 'pin', action: 'delete' })}
                                  title="Delete pin (permanent)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>Manage Users</CardTitle>
                <CardDescription>Control user access and roles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Joined</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((usr) => (
                        <TableRow key={usr.id}>
                          <TableCell className="font-medium">
                            {usr.full_name || 'N/A'}
                          </TableCell>
                          <TableCell className="text-sm">{usr.email}</TableCell>
                          <TableCell>
                            <Badge
                              className={
                                usr.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            >
                              {usr.role}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={
                                usr.is_active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }
                            >
                              {usr.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {formatPhilippinesDateOnly(usr.created_at)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleRoleToggle(usr.id, usr.role)}
                                disabled={usr.id === user?.id}
                                title="Toggle admin role"
                              >
                                <Shield className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className={usr.is_active ? 'text-red-600' : 'text-green-600'}
                                onClick={() => handleUserToggle(usr.id, usr.is_active)}
                                disabled={usr.id === user?.id}
                                title={usr.is_active ? 'Deactivate user' : 'Activate user'}
                              >
                                {usr.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AlertDialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionDialog.action === 'delete' ? 'Are you sure?' : 
               actionDialog.action === 'complete' ? 'Mark as Completed?' :
               'Hide Pin?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionDialog.action === 'delete' && 'This action cannot be undone. This will permanently delete the pin.'}
              {actionDialog.action === 'complete' && 'This will mark the relief pin as completed. It will be hidden from active relief pins.'}
              {actionDialog.action === 'hide' && 'This will hide the pin from public view. It can be restored later if needed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (actionDialog.type === 'pin') {
                  if (actionDialog.action === 'delete') {
                    handleDeletePin(actionDialog.id);
                  } else if (actionDialog.action === 'complete') {
                    handlePinStatusUpdate(actionDialog.id, 'completed');
                  } else if (actionDialog.action === 'hide') {
                    handlePinHide(actionDialog.id);
                  }
                }
                setActionDialog({ open: false, id: '', type: 'pin', action: 'delete' });
              }}
              className={
                actionDialog.action === 'delete' ? 'bg-red-600 hover:bg-red-700' :
                actionDialog.action === 'complete' ? 'bg-gray-600 hover:bg-gray-700' :
                'bg-orange-600 hover:bg-orange-700'
              }
            >
              {actionDialog.action === 'delete' ? 'Delete' :
               actionDialog.action === 'complete' ? 'Complete' :
               'Hide'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!viewPin} onOpenChange={() => setViewPin(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pin Details</DialogTitle>
            <DialogDescription>Full information about this relief pin</DialogDescription>
          </DialogHeader>
          {viewPin && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Location</h3>
                <p>{viewPin.location_name}</p>
                <p className="text-sm text-gray-600">
                  Coordinates: {viewPin.latitude.toFixed(6)}, {viewPin.longitude.toFixed(6)}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Relief Type</h3>
                <Badge>{viewPin.relief_type}</Badge>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-sm text-gray-700">{viewPin.description}</p>
              </div>
              {viewPin.photo_url && (
                <div>
                  <h3 className="font-semibold mb-2">Photo Proof</h3>
                  <img
                    src={viewPin.photo_url}
                    alt="Relief proof"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold mb-2">Status</h3>
                <Badge
                  className={
                    viewPin.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : viewPin.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }
                >
                  {viewPin.status}
                </Badge>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Submitted</h3>
                <p className="text-sm text-gray-600">
                  {formatPhilippinesDateTimeFull(viewPin.created_at)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
