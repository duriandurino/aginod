'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Heart, Shield, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const { user, loading, signInWithFacebook } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  const handleSignIn = async () => {
    try {
      await signInWithFacebook();
    } catch (error) {
      toast.error('Failed to sign in with Facebook. Please try again.');
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
              <div className="bg-blue-600 p-4 rounded-full">
                <MapPin className="w-12 h-12 text-white" />
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
                Sign in with Facebook to start tracking relief efforts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleSignIn}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-6 text-lg"
                size="lg"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                Continue with Facebook
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
