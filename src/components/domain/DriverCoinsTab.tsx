import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Coins, TrendingUp, TrendingDown, Clock, Loader2, Plus } from 'lucide-react';
import { useDriverCoinHistory, useBulkUploadCoins } from '../../hooks/useDrivers';
import type { CoinBurnHistoryItem, CoinEarnHistoryItem, BulkUploadTitle } from '../../services/drivers';
import { formatDateTime } from '../../lib/utils';
import { toast } from 'sonner';

interface DriverCoinsTabProps {
  readonly driverId: string;
  readonly isActive: boolean;
}

// Title mappings for different reasons
const REFUND_TITLES: Record<string, BulkUploadTitle> = {
  FareRecomputation: {
    bn: 'অতিরিক্ত কিলোমিটারের জন্য ফেরত',
    en: "Refund for extra km's",
    fr: 'Remboursement',
    hi: 'अतिरिक्त किलोमीटर के लिए रिफंड',
    kn: 'ಹೆಚ್ಚುವರಿ ಕಿಲೋಮೀಟರ್‌ಗಳಿಗೆ ಮರುಪಾವತಿ',
    ml: 'കൂടുതൽ കിലോമീറ്ററുകൾക്ക് റീഫണ്ട്',
    ta: 'கூடுதல் கிலோமீட்டருக்கான இழப்பீடு',
    te: 'అదనపు కిలోమీటర్ల కొరకు వాపసు',
  },
};

// Expiration time options (in seconds)
const EXPIRATION_OPTIONS = [
  { label: '5 Months', value: 12960000 },
];

