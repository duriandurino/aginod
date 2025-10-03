'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Heart, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';
import { HeartPinIcon } from '@/components/ui/HeartPinIcon';

export default function Home() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error('Failed to sign in with Google. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-cyan-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-600 p-4 rounded-full shadow-lg">
                <HeartPinIcon className="w-12 h-12" size={48} />
              </div>
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-4">
              Aginod
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Help coordinate earthquake relief efforts across Northern Cebu. Track relief distribution,
              identify underserved areas, and make a difference in your community.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <Heart className="w-10 h-10 text-red-500 mb-2" />
                <CardTitle>Track Relief</CardTitle>
                <CardDescription>
                  Pin locations where relief has been distributed with photo proof
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <MapPin className="w-10 h-10 text-blue-500 mb-2" />
                <CardTitle>Find Gaps</CardTitle>
                <CardDescription>
                  Identify underserved areas that need immediate attention
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-2 hover:border-blue-300 transition-colors">
              <CardHeader>
                <Users className="w-10 h-10 text-green-500 mb-2" />
                <CardTitle>Collaborate</CardTitle>
                <CardDescription>
                  Work together with other relief providers in real-time
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          <Card className="max-w-md mx-auto shadow-xl border-2">
            <CardHeader className="text-center">
              <Shield className="w-12 h-12 text-blue-600 mx-auto mb-2" />
              <CardTitle className="text-2xl">Get Started</CardTitle>
              <CardDescription>
                Sign in with Google to start tracking relief efforts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSignIn}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
              <p className="text-xs text-gray-500 text-center">
                By signing in, you agree to help coordinate relief efforts transparently and responsibly.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
