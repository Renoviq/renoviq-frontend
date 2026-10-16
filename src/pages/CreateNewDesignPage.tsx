import React, { useState } from 'react';
import { Link } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import Header from './_homepageComponents/Header';
import { ImageUpload } from '@/components/image-upload';
import { RoomType } from '@/components/RoomType';
import { DesignType } from '@/components/DesignType';
import { AdditionalReq } from '@/components/AdditionalReq';
import { MAX_DESIGNS_PER_HOUR } from '@shared/schema';
import type { Renovation } from '@shared/schema';

type Stage = 'idle' | 'designing';

// The API answers { error: "message" }; validation failures send a list instead.
async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    if (typeof body.error === 'string') return body.error;
    if (Array.isArray(body.error)) return 'Please check the form and try again.';
  } catch {
    // not JSON, fall through
  }
  return res.status === 401
    ? 'Please sign in again.'
    : 'Something went wrong. Please try again.';
}

function CreateNewDesignPage() {
  const queryClient = useQueryClient();
  const [selectedRoom, setSelectedRoom] = useState('Kitchen');
  const [selectedDesign, setSelectedDesign] = useState('modern');
  const [additionalReq, setAdditionalReq] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [stage, setStage] = useState<Stage>('idle');
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Renovation | null>(null);
  // Changing the key empties the upload box when the user starts another design.
  const [formKey, setFormKey] = useState(0);

  const busy = stage !== 'idle';

  const handleGenerate = async () => {
    if (!selectedFile) {
      setError('Please select a photo of your room first.');
      return;
    }
    setError(null);
    setStage('designing');
    try {
      // The photo goes to the server with the form fields; the server asks the AI for the
      // redesign, keeps both pictures and answers when the design is ready.
      const form = new FormData();
      form.set('photo', selectedFile);
      form.set('roomType', selectedRoom);
      form.set('style', selectedDesign);
      form.set('description', additionalReq);
      const res = await fetch('/api/renovations', {
        method: 'POST',
        credentials: 'include',
        body: form,
      });
      if (!res.ok) throw new Error(await readError(res));

      setResult(await res.json());
      queryClient.invalidateQueries({ queryKey: ['/api/renovations'] });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'An error occurred. Please try again.');
    } finally {
      setStage('idle');
    }
  };

  const startAnother = () => {
    setResult(null);
    setSelectedFile(null);
    setAdditionalReq('');
    setError(null);
    setFormKey((k) => k + 1);
  };

  return (
    <div>
      <Header />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-6 text-green-600">
          Experience the Magic of AI Remodeling
        </h1>
        <p className="text-center mb-12 text-gray-700">
          Transform any room with a click. Select a space, choose a style, and watch as AI instantly reimagines your environment.
        </p>

        {result ? (
          <section aria-labelledby="result-heading" className="space-y-6">
            <h2 id="result-heading" className="text-2xl font-semibold text-center text-gray-800">
              Your new {result.roomType.toLowerCase()} design
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <figure>
                <img
                  src={result.originalImage}
                  alt="Your original room"
                  className="w-full rounded-md border border-gray-300 object-contain bg-gray-50"
                />
                <figcaption className="mt-2 text-center text-sm font-medium text-gray-600">Before</figcaption>
              </figure>
              <figure>
                <img
                  src={result.generatedImage}
                  alt="The redesigned room"
                  className="w-full rounded-md border border-green-600 object-contain bg-gray-50"
                />
                <figcaption className="mt-2 text-center text-sm font-medium text-green-700">After</figcaption>
              </figure>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={result.generatedImage}
                target="_blank"
                rel="noreferrer"
                className="text-center border border-green-600 text-green-700 px-6 py-3 rounded-md font-semibold hover:bg-green-50 transition"
              >
                Open full size
              </a>
              <Link
                href="/studio"
                className="text-center border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-semibold hover:bg-gray-50 transition"
              >
                View my gallery
              </Link>
              <button
                onClick={startAnother}
                className="bg-green-600 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-700 transition"
              >
                Create another design
              </button>
            </div>
          </section>
        ) : (
          <div className="flex flex-col md:flex-row gap-8">
            {/* Left: Image Upload */}
            <div className="md:w-1/2">
              <label className="block mb-2 font-semibold text-gray-700">
                Select Image of your room
              </label>
              <div className="border border-gray-300 rounded-md p-4 min-h-[300px] flex items-center justify-center bg-gray-50">
                <ImageUpload key={formKey} onFileSelect={setSelectedFile} />
              </div>
            </div>

            {/* Right: Form Controls */}
            <div className="md:w-1/2 space-y-6">
              <RoomType selectedRoom={selectedRoom} onChange={setSelectedRoom} />
              <DesignType selectedDesign={selectedDesign} onSelect={setSelectedDesign} />
              <AdditionalReq value={additionalReq} onChange={setAdditionalReq} />
              <button
                onClick={handleGenerate}
                disabled={busy}
                className="w-full bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
                {stage === 'designing' && 'Designing your room...'}
                {stage === 'idle' && 'Generate'}
              </button>
              <div aria-live="polite" className="min-h-[1.5rem] text-center text-sm">
                {stage === 'designing' && (
                  <p className="text-gray-600">The AI is redesigning your room. This usually takes under a minute, please keep this page open.</p>
                )}
                {error && (
                  <p role="alert" className="text-red-600">
                    {error}
                  </p>
                )}
              </div>
              <p className="text-center text-sm text-gray-500">
                You can create up to {MAX_DESIGNS_PER_HOUR} designs per hour. Use a JPG or PNG photo up to 5 MB.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default CreateNewDesignPage;