export function DriverCoinsTab({ driverId, isActive }: DriverCoinsTabProps) {
  const INITIAL_LIMIT = 5;
  const [currentLimit, setCurrentLimit] = useState(INITIAL_LIMIT);
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);
  
  // Track if we've loaded initial data for this activation
  const lastActiveRef = useRef(false);
  const [key, setKey] = useState(0);
  
  // Accumulated history items
  const [earnHistory, setEarnHistory] = useState<CoinEarnHistoryItem[]>([]);
  const [burnHistory, setBurnHistory] = useState<CoinBurnHistoryItem[]>([]);
  const [hasMoreEarn, setHasMoreEarn] = useState(true);
  const [hasMoreBurn, setHasMoreBurn] = useState(true);

  // Refund dialog state
  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [refundCurrency, setRefundCurrency] = useState('INR');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundType, setRefundType] = useState('BulkUploadFunctionV2');
  const [refundReason, setRefundReason] = useState('FareRecomputation');
  const [refundExpiration, setRefundExpiration] = useState('12960000');

  // Fetch coin history
  const { data, isLoading, isFetching, error, refetch } = useDriverCoinHistory(
    driverId,
    currentLimit,
    0,
    isActive
  );

  // Bulk upload mutation
  const bulkUploadMutation = useBulkUploadCoins();

  // Reset state when tab becomes active
  useEffect(() => {
    if (isActive && !lastActiveRef.current) {
      // eslint-disable-next-line
      setKey(prev => prev + 1);
      setCurrentLimit(INITIAL_LIMIT);
      setHasInitiallyLoaded(false);
      lastActiveRef.current = true;
    } else if (!isActive) {
      lastActiveRef.current = false;
    }
  }, [isActive, INITIAL_LIMIT]);

  // Update history when data changes
  useEffect(() => {
    if (data) {
      // eslint-disable-next-line
      setEarnHistory(data.coinEarnHistory || []);
      setBurnHistory(data.coinBurnHistory || []);
      setHasMoreEarn((data.coinEarnHistory?.length || 0) >= currentLimit);
      setHasMoreBurn((data.coinBurnHistory?.length || 0) >= currentLimit);
      setHasInitiallyLoaded(true);
    }
  }, [data, currentLimit]);

  const handleLoadMoreEarn = useCallback(() => {
    setCurrentLimit(prev => prev + 5);
  }, []);

  const handleLoadMoreBurn = useCallback(() => {
    setCurrentLimit(prev => prev + 5);
  }, []);

  const formatEventName = (event: CoinEarnHistoryItem['eventFunction']) => {
    const name = event.tag.replaceAll(/([A-Z])/g, ' $1').trim();
    if (event.contents) {
      return `${name} (${event.contents})`;
    }
    return name;
  };

  const handleOpenRefundDialog = () => {
    setRefundAmount('');
    setRefundCurrency('INR');
    setRefundType('BulkUploadFunctionV2');
    setRefundReason('FareRecomputation');
    setRefundExpiration('12960000');
    setIsRefundDialogOpen(true);
  };

  const handleRefundSubmit = async () => {
    const amountInCash = Number.parseInt(refundAmount, 10);
    const amountInCoins = amountInCash * 10;
    
    if (Number.isNaN(amountInCash) || amountInCash <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      const result = await bulkUploadMutation.mutateAsync({
        bulkUploadTitle: REFUND_TITLES[refundReason],
        driverIdListWithCoins: [
          {
            amount: amountInCoins,
            amountWithCurrency: {
              amount: amountInCash,
              currency: refundCurrency,
            },
            driverId,
          },
        ],
        eventFunction: {
          tag: refundType,
          contents: refundReason,
        },
        expirationTime: Number.parseInt(refundExpiration, 10),
      });

      if (result.success > 0) {
        toast.success(`Successfully refunded ${amountInCoins} coins to driver`);
        setIsRefundDialogOpen(false);
        refetch();
      } else if (result.failedItems.length > 0) {
        toast.error(`Refund failed: ${result.failedItems[0].errorMessage}`);
      }
    } catch {
      toast.error('Failed to process refund');
    }
  };

  // Calculate coins from amount (10:1 ratio for INR as per user request)
  const coinsToRefund = (Number.parseInt(refundAmount, 10) || 0) * 10;

  if (!isActive) {
    return null;
  }

  if (isLoading && !hasInitiallyLoaded) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading coin history...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-destructive">Failed to load coin history</p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data && !isFetching) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Coins className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No coin data available</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="space-y-6" key={key}>
      {/* Coin Balance - Prominent */}
      <Card className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 border-amber-200 dark:border-amber-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="text-center flex-1">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="h-8 w-8 text-amber-500" />
                <span className="text-sm font-medium text-amber-700 dark:text-amber-300">Coin Balance</span>
              </div>
              <p className="text-5xl font-bold text-amber-600 dark:text-amber-400">
                {data.coinBalance.toLocaleString()}
              </p>
            </div>
            <Button onClick={handleOpenRefundDialog} className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Refund Coins
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Earned</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{data.coinEarned.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-xs text-muted-foreground">Expired</span>
            </div>
            <p className="text-2xl font-bold text-orange-600">{data.coinExpired.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Used</span>
            </div>
            <p className="text-2xl font-bold text-blue-600">{data.coinUsed.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* History Sections - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Earnings History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Earnings History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {earnHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No earnings history</p>
            ) : (
              <>
                {earnHistory.map((item, index) => (
                  <div key={`${item.createdAt}-${index}`} className="flex justify-between items-start p-3 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">+{item.coins}</span>
                        <Badge variant="outline" className="text-xs">
                          {formatEventName(item.eventFunction)}
                        </Badge>
                      </div>
                      {item.rideShortId && (
                        <p className="text-xs text-muted-foreground">Ride: {item.rideShortId}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={item.status === 'Remaining' ? 'default' : 'secondary'} className="text-xs">
                        {item.status}
                      </Badge>
                      {item.expirationAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Expires: {new Date(item.expirationAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                {hasMoreEarn && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLoadMoreEarn}
                    disabled={isFetching}
                  >
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load More'}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Usage History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-blue-500" />
              Usage History
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {burnHistory.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No usage history</p>
            ) : (
              <>
                {burnHistory.map((item, index) => (
                  <div key={`${item.createdAt}-${index}`} className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-blue-600">-{item.numCoins.toLocaleString()}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium text-green-600">
                          {item.cashWithCurrency.currency === 'INR' ? '₹' : item.cashWithCurrency.currency}
                          {item.cash}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{item.title}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{formatDateTime(item.createdAt)}</p>
                  </div>
                ))}
                {hasMoreBurn && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleLoadMoreBurn}
                    disabled={isFetching}
                  >
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Load More'}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Refund Coins Dialog */}
      <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Refund Coins
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Currency */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <Select value={refundCurrency} onValueChange={setRefundCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                min="1"
              />
              {coinsToRefund > 0 && (
                <p className="text-sm text-green-600">
                  <Coins className="h-4 w-4 inline mr-1" />
                  {coinsToRefund} coins will be refunded
                </p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={refundType} onValueChange={setRefundType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BulkUploadFunctionV2">Bulk Upload Function V2</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reason */}
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={refundReason} onValueChange={setRefundReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FareRecomputation">Fare Recomputation</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Expiration Time */}
            <div className="space-y-2">
              <Label>Expiration Time</Label>
              <Select value={refundExpiration} onValueChange={setRefundExpiration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRATION_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleRefundSubmit}
              disabled={bulkUploadMutation.isPending || !refundAmount || coinsToRefund <= 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {bulkUploadMutation.isPending ? 'Processing...' : 'Confirm Refund'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
