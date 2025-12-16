import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import type { BPPRideListResponse } from '../../services/rides';
import { listBPPRides, listRides } from '../../services/rides';
import type { RideStatusFilter } from '../../types';
import { Calendar } from '../../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
import { cn } from '../../lib/utils';
import { Loader2, Search, RotateCcw, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { Alert, AlertDescription } from '../../components/ui/alert';

export function RidesPage() {
  const { merchantId, cityId, cityName } = useDashboardContext();
  const { loginModule } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize state from URL params for back navigation preservation
  const [shortRideId, setShortRideId] = useState(searchParams.get('shortId') || '');
  const [driverPhone, setDriverPhone] = useState(searchParams.get('driverPhone') || '');
  const [customerPhone, setCustomerPhone] = useState(searchParams.get('customerPhone') || '');
  const [status, setStatus] = useState<RideStatusFilter | ''>(
    (searchParams.get('status') as RideStatusFilter) || ''
  );
  const [date, setDate] = useState<DateRange | undefined>(() => {
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from && to) {
      return { from: new Date(from), to: new Date(to) };
    }
    return undefined;
  });
  
  // Data State
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<BPPRideListResponse['rides']>([]);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(searchParams.has('searched'));

  // Derived state for validation
  const isDateRequired = !!(driverPhone || customerPhone);
  const isSearchEnabled = 
    shortRideId || 
    status || 
    (isDateRequired && date); // If phone is entered, date is mandatory. If no phone, date is not strictly mandatory for other fields? User said "If we are searching with any driver number or phone number, date is mandatory". Implying if ONLY status is selected, date might not be needed? Or maybe "getting list of rides by searching with short ride id OR (any of driver/customer phone AND date)".
    // Let's implement validation logic:
    // If DriverPhone or CustomerPhone is present -> Date is Required.
    // If ShortRideId is present -> Date/others optional.
    // If Status is present -> Date/others optional? User didn't specify strictness for status-only.
    // I will enforce date if phones are used.

  const handleSearch = useCallback(async () => {
    if (!merchantId) {
      setError('Merchant ID is missing');
      return;
    }

    if (isDateRequired && !date) {
      setError('Date is mandatory when searching by phone number');
      return;
    }

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    // Update URL params for back navigation preservation
    const newParams = new URLSearchParams();
    if (shortRideId) newParams.set('shortId', shortRideId);
    if (driverPhone) newParams.set('driverPhone', driverPhone);
    if (customerPhone) newParams.set('customerPhone', customerPhone);
    if (status) newParams.set('status', status);
    if (date?.from) newParams.set('from', date.from.toISOString());
    if (date?.to) newParams.set('to', date.to.toISOString());
    newParams.set('searched', 'true');
    setSearchParams(newParams, { replace: true });

    try {
      // Construct date range for the selected date
      // Assuming the user picks a date "YYYY-MM-DD", we want the full day in UTC? 
      // The API expects from/to separately.
      // If user provided a date, send from=startOfDay, to=endOfDay
      // However, input type="date" gives "YYYY-MM-DD".
      let fromDate: string | undefined;
      let toDate: string | undefined;

      if (date?.from) {
        // Create date objects for start and end of day
        const start = new Date(date.from);
        start.setHours(0, 0, 0, 0);
        
        // If 'to' is undefined, default to 'from' (single day selection)
        const end = date.to ? new Date(date.to) : new Date(date.from);
        end.setHours(23, 59, 59, 999);
        
        fromDate = start.toISOString();
        toDate = end.toISOString();
      }

      // Use the correct API based on login module
      // BAP = Customer Dashboard, BPP/FLEET = Driver Dashboard
      const isBPP = loginModule === 'BPP' || loginModule === 'FLEET';
      
      if (isBPP) {
        // BPP uses cityId (e.g., 'std:080')
        const response = await listBPPRides(merchantId, cityId || undefined, {
          rideShortId: shortRideId || undefined,
          driverPhoneNo: driverPhone || undefined,
          customerPhoneNo: customerPhone || undefined,
          bookingStatus: status || undefined,
          from: fromDate,
          to: toDate,
        });
        setData(response.rides || []);
      } else {
        // BAP uses cityName (e.g., 'Bangalore') instead of cityId
        const response = await listRides(merchantId, cityName || undefined, {
          rideShortId: shortRideId || undefined,
          customerPhoneNo: customerPhone || undefined,
          bookingStatus: status || undefined,
          from: fromDate,
          to: toDate,
        });
        // Map BAP response to same format as BPP for table display
        // BAP response might use different field names
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const ridesList = response.list || (response as any).rides || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mappedRides = ridesList.map((ride: any) => ({
          rideId: ride.id || ride.rideId || ride.bookingId,
          rideShortId: ride.rideShortId || ride.bookingId || ride.id,
          bookingStatus: ride.status || ride.bookingStatus,
          rideCreatedAt: ride.createdAt || ride.rideCreatedAt,
          driverName: ride.driverName,
          driverPhoneNo: ride.driverPhone || ride.driverPhoneNo,
          vehicleNo: ride.vehicleNumber || ride.vehicleNo,
          customerName: ride.customerName || ride.riderName,
          customerPhoneNo: ride.customerPhone || ride.customerPhoneNo || ride.riderPhone,
        }));
        setData(mappedRides);
      }
    } catch (err: unknown) {
      console.error('Search rides error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch rides';
      setError(errorMessage);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [merchantId, cityId, cityName, loginModule, shortRideId, driverPhone, customerPhone, status, date, isDateRequired, setSearchParams]);

  // Auto-search on mount if URL has search params (for back navigation preservation)
  useEffect(() => {
    if (searchParams.has('searched') && !data.length && !isLoading) {
      handleSearch();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = () => {
    setShortRideId('');
    setDriverPhone('');
    setCustomerPhone('');
    setStatus('');
    setDate(undefined);
    setData([]);
    setError(null);
    setHasSearched(false);
    // Clear URL params
    setSearchParams(new URLSearchParams(), { replace: true });
  };

  const statusOptions: { label: string; value: RideStatusFilter }[] = [
    { label: 'Upcoming', value: 'UPCOMING' },
    { label: 'Ongoing', value: 'ONGOING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Cancelled', value: 'CANCELLED' },
    { label: 'Upcoming more than 6 hours', value: 'UPCOMING_6HRS' },
    { label: 'Ongoing more than 6 hours', value: 'ONGOING_6HRS' },
  ];

  return (
    <Page>
      <PageHeader title="Rides" description="Search and view ride history" />
      <PageContent>
        <div className="space-y-6">
          {/* Filters Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Short Ride ID */}
                <div className="space-y-2">
                  <Label htmlFor="shortRideId">Short Ride ID</Label>
                  <Input
                    id="shortRideId"
                    placeholder="Enter short ride ID"
                    value={shortRideId}
                    onChange={(e) => setShortRideId(e.target.value)}
                  />
                </div>

                {/* Driver Phone */}
                <div className="space-y-2">
                  <Label htmlFor="driverPhone">Driver Phone Number</Label>
                  <Input
                    id="driverPhone"
                    placeholder="Enter driver phone"
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                  />
                </div>

                {/* Customer Phone */}
                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Customer Phone Number</Label>
                  <Input
                    id="customerPhone"
                    placeholder="Enter customer phone"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                  />
                </div>

                {/* Status */}
                <div className="space-y-2">
                  <Label htmlFor="status">Ride Status</Label>
                  <Select
                    value={status}
                    onValueChange={(val) => setStatus(val as RideStatusFilter)}
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL_STATUS_PLACEHOLDER" disabled className="hidden">Select status</SelectItem>
                      {statusOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Range */}
                <div className="space-y-2">
                  {/* Show required styling only when other fields have input but date is missing */}
                  {(() => {
                    const hasOtherInput = !!(shortRideId || driverPhone || customerPhone || status);
                    const showRequired = hasOtherInput && !date;
                    return (
                      <>
                        <Label className={showRequired ? 'text-destructive' : ''}>
                          Date Range {hasOtherInput && '*'}
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              id="date"
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal h-10",
                                !date && "text-muted-foreground",
                                showRequired && "border-destructive"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {(() => {
                                if (!date?.from) return <span>Pick a date</span>;
                                if (date.to) {
                                  return (
                                    <>
                                      {format(date.from, "LLL dd, y")} -{" "}
                                      {format(date.to, "LLL dd, y")}
                                    </>
                                  );
                                }
                                return format(date.from, "LLL dd, y");
                              })()}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              autoFocus
                              mode="range"
                              defaultMonth={date?.from}
                              selected={date}
                              onSelect={setDate}
                              numberOfMonths={2}
                            />
                          </PopoverContent>
                        </Popover>
                        {showRequired && (
                          <span className="text-xs text-destructive">Required when other filters are specified</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="outline" onClick={handleReset} disabled={isLoading}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
                <Button 
                  onClick={handleSearch} 
                  disabled={isLoading || !isSearchEnabled}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Apply
                    </>
                  )}
                </Button>
              </div>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Results Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Created At</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Driver Name</TableHead>
                    <TableHead>Driver Phone</TableHead>
                    <TableHead>Vehicle No</TableHead>
                    <TableHead>Customer Name</TableHead>
                    <TableHead>Customer Phone</TableHead>
                    <TableHead>Short ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(() => {
                    if (isLoading) {
                      return (
                        <TableRow>
                          <TableCell colSpan={8} className="h-24 text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                          </TableCell>
                        </TableRow>
                      );
                    }
                    if (data.length > 0) {
                      return data.map((ride) => (
                        <TableRow 
                          key={ride.rideId} 
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/ops/rides/${ride.rideId}`)}
                        >
                          <TableCell>
                            {ride.rideCreatedAt ? format(new Date(ride.rideCreatedAt), 'PP p') : '-'}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              let badgeClass = 'bg-gray-100 text-gray-800';
                              if (ride.bookingStatus === 'COMPLETED') {
                                badgeClass = 'bg-green-100 text-green-800';
                              } else if (ride.bookingStatus === 'CANCELLED') {
                                badgeClass = 'bg-red-100 text-red-800';
                              } else if (ride.bookingStatus?.includes('ONGOING')) {
                                badgeClass = 'bg-blue-100 text-blue-800';
                              }
                              return (
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeClass}`}>
                                  {ride.bookingStatus}
                                </span>
                              );
                            })()}
                          </TableCell>
                          <TableCell>{ride.driverName || '-'}</TableCell>
                          <TableCell>{ride.driverPhoneNo || '-'}</TableCell>
                          <TableCell>{ride.vehicleNo || '-'}</TableCell>
                          <TableCell>{ride.customerName || '-'}</TableCell>
                          <TableCell>{ride.customerPhoneNo || '-'}</TableCell>
                          <TableCell className="font-mono text-xs">{ride.rideShortId || '-'}</TableCell>
                        </TableRow>
                      ));
                    }
                    return (
                      <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                          {hasSearched ? 'No rides found matching your criteria' : 'Enter criteria and click Apply to search'}
                        </TableCell>
                      </TableRow>
                    );
                  })()}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </Page>
  );
}
