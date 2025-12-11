import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Building2, MapPin, Loader2, RefreshCw } from 'lucide-react';

export function MerchantCitySelector() {
  const { 
    merchants, 
    currentMerchant, 
    currentCity,
    switchContext,
    getCitiesForMerchant,
  } = useAuth();
  
  // Local state to track selected values before switching
  const [selectedMerchantId, setSelectedMerchantId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [isSwitching, setIsSwitching] = useState(false);

  // Get available cities for the selected merchant
  const availableCities = useMemo(() => {
    if (!selectedMerchantId) return [];
    return getCitiesForMerchant(selectedMerchantId);
  }, [selectedMerchantId, getCitiesForMerchant]);

  // Sync local state with current values when they change
  useEffect(() => {
    if (currentMerchant) {
      setSelectedMerchantId(currentMerchant.shortId || currentMerchant.id);
    }
  }, [currentMerchant]);

  useEffect(() => {
    if (currentCity) {
      setSelectedCityId(currentCity.id);
    }
  }, [currentCity]);

  // Check if selection has changed from current context
  const hasChanges = (
    (selectedMerchantId && selectedMerchantId !== (currentMerchant?.shortId || currentMerchant?.id)) ||
    (selectedCityId && selectedCityId !== currentCity?.id)
  );

  const handleMerchantChange = (merchantId: string) => {
    setSelectedMerchantId(merchantId);
    // Reset city when merchant changes - user needs to select a new city
    setSelectedCityId('');
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
  };

  const handleSwitch = async () => {
    if (!selectedMerchantId || !selectedCityId) {
      console.warn('Please select both merchant and city');
      return;
    }
    
    setIsSwitching(true);
    try {
      await switchContext(selectedMerchantId, selectedCityId);
    } catch (error) {
      console.error('Failed to switch context:', error);
      // Reset to current values on error
      if (currentMerchant) setSelectedMerchantId(currentMerchant.shortId || currentMerchant.id);
      if (currentCity) setSelectedCityId(currentCity.id);
    } finally {
      setIsSwitching(false);
    }
  };

  // If no merchants available, show empty state
  if (merchants.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span>No merchants available</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Merchant Selector */}
      <div className="flex items-center gap-1">
        <Building2 className="h-4 w-4 text-muted-foreground hidden sm:block" />
        <Select
          value={selectedMerchantId}
          onValueChange={handleMerchantChange}
          disabled={isSwitching}
        >
          <SelectTrigger className="w-[160px] h-8 text-sm">
            <SelectValue placeholder="Select Merchant">
              {merchants.find(m => m.shortId === selectedMerchantId || m.id === selectedMerchantId)?.name || 'Select Merchant'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {merchants.map((merchant) => (
              <SelectItem key={merchant.shortId || merchant.id} value={merchant.shortId || merchant.id}>
                {merchant.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* City Selector */}
      <div className="flex items-center gap-1">
        <MapPin className="h-4 w-4 text-muted-foreground hidden sm:block" />
        <Select
          value={selectedCityId}
          onValueChange={handleCityChange}
          disabled={isSwitching || availableCities.length === 0}
        >
          <SelectTrigger className="w-[130px] h-8 text-sm">
            <SelectValue placeholder="Select City">
              {availableCities.find(c => c.id === selectedCityId)?.name || 'Select City'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {availableCities.map((city) => (
              <SelectItem key={city.id} value={city.id}>
                {city.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Switch Button - Only show when there are changes */}
      <Button
        size="sm"
        variant={hasChanges ? "default" : "outline"}
        onClick={handleSwitch}
        disabled={isSwitching || !selectedMerchantId || !selectedCityId}
        className="h-8"
      >
        {isSwitching ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Switching...
          </>
        ) : (
          <>
            <RefreshCw className="h-3 w-3 mr-1" />
            Switch
          </>
        )}
      </Button>
    </div>
  );
}
