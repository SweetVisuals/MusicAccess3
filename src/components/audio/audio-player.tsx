import { Button } from "@/components/@/ui/button"
import { Play, Pause, Volume2, Heart, SkipBack, SkipForward } from 'lucide-react'
import { useAudioPlayer } from '@/contexts/audio-player-context'

export function AudioPlayer() {
  const { currentTrack, isPlaying, togglePlay } = useAudioPlayer()

  return (
    <div className={`fixed bottom-0 left-0 md:left-[var(--sidebar-width)] right-0 bg-background/95 backdrop-blur-sm border-t z-[50] transition-all duration-200 ease-in-out shadow-lg transform translate-z-0 ${!currentTrack ? 'translate-y-full' : 'translate-y-0'}`}>
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-center gap-4">
          {/* Track Info */}
          {currentTrack && (
            <div className="flex items-center gap-3 min-w-0 w-[200px]">
              {currentTrack.artworkUrl && (
                <div className="w-10 h-10 rounded-md bg-muted overflow-hidden">
                  <img 
                    src={currentTrack.artworkUrl} 
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{currentTrack.title}</p>
                {currentTrack.projectTitle && (
                  <p className="text-xs text-muted-foreground truncate">
                    {currentTrack.projectTitle}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Playback Controls */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button 
              variant="default" 
              size="icon" 
              className="h-10 w-10 rounded-full"
              onClick={togglePlay}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          {/* Progress & Volume */}
          <div className="hidden md:flex items-center gap-4 w-[200px] max-w-md">
            <div className="flex-1">
              <div className="h-1 bg-muted rounded-full">
                <div className="h-full bg-primary rounded-full w-1/3" />
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Volume2 className="h-4 w-4" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 w-[80px]">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Heart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
