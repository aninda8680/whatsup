"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, collection, getDocs, setDoc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Session, Slide } from '@/hooks/useSession';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';

export default function SessionBuildPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSessionData = async () => {
      try {
        const sessionDoc = await getDoc(doc(db, 'sessions', sessionId));
        if (sessionDoc.exists()) {
          setSession({ id: sessionDoc.id, ...sessionDoc.data() } as Session);
        }

        const slidesSnap = await getDocs(collection(db, 'sessions', sessionId, 'slides'));
        let slidesData = slidesSnap.docs.map(d => ({ id: d.id, ...d.data() } as Slide));
        slidesData.sort((a, b) => a.order - b.order);
        setSlides(slidesData);
      } catch (err) {
        console.error("Failed to load session", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSessionData();
  }, [sessionId]);

  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide_${Date.now()}`,
      order: slides.length,
      type: 'mcq_single',
      prompt: 'New Question',
      options: [
        { id: 'opt_1', label: 'Option 1' },
        { id: 'opt_2', label: 'Option 2' }
      ],
      resultsVisibleToStudents: true,
    };
    setSlides([...slides, newSlide]);
  };

  const handleUpdateSlide = (index: number, updatedSlide: Slide) => {
    const newSlides = [...slides];
    newSlides[index] = updatedSlide;
    setSlides(newSlides);
  };

  const handleRemoveSlide = (index: number) => {
    const newSlides = [...slides];
    newSlides.splice(index, 1);
    // Reorder
    newSlides.forEach((s, i) => s.order = i);
    setSlides(newSlides);
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      // 1. Update session title
      await updateDoc(doc(db, 'sessions', sessionId), {
        title: session.title
      });

      // 2. We should ideally do a batch write, but for MVP doing sequentially
      // Fetch existing slides to delete removed ones (skipping full diff logic for simplicity, just overwrite/add)
      for (const slide of slides) {
        await setDoc(doc(db, 'sessions', sessionId, 'slides', slide.id), slide);
      }
      
      alert('Saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!session) return <div className="p-8">Session not found.</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto flex flex-col gap-6">
        <div className="flex justify-between items-center bg-white p-6 border-[4px] border-black shadow-brutal">
          <div className="flex items-center gap-4 w-1/2">
            <Link href="/admin/dashboard">
              <Button variant="default">Back</Button>
            </Link>
            <Input 
              value={session.title} 
              onChange={(e) => setSession({ ...session, title: e.target.value })} 
              className="text-2xl font-black w-full"
            />
          </div>
          <div className="flex gap-4">
            <Link href={`/admin/session/${sessionId}/control`}>
              <Button variant="secondary" size="lg">Go to Control Panel</Button>
            </Link>
            <Button onClick={handleSave} variant="primary" disabled={saving} size="lg">
              {saving ? 'Saving...' : 'Save All'}
            </Button>
          </div>
        </div>

        <div className="bg-brand-yellow p-12 border-[4px] border-black shadow-brutal flex flex-col md:flex-row justify-around items-center gap-12 min-h-[85vh]">
          <div className="flex flex-col gap-6 text-center md:text-left">
            <h2 className="text-5xl font-black mb-4">Waiting for players?</h2>
            <div>
              <p className="text-3xl font-bold mb-4">Join with code:</p>
              <div className="bg-white px-10 py-6 border-[6px] border-black tracking-widest text-7xl font-black inline-block shadow-brutal">
                {session.code}
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-800 mt-6">or scan the QR code to join directly</p>
          </div>
          <div className="bg-white p-8 border-[8px] border-black shadow-brutal transform rotate-3">
            <QRCodeSVG value={typeof window !== 'undefined' ? `${window.location.origin}/join?code=${session.code}` : ''} size={400} />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {slides.map((slide, i) => (
            <div key={slide.id} className="bg-white p-6 border-[3px] border-black shadow-brutal flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <span className="font-bold text-xl bg-brand-pink px-2 py-1 border-2 border-black">Slide {i + 1}</span>
                <Button variant="danger" size="sm" onClick={() => handleRemoveSlide(i)}>Remove</Button>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-bold">Prompt</label>
                <Input 
                  value={slide.prompt} 
                  onChange={(e) => handleUpdateSlide(i, { ...slide, prompt: e.target.value })} 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-bold">Type</label>
                <select 
                  className="border-[3px] border-black p-2 font-bold focus:outline-none"
                  value={slide.type}
                  onChange={(e) => handleUpdateSlide(i, { ...slide, type: e.target.value as Slide['type'] })}
                >
                  <option value="mcq_single">Single Choice (MCQ)</option>
                  <option value="mcq_multi">Multi Choice</option>
                  <option value="wordcloud">Word Cloud</option>
                  <option value="rating">Rating (1-5)</option>
                  <option value="info">Info (No Input)</option>
                </select>
              </div>

              {(slide.type === 'mcq_single' || slide.type === 'mcq_multi') && (
                <div className="flex flex-col gap-2 mt-4 pl-4 border-l-4 border-gray-200">
                  <label className="font-bold">Options</label>
                  {slide.options?.map((opt, optIndex) => (
                    <div key={opt.id} className="flex gap-2">
                      <Input 
                        value={opt.label} 
                        onChange={(e) => {
                          const newOpts = [...(slide.options || [])];
                          newOpts[optIndex].label = e.target.value;
                          handleUpdateSlide(i, { ...slide, options: newOpts });
                        }} 
                      />
                      <Button variant="default" onClick={() => {
                        const newOpts = [...(slide.options || [])];
                        newOpts.splice(optIndex, 1);
                        handleUpdateSlide(i, { ...slide, options: newOpts });
                      }}>X</Button>
                    </div>
                  ))}
                  <Button variant="secondary" className="w-max mt-2" onClick={() => {
                    const newOpts = [...(slide.options || [])];
                    newOpts.push({ id: `opt_${Date.now()}`, label: 'New Option' });
                    handleUpdateSlide(i, { ...slide, options: newOpts });
                  }}>+ Add Option</Button>
                </div>
              )}
            </div>
          ))}

          <Button onClick={handleAddSlide} variant="default" size="lg" className="w-full border-dashed border-gray-400 text-gray-500 bg-transparent hover:bg-gray-100 hover:text-black hover:border-black mt-4">
            + Add Slide
          </Button>
        </div>
      </div>
    </div>
  );
}
