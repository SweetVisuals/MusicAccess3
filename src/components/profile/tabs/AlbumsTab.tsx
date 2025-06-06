import useProfile from '@/hooks/useProfile';
import { useAlbums } from '@/hooks/useAlbums';
import { AlbumCard } from '../music/AlbumCard';

const AlbumsTab = () => {
  const { profile } = useProfile();
  const userId = profile?.id;
  const { albums, loading, error } = useAlbums(userId || '');

  if (!userId) return <div className="p-4">Please log in to view albums.</div>;
  if (loading) return <div className="p-4 animate-pulse">Loading albums...</div>;
  if (error) return <div className="p-4 text-destructive">Error: {error}</div>;
  if (!albums.length) return <div className="p-4">No albums found.</div>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-fade-in">
      {albums.map((album) => {
        // Map DB fields to AlbumCard props with fallbacks
        const mappedAlbum = {
          id: album.id,
          title: album.title || 'Untitled Album',
          year: album.release_date ? new Date(album.release_date).getFullYear() : (album.created_at ? new Date(album.created_at).getFullYear() : 2020),
          trackCount: Array.isArray(album.track_ids) ? album.track_ids.length : (album.trackCount || 0),
          artworkUrl: album.cover_art_url || '/default-album.jpg',
        };
        return <AlbumCard key={album.id} album={mappedAlbum} />;
      })}
    </div>
  );
};

export default AlbumsTab;
