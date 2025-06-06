import useProfile from '@/hooks/useProfile';
import { usePlaylists } from '@/hooks/usePlaylists';
import { PlaylistCard } from '../music/PlaylistCard';

const PlaylistsTab = () => {
  const { profile } = useProfile();
  const userId = profile?.id;
  const { playlists, loading, error } = usePlaylists(userId || '');

  if (!userId) return <div className="p-4">Please log in to view playlists.</div>;
  if (loading) return <div className="p-4 animate-pulse">Loading playlists...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;
  if (!playlists.length) return <div className="p-4">No playlists found.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
      {playlists.map((playlist) => {
        // Map DB fields to PlaylistCard props with fallbacks
        const mappedPlaylist = {
          id: playlist.id,
          title: playlist.name || playlist.title || 'Untitled Playlist',
          trackCount: Array.isArray(playlist.track_ids) ? playlist.track_ids.length : (playlist.trackCount || 0),
          duration: playlist.duration || '—',
          artworkUrl: playlist.cover_art_url || '/default-playlist.jpg',
        };
        return <PlaylistCard key={playlist.id} playlist={mappedPlaylist} />;
      })}
    </div>
  );
};

export default PlaylistsTab;
