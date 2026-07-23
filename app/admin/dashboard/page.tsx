"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Session } from '@/hooks/useSession';
import Link from 'next/link';
import { cseecemeQuestions, cseStudentsQuestions } from '@/lib/question-banks';

function generateShortCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push('/admin/login');
        return;
      }

      // Fetch only this admin's sessions (not everyone's)
      const q = query(
        collection(db, 'sessions'),
        where('ownerUid', '==', user.uid)
      );
      try {
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Session));
        // Sort by createdAt descending locally
        data.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setSessions(data);
      } catch (err) {
        console.error("Error fetching sessions", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleCreateSession = async (bankId: 'blank' | 'cseeceme' | 'csestudents') => {
    const user = auth.currentUser;
    if (!user) return;
    
    setCreating(true);
    setShowBankModal(false);
    try {
      const code = generateShortCode(); // In a real app, retry if collision
      
      let title = `New Session ${new Date().toLocaleDateString()}`;
      if (bankId === 'cseeceme') title = `Freshers Orientation Quiz 🎉`;
      if (bankId === 'csestudents') title = `CSE Students Quiz 🎉`;
      
      const newSession = {
        code,
        title,
        ownerUid: user.uid,
        status: 'draft',
        currentSlideIndex: 0,
        createdAt: serverTimestamp(),
        settings: {
          anonymousByDefault: true,
          allowResubmit: false
        }
      };

      const docRef = await addDoc(collection(db, 'sessions'), newSession);

      if (bankId === 'cseeceme' || bankId === 'csestudents') {
        const questions = bankId === 'csestudents' ? cseStudentsQuestions : cseecemeQuestions;
        for (let i = 0; i < questions.length; i++) {
          const slide = questions[i];
          const newSlide = {
            ...slide,
            id: `slide_${i}`,
            order: i
          };
          await setDoc(doc(db, 'sessions', docRef.id, 'slides', newSlide.id), newSlide);
        }
      }

      router.push(`/admin/session/${docRef.id}/build`);
    } catch (err) {
      console.error(err);
      alert('Failed to create session');
      setCreating(false);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;
    try {
      await deleteDoc(doc(db, 'sessions', sessionId));
      setSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (err) {
      console.error(err);
      alert('Failed to delete session');
    }
  };

  if (loading) {
    return <div className="min-h-screen p-8 font-black text-2xl">Loading Dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-8">
        <div className="flex justify-between items-center bg-white p-6 border-[4px] border-black shadow-brutal">
          <h1 className="text-4xl font-black">My Sessions</h1>
          <Button onClick={() => setShowBankModal(true)} variant="primary" disabled={creating} size="lg">
            {creating ? 'Creating...' : '+ New Session'}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sessions.length === 0 ? (
            <div className="col-span-full p-12 text-center border-[4px] border-dashed border-gray-400 bg-gray-100 font-bold text-gray-500">
              No sessions yet. Create one!
            </div>
          ) : (
            sessions.map(session => (
              <Card key={session.id} className="flex flex-col h-full border-[3px]">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold line-clamp-1 pr-2">{session.title}</h2>
                    <div className="flex gap-2 items-center shrink-0">
                      <span className={`px-2 py-1 text-xs font-bold border-2 border-black ${
                        session.status === 'live' ? 'bg-brand-green' : session.status === 'ended' ? 'bg-gray-300' : 'bg-brand-yellow'
                      }`}>
                        {session.status.toUpperCase()}
                      </span>
                      <button onClick={() => handleDeleteSession(session.id)} className="text-red-500 font-black hover:scale-110 transition-transform px-1" title="Delete Session">
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-gray-600 mb-2">Code: {session.code}</div>
                </div>
                <div className="bg-gray-100 p-4 border-t-[3px] border-black flex gap-3">
                  <Link href={`/admin/session/${session.id}/build`} className="flex-1">
                    <Button variant="default" className="w-full">Edit</Button>
                  </Link>
                  <Link href={`/admin/session/${session.id}/control`} className="flex-1">
                    <Button variant={session.status === 'live' ? 'primary' : 'default'} className="w-full">
                      {session.status === 'live' ? 'Control' : 'Start'}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white p-8 border-[4px] border-black shadow-brutal max-w-md w-full">
            <h2 className="text-3xl font-black mb-6">Choose Template</h2>
            <div className="flex flex-col gap-4">
              <Button onClick={() => handleCreateSession('blank')} variant="default" size="lg" className="w-full text-left justify-start py-6">
                📄 Blank Session
              </Button>
              <Button onClick={() => handleCreateSession('cseeceme')} variant="primary" size="lg" className="w-full text-left justify-start py-6">
                🎉 CSE/ECE/ME Orientation Quiz
              </Button>
              <Button onClick={() => handleCreateSession('csestudents')} variant="primary" size="lg" className="w-full text-left justify-start py-6 bg-brand-pink text-black border-[3px] border-black hover:bg-black hover:text-white transition-all shadow-brutal hover:translate-x-1 hover:translate-y-1 hover:shadow-none">
                💻 CSE Students Quiz
              </Button>
            </div>
            <Button onClick={() => setShowBankModal(false)} variant="default" className="w-full mt-6">
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
