import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { MusicGenre } from '@/lib/types';

interface AudioContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  genre: MusicGenre;
  onGenreChange: (genre: MusicGenre) => void;
}

export default function AudioContentModal({
  open,
  onOpenChange,
  genre,
  onGenreChange,
}: AudioContentModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Audio Content</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="genre">Music Genre</Label>
            <Select value={genre} onValueChange={(v: MusicGenre) => onGenreChange(v)}>
              <SelectTrigger id="genre" data-testid="select-content-genre">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bass_dubstep">Bass/Dubstep</SelectItem>
                <SelectItem value="rock">Rock</SelectItem>
                <SelectItem value="acoustic">Acoustic</SelectItem>
                <SelectItem value="custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
