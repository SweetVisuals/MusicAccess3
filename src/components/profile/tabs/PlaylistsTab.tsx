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
  
  if (!playlists.length) {
    return (
      <div className="border-2 border-dashed border-muted rounded-lg p-8 text-center">
        <h3 className="text-lg font-medium mb-2">No sound packs found</h3>
        <p className="text-muted-foreground mb-4">
          You haven't created any sound packs yet. Start by creating your first sound pack.
        </p>
        <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2">
          Create Sound Pack
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
      {playlists.map((playlist) => {
        // Map DB fields to PlaylistCard props with fallbacks
        const mappedPlaylist = {
          id: playlist.id,
          title: playlist.name || playlist.title || 'Untitled Playlist',
          trackCount: Array.isArray(playlist.track_ids) ? playlist.track_ids.length : (playlist.trackCount || 0),
          duration: playlist.duration || '—',
          artworkUrl: playlist.cover_art_url || 'https://images.pexels.com/photos/1626481/pexels-photo-1626481.jpeg',
        };
        return <PlaylistCard key={playlist.id} playlist={mappedPlaylist} />;
      })}
    </div>
  );
};

export default PlaylistsTab;