"use client";

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInAnonymously } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

function JoinForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillCode = searchParams.get('code') || '';
  
  const [code, setCode] = useState(prefillCode);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!code.trim() || !name.trim()) {
      setError('Please enter both a code and your name.');
      return;
    }

    setLoading(true);
    try {
      // 1. Authenticate anonymously
      await signInAnonymously(auth);
      
      // 2. Save name locally
      sessionStorage.setItem('participantName', name);
      
      // 3. Redirect to session (in a real app, we'd verify the code exists in Firestore first)
      router.push(`/session/${code.toUpperCase()}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to join session');
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-8 md:mt-20 shadow-brutal-lg border-[4px] border-black">
      <CardHeader>
        <CardTitle className="text-3xl text-center">Join Session</CardTitle>
        <CardDescription className="text-center text-lg">Enter the room code on the projector</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleJoin} className="flex flex-col gap-6">
          <div>
            <label className="font-bold mb-2 block">Room Code</label>
            <Input 
              placeholder="e.g. A1B2" 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="text-center text-2xl uppercase tracking-widest font-black"
              maxLength={6}
            />
          </div>
          <div>
            <label className="font-bold mb-2 block">Your Name</label>
            <Input 
              placeholder="Display Name" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="text-xl"
              maxLength={30}
            />
          </div>
          
          {error && <div className="text-brand-pink font-bold text-center">{error}</div>}
          
          <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full mt-4">
            {loading ? 'Joining...' : 'Join Now'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default function JoinPage() {
  return (
    <div className="min-h-screen bg-brand-yellow p-4 flex flex-col">
      <Suspense fallback={<div className="font-bold text-center mt-20">Loading...</div>}>
        <JoinForm />
      </Suspense>
    </div>
  );
}
