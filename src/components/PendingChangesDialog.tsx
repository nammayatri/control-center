import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Save, X, MapPin, Trash2, Square, CheckSquare } from 'lucide-react';
import type { SpecialLocationFull } from '../types/specialLocation';

export interface PendingChangesDialogProps {
  isOpen: boolean;
  pendingChanges: Map<string, SpecialLocationFull>;
  pendingEnabled: Map<string, boolean>;
  existingLocationIds: Set<string>; // IDs of locations from API
  onClose: () => void;
  onConfirm: (selectedIds: string[]) => void;
  onDiscardAll: () => void;
}

export function PendingChangesDialog({
  isOpen,
  pendingChanges,
  pendingEnabled,
  existingLocationIds,
  onClose,
  onConfirm,
  onDiscardAll,
}: Readonly<PendingChangesDialogProps>) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() =>
    new Set(pendingChanges.keys())
  );

  // Reset selection when dialog opens
  const handleOpenChange = (open: boolean) => {
    if (open) {
      setSelectedIds(new Set(pendingChanges.keys()));
    } else {
      onClose();
    }
  };

  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const selectAll = () => {
    setSelectedIds(new Set(pendingChanges.keys()));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
  };

  const changes = Array.from(pendingChanges.entries());

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Save className="h-5 w-5" />
            Review Changes ({pendingChanges.size})
          </DialogTitle>
          <DialogDescription>
            Select which changes to save. Unselected changes will remain as pending.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b">
          <span className="text-sm text-muted-foreground">
            {selectedIds.size} of {pendingChanges.size} selected
          </span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="ghost" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
          </div>
        </div>

        <ScrollArea className="max-h-[300px] pr-4">
          <div className="space-y-2">
            {changes.map(([id, location]) => {
              const isNew = !existingLocationIds.has(id);
              const isEnabled = pendingEnabled.get(id) ?? true;
              const isSelected = selectedIds.has(id);

              return (
                <div
                  key={id}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${isSelected ? 'bg-primary/5 border-primary/30' : 'bg-muted/30 hover:bg-muted/50'
                    }`}
                  onClick={() => toggleSelection(id)}
                >
                  {isSelected ? (
                    <CheckSquare className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">
                        {location.locationName || 'Unnamed Location'}
                      </span>
                      {isNew && (
                        <Badge variant="secondary" className="text-xs">
                          New
                        </Badge>
                      )}
                      {!isEnabled && (
                        <Badge variant="destructive" className="text-xs">
                          Disabled
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <span>{location.category}</span>
                      <span>•</span>
                      <span>{location.locationType}</span>
                      {location.gatesInfo.length > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {location.gatesInfo.length} gates
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onDiscardAll}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Discard All
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={selectedIds.size === 0}
          >
            <Save className="h-4 w-4 mr-2" />
            Save Selected ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
