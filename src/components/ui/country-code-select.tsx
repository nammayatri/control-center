import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from './button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './command';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

// Country codes in specified order
const COUNTRY_CODES = [
  { code: '91', country: 'India', flag: '🇮🇳' },
  { code: '358', country: 'Finland', flag: '🇫🇮' },
  { code: '31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '32', country: 'Belgium', flag: '🇧🇪' },
  { code: '33', country: 'France', flag: '🇫🇷' },
  { code: '34', country: 'Spain', flag: '🇪🇸' },
  { code: '351', country: 'Portugal', flag: '🇵🇹' },
  { code: '352', country: 'Luxembourg', flag: '🇱🇺' },
  { code: '39', country: 'Italy', flag: '🇮🇹' },
  { code: '44', country: 'UK', flag: '🇬🇧' },
  { code: '49', country: 'Germany', flag: '🇩🇪' },
];

interface CountryCodeSelectProps {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
  readonly disabled?: boolean;
  readonly className?: string;
}

export function CountryCodeSelect({
  value,
  onValueChange,
  disabled = false,
  className,
}: CountryCodeSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedCountry = COUNTRY_CODES.find((c) => c.code === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn('w-[120px] justify-between', className)}
        >
          <span className="flex items-center gap-1">
            {selectedCountry?.flag} +{value}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search country..." />
          <CommandList>
            <CommandEmpty>No country found.</CommandEmpty>
            <CommandGroup>
              {COUNTRY_CODES.map((countryCode) => (
                <CommandItem
                  key={countryCode.code}
                  value={`${countryCode.country} ${countryCode.code}`}
                  onSelect={() => {
                    onValueChange(countryCode.code);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === countryCode.code ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <span className="flex items-center gap-2">
                    <span>{countryCode.flag}</span>
                    <span>{countryCode.country}</span>
                    <span className="text-muted-foreground">+{countryCode.code}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
