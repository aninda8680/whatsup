"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to login');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-pink flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-brutal-lg border-[4px]">
        <CardHeader className="bg-black text-white p-6 border-b-[4px] border-black">
          <CardTitle className="text-3xl font-black">Admin Login</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleLogin} className="flex flex-col gap-6">
            <div>
              <label className="font-bold mb-2 block">Email</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="font-bold"
              />
            </div>
            <div>
              <label className="font-bold mb-2 block">Password</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="font-bold"
              />
            </div>
            {error && <div className="text-red-500 font-bold bg-red-100 p-2 border-2 border-red-500">{error}</div>}
            
            <Button type="submit" variant="primary" size="lg" disabled={loading} className="w-full mt-4 text-xl">
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
