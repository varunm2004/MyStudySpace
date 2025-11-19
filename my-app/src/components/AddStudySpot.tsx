'use client';

import React, { useEffect, useRef, useState, ChangeEvent, FormEvent, KeyboardEvent } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

// Define the shape of our state
interface StudySpotState {
  name: string;
  description: string;
  address: string;
  tags: string[];
  coordinates: { lat: number; lng: number };
  image: string;
}

const AddStudySpot = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Explicitly tell TypeScript what this state looks like
  const [studySpot, setStudySpot] = useState<StudySpotState>({
    name: '',
    description: '',
    address: '',
    tags: [],
    coordinates: { lat: 0, lng: 0 },
    image: '',
  });

  // Type the change event (works for input and textarea)
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setStudySpot((prev) => ({ ...prev, [name]: value }));
  };

  // Type the tag argument
  const handleTagToggle = (tag: string) => {
    setStudySpot((prev) => {
      const currentTags = [...prev.tags];
      if (currentTags.includes(tag)) {
        return { ...prev, tags: currentTags.filter((t) => t !== tag) };
      } else {
        return { ...prev, tags: [...currentTags, tag] };
      }
    });
  };

  // Type the form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const email = localStorage.getItem('userEmail') || '';
      const response = await fetch('/api/spots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-email': email,
        },
        body: JSON.stringify(studySpot),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add study spot');
      }

      const result = await response.json();
      setSuccess('Study spot added successfully!');
      setStudySpot({ name: '', description: '', address: '', tags: [], coordinates: { lat: 0, lng: 0 }, image: '' });
    } catch (err: any) {
      // 'any' allows us to access .message safely here
      setError(err.message || 'Failed to add study spot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTags = ['outdoors', 'indoors', 'free', 'wifi', 'quiet', 'outlets'];

  const placesLibrary = useMapsLibrary('places');
  
  // Explicitly type the ref as an HTML Div
  const autocompleteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!placesLibrary || !autocompleteRef.current) return;

    // Use 'any' here to bypass the specific PlacesLibrary type definition issue
    const autocompleteElement = new (placesLibrary as any).PlaceAutocompleteElement();
    autocompleteElement.placeholder = 'Enter address';
    autocompleteRef.current.appendChild(autocompleteElement);

    // Define the custom event type
    autocompleteElement.addEventListener('gmp-select', async (event: any) => {
      const { placePrediction } = event;
      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'photos'] });

      const photo = place.photos?.[0];
      let photoUrl = '/images/defaultSpotImg.png';

      try {
        if (photo) {
          photoUrl = photo.getURI({ maxWidth: 400 });
        }
      } catch (error) {
        console.error('Failed to get photo URI:', error);
      }

      const result = place.toJSON();

      setStudySpot((prev) => ({
        ...prev,
        address: result.formattedAddress || '',
        coordinates: { lat: result.location.lat, lng: result.location.lng },
        image: photoUrl,
      }));
    });

    return () => {
      if (autocompleteRef.current && autocompleteElement.parentNode === autocompleteRef.current) {
        autocompleteRef.current.removeChild(autocompleteElement);
      }
    };
  }, [placesLibrary]);

  // Type the keyboard event
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && (e.target as HTMLElement).tagName !== 'TEXTAREA') e.preventDefault();
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      <div className="relative z-10">
        <div className="flex justify-center items-center min-h-[calc(100vh-64px)] p-4">
          {error && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white p-3 rounded-md max-w-md w-full">
              {error}
            </div>
          )}
          {success && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white p-3 rounded-md max-w-md w-full">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="w-full max-w-md bg-[#0f172a] bg-opacity-90 text-white rounded-2xl p-8 shadow-lg">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Name</label>
                <input type="text" name="name" placeholder="Name of location" value={studySpot.name} onChange={handleChange} className="w-full p-2 rounded bg-[#1e293b] text-white placeholder-gray-400" required />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea name="description" placeholder="Description of location" value={studySpot.description} onChange={handleChange} className="w-full p-2 rounded bg-[#1e293b] text-white placeholder-gray-400" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Address</label>
                {placesLibrary ? <div ref={autocompleteRef} className="w-full"></div> : <input type="text" name="address" placeholder="Loading..." disabled className="w-full p-2 rounded bg-[#1e293b] text-white placeholder-gray-400" />}
                {studySpot.image && (
                  <div className="mt-4">
                    <img
                      src={studySpot.image}
                      alt="Preview"
                      className="w-full h-auto rounded-lg shadow"
                      onError={(e) => {
                        e.currentTarget.src = '/images/defaultSpotImg.png';
                      }}
                    />
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2">Tags</label>
                <div className="flex gap-2 flex-wrap">
                  {availableTags.map((tag) => (
                    <button key={tag} type="button" onClick={() => handleTagToggle(tag)} className={`px-4 py-1 rounded text-sm font-medium transition ${studySpot.tags.includes(tag) ? 'bg-blue-600' : 'bg-[#1e293b]'}`}>{tag.charAt(0).toUpperCase() + tag.slice(1)}</button>
                  ))}
                </div>
              </div>
              <div className="pt-4 flex justify-center">
                <button type="submit" disabled={isSubmitting} className={`px-6 py-2 bg-[#334155] hover:bg-[#475569] rounded font-semibold ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}>{isSubmitting ? 'Submitting...' : 'Submit'}</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};

export default AddStudySpot;