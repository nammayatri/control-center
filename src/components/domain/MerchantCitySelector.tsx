import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Building2, MapPin, Loader2 } from 'lucide-react';

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

  const handleMerchantChange = (merchantId: string) => {
    setSelectedMerchantId(merchantId);
    // Reset city when merchant changes - user needs to select a new city
    setSelectedCityId('');
  };

  const handleCityChange = async (cityId: string) => {
    setSelectedCityId(cityId);

    // Auto-switch context when city is selected
    if (selectedMerchantId && cityId) {
      setIsSwitching(true);
      try {
        await switchContext(selectedMerchantId, cityId);
      } catch (error) {
        console.error('Failed to switch context:', error);
        // Reset to current values on error
        if (currentMerchant) setSelectedMerchantId(currentMerchant.shortId || currentMerchant.id);
        if (currentCity) setSelectedCityId(currentCity.id);
      } finally {
        setIsSwitching(false);
      }
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
    <div className="flex items-center gap-1 md:gap-2">
      {/* Merchant Selector */}
      <div className="flex items-center gap-1">
        <Building2 className="h-4 w-4 text-muted-foreground hidden sm:block" />
        <Select
          value={selectedMerchantId}
          onValueChange={handleMerchantChange}
          disabled={isSwitching}
        >
          <SelectTrigger className="w-[100px] md:w-[160px] h-8 text-xs md:text-sm">
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
          <SelectTrigger className="w-[80px] md:w-[130px] h-8 text-xs md:text-sm">
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

      {/* Loading indicator when switching */}
      {isSwitching && (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      )}
    </div>
  );
}
