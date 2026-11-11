import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { SeriesStudio } from './components/SeriesStudio';
import { QuickTTSStudio } from './components/QuickTTSStudio';
import { SeriesLibrary } from './components/SeriesLibrary';
import { LanguageHub } from './components/LanguageHub';
import { AudioPlayerBar, PlayerTrack } from './components/AudioPlayerBar';
import { FreeTransparencyModal } from './components/FreeTransparencyModal';
import { AudioSeries } from './types/audio';
import { FEATURED_SERIES_TEMPLATES } from './data/seriesTemplates';

const LOCAL_STORAGE_KEY = 'voxinfinite_user_series_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<'series' | 'quick-tts' | 'library' | 'languages'>('series');
  const [activeTrack, setActiveTrack] = useState<PlayerTrack | null>(null);
  const [isFreeModalOpen, setIsFreeModalOpen] = useState(false);

  // Initialize user series list from local storage or default templates
  const [userSeriesList, setUserSeriesList] = useState<AudioSeries[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load user series from localStorage:', e);
    }
    return FEATURED_SERIES_TEMPLATES;
  });

  // Current active series in the Studio
  const [currentSeries, setCurrentSeries] = useState<AudioSeries>(() => {
    return userSeriesList[0] || FEATURED_SERIES_TEMPLATES[0];
  });

  // Persist series changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(userSeriesList));
    } catch (e) {
      console.warn('Failed to save user series to localStorage:', e);
    }
  }, [userSeriesList]);

  // Handler when user updates active series
  const handleUpdateSeries = (updated: AudioSeries) => {
    setCurrentSeries(updated);
    setUserSeriesList((prev) => {
      const existingIdx = prev.findIndex((s) => s.id === updated.id);
      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx] = updated;
        return next;
      }
      return [updated, ...prev];
    });
  };

  // Handler to select a series to edit in the studio
  const handleSelectSeries = (series: AudioSeries) => {
    setCurrentSeries(series);
    setActiveTab('series');
  };

  // Handler to delete a series
  const handleDeleteSeries = (seriesId: string) => {
    setUserSeriesList((prev) => {
      const filtered = prev.filter((s) => s.id !== seriesId);
      if (currentSeries.id === seriesId && filtered.length > 0) {
        setCurrentSeries(filtered[0]);
      }
      return filtered;
    });
  };

  // Handler to start a brand new audio series
  const handleNewSeries = () => {
    const newSeries: AudioSeries = {
      id: `series-${Date.now()}`,
      title: 'Untitled Audio Series',
      description: 'A new audio production created with VoxInfinite free studio.',
      genre: 'Podcast & Audio Drama',
      language: 'English (US)',
      format: 'dialogue',
      coverGradient: 'from-violet-600 via-purple-700 to-indigo-900',
      tags: ['Original', 'New Series', 'Free Studio'],
      createdAt: new Date().toISOString(),
      speaker1: {
        name: 'Host Alex',
        role: 'Lead Host',
        voice: 'Puck',
        style: 'Enthusiastic and engaging host',
      },
      speaker2: {
        name: 'Expert Sam',
        role: 'Co-Host / Guest',
        voice: 'Kore',
        style: 'Articulate and conversational analyst',
      },
      episodes: [
        {
          id: `ep-${Date.now()}-1`,
          episodeNumber: 1,
          title: 'Episode 1: The Beginning',
          synopsis: 'The premiere episode introduces our journey and foundational concepts.',
          scriptFormat: 'dialogue',
          dialogueLines: [
            {
              id: 'l1',
              speaker: 'Host Alex',
              text: 'Welcome everyone to the premiere of our new audio series! <breath> We have zero credit limits and unlimited freedom to tell any story.',
              styleCue: 'cheerful and welcoming',
            },
            {
              id: 'l2',
              speaker: 'Expert Sam',
              text: '|Yeah|, welcome aboard! In today’s episode, we are kicking things off with a fascinating exploration.',
              styleCue: 'confident and warm',
            },
          ],
        },
      ],
    };

    setUserSeriesList((prev) => [newSeries, ...prev]);
    setCurrentSeries(newSeries);
    setActiveTab('series');
  };

  // Apply a language from the language hub to the current series
  const handleApplyLanguageToSeries = (langName: string) => {
    handleUpdateSeries({
      ...currentSeries,
      language: langName,
    });
    setActiveTab('series');
  };

  // Handle auto-advance track when an episode finishes playing
  const handleTrackEnded = () => {
    // If the currently playing track belongs to the active series, see if there is a next episode with audio
    if (activeTrack) {
      const currentEpIndex = currentSeries.episodes.findIndex((e) => e.id === activeTrack.id);
      if (currentEpIndex >= 0 && currentEpIndex < currentSeries.episodes.length - 1) {
        const nextEp = currentSeries.episodes[currentEpIndex + 1];
        if (nextEp.audioBase64 || nextEp.audioUrl) {
          setActiveTrack({
            id: nextEp.id,
            title: `${currentSeries.title}: ${nextEp.title}`,
            subtitle: `${currentSeries.language} · Episode ${nextEp.episodeNumber}`,
            audioBase64: nextEp.audioBase64,
            audioUrl: nextEp.audioUrl,
            mimeType: nextEp.mimeType || 'audio/wav',
          });
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-violet-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewSeries={handleNewSeries}
        onOpenFreeModal={() => setIsFreeModalOpen(true)}
      />

      {/* Main Tab Views */}
      <main className="flex-1 pb-28">
        {activeTab === 'series' && (
          <SeriesStudio
            currentSeries={currentSeries}
            onUpdateSeries={handleUpdateSeries}
            onPlayTrack={(track) => setActiveTrack(track)}
          />
        )}

        {activeTab === 'quick-tts' && (
          <QuickTTSStudio onPlayTrack={(track) => setActiveTrack(track)} />
        )}

        {activeTab === 'library' && (
          <SeriesLibrary
            userSeriesList={userSeriesList}
            onSelectSeries={handleSelectSeries}
            onDeleteSeries={handleDeleteSeries}
            onPlayTrack={(track) => setActiveTrack(track)}
            onNewSeries={handleNewSeries}
          />
        )}

        {activeTab === 'languages' && (
          <LanguageHub
            onPlayTrack={(track) => setActiveTrack(track)}
            onApplyLanguageToSeries={handleApplyLanguageToSeries}
          />
        )}
      </main>

      {/* Persistent Audio Player Bar */}
      <AudioPlayerBar
        track={activeTrack}
        onClose={() => setActiveTrack(null)}
        onEnded={handleTrackEnded}
      />

      {/* Transparency & Zero-Credit Explainer Modal */}
      <FreeTransparencyModal
        isOpen={isFreeModalOpen}
        onClose={() => setIsFreeModalOpen(false)}
      />
    </div>
  );
}
