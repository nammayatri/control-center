import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from 'sonner';

import { 
  CreditCard, 
  Loader2, 
  CheckCircle, 
  XCircle, 
  Wallet,
  Calendar,
  Zap,
  RefreshCw,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  History,
  Receipt,
  MessageSquare,
  Send,
  Smartphone,
  Bell,
  HandCoins,
} from 'lucide-react';
import { useDriverPlanDetails, useAvailablePlans, usePaymentHistory, useSwitchPlan, useSendSubscriptionCommunication, useWaiveOffFee } from '../../hooks/useDrivers';
import type { DriverPlanResponse, MandateDetails, CurrentPlanDetails, MediaChannel, SubscriptionMessageKey, WaiveOfMode } from '../../services/drivers';
import { formatDateTime, formatDate } from '../../lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';


interface DriverSubscriptionTabProps {
  readonly driverId: string;
  readonly isActive: boolean;
}

// Helper to format currency amounts
function formatCurrency(amount: number, currency: string = 'INR'): string {
  if (currency === 'INR') {
    return `₹${amount.toLocaleString()}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

// Helper to format fare component names to be more readable
function formatComponentName(component: string): string {
  return component
    .replaceAll('_', ' ')
    .toLowerCase()
    .replaceAll(/\b\w/g, (char) => char.toUpperCase());
}

// Get status color for autopay status
function getAutoPayStatusColor(status: string | null): 'default' | 'destructive' | 'secondary' | 'outline' {
  if (!status) return 'secondary';
  switch (status.toUpperCase()) {
    case 'ACTIVE':
      return 'default';
    case 'PENDING':
      return 'outline';
    case 'SUSPENDED':
    case 'PAUSED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

// Get payment mode badge variant
function getPaymentModeVariant(mode: string): 'default' | 'secondary' | 'outline' {
  switch (mode.toUpperCase()) {
    case 'AUTOPAY':
      return 'default';
    case 'MANUAL':
      return 'secondary';
    default:
      return 'outline';
  }
}

export function DriverSubscriptionTab({ driverId, isActive }: DriverSubscriptionTabProps) {
  const { data, isLoading, error, refetch } = useDriverPlanDetails(
    driverId,
    'YATRI_SUBSCRIPTION',
    isActive
  );

  const { data: availablePlansData, isLoading: isLoadingPlans } = useAvailablePlans(
    driverId,
    'YATRI_SUBSCRIPTION',
    isActive
  );

  if (!isActive) {
    return null;
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Loader2 className="h-8 w-8 mx-auto animate-spin text-muted-foreground" />
          <p className="mt-2 text-muted-foreground">Loading subscription details...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <XCircle className="h-12 w-12 mx-auto text-destructive mb-4" />
          <p className="text-destructive font-medium">Failed to load subscription details</p>
          <p className="text-sm text-muted-foreground mt-1">
            {error instanceof Error ? error.message : 'Unknown error occurred'}
          </p>
          <Button variant="outline" className="mt-4" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No subscription data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Plan Card - Prominent Display */}
      <PlanSummaryCard 
        data={data} 
        subscriptionStartTime={availablePlansData?.subscriptionStartTime}
      />

      {/* Plan Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dues & Credit Section */}
        {data.currentPlanDetails && (
          <DuesCard planDetails={data.currentPlanDetails} driverId={driverId} />
        )}

        {/* Mandate Details (if autopay) */}
        {data.mandateDetails && (
          <MandateCard mandate={data.mandateDetails} />
        )}
      </div>

      {/* Send Communication Section */}
      <SendCommunicationSection driverId={driverId} />

      {/* Payment History Section - Collapsible */}
      <PaymentHistorySection driverId={driverId} isActive={isActive} />
      
      {/* Available Plans Section */}
      <AvailablePlansSection 
        availablePlans={availablePlansData?.list || []}
        currentPlanId={data.currentPlanDetails?.id || null}
        isLoading={isLoadingPlans}
        driverId={driverId}
      />

      {/* Additional Info */}
      <AdditionalInfoCard data={data} />
    </div>
  );
}

// Plan Summary Card Component
function PlanSummaryCard({ 
  data,
  subscriptionStartTime 
}: { 
  readonly data: DriverPlanResponse;
  readonly subscriptionStartTime?: string;
}) {
  const plan = data.currentPlanDetails;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Plan Name & Status */}
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <CreditCard className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h2 className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                  {plan?.name || 'No Plan'}
                </h2>
                {plan?.description && (
                  <p className="text-sm text-blue-600/80 dark:text-blue-400/80">
                    {plan.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Subscribed Status */}
            <Badge 
              variant={data.subscribed ? 'default' : 'destructive'}
              className={data.subscribed ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {data.subscribed ? (
                <>
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Subscribed
                </>
              ) : (
                <>
                  <XCircle className="h-3 w-3 mr-1" />
                  Not Subscribed
                </>
              )}
            </Badge>

            {/* Frequency Badge */}
            {plan?.frequency && (
              <Badge variant="outline" className="border-blue-400 text-blue-700 dark:text-blue-300">
                <Calendar className="h-3 w-3 mr-1" />
                {plan.frequency}
              </Badge>
            )}

            {/* Payment Mode */}
            {plan?.paymentMode && (
              <Badge variant={getPaymentModeVariant(plan.paymentMode)}>
                <Wallet className="h-3 w-3 mr-1" />
                {plan.paymentMode}
              </Badge>
            )}

            {/* AutoPay Status (if applicable) */}
            {data.autoPayStatus && (
              <Badge variant={getAutoPayStatusColor(data.autoPayStatus)}>
                <Zap className="h-3 w-3 mr-1" />
                AutoPay: {data.autoPayStatus}
              </Badge>
            )}
          </div>
        </div>

        {/* Dates Info */}
        {(data.planRegistrationDate || subscriptionStartTime) && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4">
            {data.planRegistrationDate && (
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Registered on: {formatDate(data.planRegistrationDate)}
              </p>
            )}
            {subscriptionStartTime && (
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Subscribed since: {formatDate(subscriptionStartTime)}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Available Plans Section Component
function AvailablePlansSection({ 
  availablePlans, 
  currentPlanId,
  isLoading,
  driverId,
}: { 
  readonly availablePlans: CurrentPlanDetails[];
  readonly currentPlanId: string | null;
  readonly isLoading: boolean;
  readonly driverId: string;
}) {
  const [expandedPlanId, setExpandedPlanId] = useState<string | null>(null);
  const [isSectionExpanded, setIsSectionExpanded] = useState(false);
  const switchPlanMutation = useSwitchPlan();
  const [switchingPlanId, setSwitchingPlanId] = useState<string | null>(null);

  const onTogglePlanDetails = (planId: string) => {
    setExpandedPlanId(expandedPlanId === planId ? null : planId);
  };

  const handleSwitchPlan = (planId: string) => {
    setSwitchingPlanId(planId);
    switchPlanMutation.mutate(
      { driverId, planId },
      {
        onSettled: () => setSwitchingPlanId(null),
      }
    );
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setIsSectionExpanded(!isSectionExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <div className="flex items-center justify-between flex-1 mr-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Layers className="h-5 w-5 text-purple-500" />
              Available Plans
              {!isLoading && availablePlans.length > 0 && (
                <Badge variant="secondary" className="ml-2">{availablePlans.length} plans</Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            {isSectionExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>
      
      {isSectionExpanded && (
        <CardContent>
          {(() => {
            if (isLoading) {
              return (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 mx-auto animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">Loading available plans...</p>
                </div>
              );
            }

            if (availablePlans.length === 0) {
              return <p className="text-muted-foreground text-center p-8">No other plans available</p>;
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {availablePlans.map((plan) => {
                  const isCurrentPlan = plan.id === currentPlanId;
                  const isExpanded = expandedPlanId === plan.id;
                  const finalFee = plan.planFareBreakup.find(f => f.component === 'FINAL_FEE');
                  const maxFee = plan.planFareBreakup.find(f => f.component === 'MAX_FEE_LIMIT');

                  return (
                    <Card 
                      key={plan.id} 
                      className={`relative transition-all ${
                        isCurrentPlan 
                          ? 'border-green-500 bg-green-50/50 dark:bg-green-950/20' 
                          : 'hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      {isCurrentPlan && (
                        <div className="absolute -top-2 -right-2">
                          <Badge className="bg-green-600 hover:bg-green-700 text-xs">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Current
                          </Badge>
                        </div>
                      )}
                      
                      <CardContent className="p-4">
                        {/* Plan Header & Switch Button */}
                        <div className="flex justify-between items-start gap-3 mb-3">
                          <div className="space-y-1">
                            <h3 className="font-bold text-lg leading-tight">{plan.name}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{plan.description}</p>
                          </div>
                          {!isCurrentPlan && (
                            <Button
                              size="sm"
                              variant="default" // Primary action to switch
                              className="h-8 text-xs shrink-0"
                              disabled={switchingPlanId === plan.id}
                              onClick={() => handleSwitchPlan(plan.id)}
                            >
                              {switchingPlanId === plan.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                "Switch"
                              )}
                            </Button>
                          )}
                        </div>

                        {/* Price Details */}
                        <div className="space-y-2 mb-4">
                          {finalFee && (
                            <div className="flex justify-between items-baseline">
                              <span className="text-sm text-muted-foreground">Subscription Fee</span>
                              <span className="text-xl font-bold">
                                {formatCurrency(
                                  finalFee.amountWithCurrency.amount,
                                  finalFee.amountWithCurrency.currency
                                )}
                              </span>
                            </div>
                          )}
                          {maxFee && (
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-muted-foreground">Max Fee Limit</span>
                              <span className="font-medium">
                                {formatCurrency(
                                  maxFee.amountWithCurrency.amount,
                                  maxFee.amountWithCurrency.currency
                                )}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Details Toggle */}
                        <div className="pt-2 border-t">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onTogglePlanDetails(plan.id)}
                            className="w-full text-xs h-8"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="h-3 w-3 mr-1" />
                                Hide Details
                              </>
                            ) : (
                              <>
                                <ChevronDown className="h-3 w-3 mr-1" />
                                View Details
                              </>
                            )}
                          </Button>
                        </div>

                        {/* Expanded Content */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t space-y-2 animate-in slide-in-from-top-2 fade-in duration-200">
                            <h4 className="text-xs font-semibold mb-2">Fare Breakup</h4>
                            <div className="space-y-1">
                              {plan.planFareBreakup.map((item) => (
                                <div key={item.component} className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">
                                    {formatComponentName(item.component)}
                                  </span>
                                  <span className="font-mono">
                                    {formatCurrency(
                                      item.amountWithCurrency.amount,
                                      item.amountWithCurrency.currency
                                    )}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            );
          })()}
        </CardContent>
      )}
    </Card>
  );
}


// Payment History Section Component - Collapsible with tabs
function PaymentHistorySection({ 
  driverId, 
  isActive 
}: { 
  readonly driverId: string; 
  readonly isActive: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'autopay' | 'manual'>('autopay');
  const [autoPayOffset, setAutoPayOffset] = useState(0);
  const [manualOffset, setManualOffset] = useState(0);
  const [expandedInvoiceId, setExpandedInvoiceId] = useState<string | null>(null);
  const LIMIT = 5;

  // Fetch payment history only when expanded
  const { data: autoPayData, isLoading: isLoadingAutoPay, isFetching: isFetchingAutoPay } = usePaymentHistory(
    driverId,
    'AUTOPAY_INVOICE',
    LIMIT,
    autoPayOffset,
    'YATRI_SUBSCRIPTION',
    isActive && isExpanded
  );

  const { data: manualData, isLoading: isLoadingManual, isFetching: isFetchingManual } = usePaymentHistory(
    driverId,
    'MANUAL_INVOICE',
    LIMIT,
    manualOffset,
    'YATRI_SUBSCRIPTION',
    isActive && isExpanded
  );

  const autoPayInvoices = autoPayData?.autoPayInvoices || [];
  const manualInvoices = manualData?.manualPayInvoices || [];
  const hasMoreAutoPay = autoPayInvoices.length >= LIMIT;
  const hasMoreManual = manualInvoices.length >= LIMIT;

  const handleLoadMoreAutoPay = () => setAutoPayOffset(prev => prev + LIMIT);
  const handleLoadMoreManual = () => setManualOffset(prev => prev + LIMIT);

  const toggleInvoiceDetails = (invoiceId: string) => {
    setExpandedInvoiceId(expandedInvoiceId === invoiceId ? null : invoiceId);
  };

  // Get stage badge color
  const getStageBadgeVariant = (stage: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (stage) {
      case 'EXECUTION_SUCCESS':
        return 'default';
      case 'EXECUTION_SCHEDULED':
        return 'secondary';
      case 'EXECUTION_FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Format stage name
  const formatStageName = (stage: string): string => {
    return stage.replaceAll('_', ' ').toLowerCase().replaceAll(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            Payment History
          </CardTitle>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'autopay' | 'manual')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="autopay" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                AutoPay
              </TabsTrigger>
              <TabsTrigger value="manual" className="text-xs">
                <Receipt className="h-3 w-3 mr-1" />
                Manual
              </TabsTrigger>
            </TabsList>

            {/* AutoPay Invoices Tab */}
            <TabsContent value="autopay" className="mt-0">
              {(() => {
                if (isLoadingAutoPay && autoPayOffset === 0) {
                  return (
                    <div className="p-6 text-center">
                      <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading payment history...</p>
                    </div>
                  );
                }

                if (autoPayInvoices.length === 0) {
                  return (
                    <div className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">No AutoPay payment history</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {autoPayInvoices.map((invoice) => {
                      const isExpanded = expandedInvoiceId === invoice.invoiceId;
                      return (
                        <Card key={invoice.invoiceId} className="border-l-4 border-l-blue-500">
                          <CardContent className="p-4">
                            {/* Main Info - Always Visible */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                {/* Amount and Status */}
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-lg font-bold text-primary">
                                    {formatCurrency(
                                      invoice.amountWithCurrency.amount,
                                      invoice.amountWithCurrency.currency
                                    )}
                                  </span>
                                  <Badge variant={getStageBadgeVariant(invoice.autoPayStage)} className="text-xs">
                                    {formatStageName(invoice.autoPayStage)}
                                  </Badge>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Debited:</span>
                                    <p className="font-medium">{new Date(invoice.executionAt).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Ride Date:</span>
                                    <p className="font-medium">{new Date(invoice.rideTakenOn).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Details Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleInvoiceDetails(invoice.invoiceId)}
                                className="text-xs"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Details
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t space-y-2 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Invoice ID</Label>
                                    <p className="font-mono text-xs">{invoice.invoiceId}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Coin Cleared</Label>
                                    <p>{invoice.isCoinCleared ? 'Yes' : 'No'}</p>
                                  </div>
                                  {invoice.coinDiscountAmount > 0 && (
                                    <div>
                                      <Label className="text-xs text-muted-foreground">Coin Discount</Label>
                                      <p className="font-medium text-green-600">
                                        {formatCurrency(
                                          invoice.coinDiscountAmountWithCurrency.amount,
                                          invoice.coinDiscountAmountWithCurrency.currency
                                        )}
                                      </p>
                                    </div>
                                  )}
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Execution Time</Label>
                                    <p>{formatDateTime(invoice.executionAt)}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    {hasMoreAutoPay && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={handleLoadMoreAutoPay}
                        disabled={isFetchingAutoPay}
                      >
                        {isFetchingAutoPay ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    )}
                  </div>
                );
              })()}
            </TabsContent>

            {/* Manual Invoices Tab */}
            <TabsContent value="manual" className="mt-0">
              {(() => {
                if (isLoadingManual && manualOffset === 0) {
                  return (
                    <div className="p-6 text-center">
                      <Loader2 className="h-5 w-5 mx-auto animate-spin text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Loading payment history...</p>
                    </div>
                  );
                }

                if (manualInvoices.length === 0) {
                  return (
                    <div className="p-6 text-center">
                      <p className="text-sm text-muted-foreground">No manual payment history</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-3">
                    {manualInvoices.map((invoice) => {
                      const isExpanded = expandedInvoiceId === invoice.invoiceId;
                      return (
                        <Card key={invoice.invoiceId} className="border-l-4 border-l-purple-500">
                          <CardContent className="p-4">
                            {/* Main Info - Always Visible */}
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 space-y-2">
                                {/* Amount */}
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-primary">
                                    {formatCurrency(
                                      invoice.amountWithCurrency.amount,
                                      invoice.amountWithCurrency.currency
                                    )}
                                  </span>
                                  <Badge variant="secondary" className="text-xs">Manual Payment</Badge>
                                </div>

                                {/* Dates */}
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-muted-foreground">Debited:</span>
                                    <p className="font-medium">{new Date(invoice.paymentDate).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">Ride Date:</span>
                                    <p className="font-medium">{new Date(invoice.rideTakenOn).toLocaleDateString()}</p>
                                  </div>
                                </div>
                              </div>

                              {/* Details Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleInvoiceDetails(invoice.invoiceId)}
                                className="text-xs"
                              >
                                {isExpanded ? (
                                  <>
                                    <ChevronUp className="h-3 w-3 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="h-3 w-3 mr-1" />
                                    Details
                                  </>
                                )}
                              </Button>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t space-y-2 text-xs">
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Invoice ID</Label>
                                    <p className="font-mono text-xs">{invoice.invoiceId}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Payment Time</Label>
                                    <p>{formatDateTime(invoice.paymentDate)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-xs text-muted-foreground">Ride Time</Label>
                                    <p>{formatDateTime(invoice.rideTakenOn)}</p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                    {hasMoreManual && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-2"
                        onClick={handleLoadMoreManual}
                        disabled={isFetchingManual}
                      >
                        {isFetchingManual ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          'Load More'
                        )}
                      </Button>
                    )}
                  </div>
                );
              })()}
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}


// Dues Card Component
function DuesCard({ 
  planDetails, 
  driverId 
}: { 
  readonly planDetails: NonNullable<DriverPlanResponse['currentPlanDetails']>;
  readonly driverId: string;
}) {
  const currentDues = planDetails.currentDuesWithCurrency.amount;
  const creditLimit = planDetails.totalPlanCreditLimitWithCurrency.amount;
  const utilizationPercentage = creditLimit > 0 
    ? Math.min((currentDues / creditLimit) * 100, 100) 
    : 0;
  const [isWaiveOffDialogOpen, setIsWaiveOffDialogOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-5 w-5 text-amber-500" />
            Dues & Credit
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsWaiveOffDialogOpen(true)}
            className="h-8 text-xs"
          >
            <HandCoins className="h-3 w-3 mr-1" />
            Waive Off Dues
          </Button>

        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Credit Utilization Progress Bar */}
        <div className="space-y-3">
          <div className="flex justify-between items-end">
            <div>
              <Label className="text-xs text-muted-foreground">Current Dues</Label>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(currentDues, planDetails.currentDuesWithCurrency.currency)}
              </p>
            </div>
            <div className="text-right">
              <Label className="text-xs text-muted-foreground">Total Credit Limit</Label>
              <p className="font-medium text-muted-foreground">
                {formatCurrency(creditLimit, planDetails.totalPlanCreditLimitWithCurrency.currency)}
              </p>
            </div>
          </div>
          
          <div className="relative h-2.5 w-full bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-500 ease-out rounded-full"
              style={{ width: `${utilizationPercentage}%` }}
            />
          </div>
          
          {currentDues > 0 && (
            <p className="text-xs text-muted-foreground text-right">
              {utilizationPercentage.toFixed(1)}% utilized
            </p>
          )}
        </div>

        {/* Other Dues Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <Label className="text-xs text-muted-foreground">AutoPay Dues</Label>
            <p className="text-lg font-bold text-blue-600">
              {formatCurrency(
                planDetails.autopayDuesWithCurrency.amount,
                planDetails.autopayDuesWithCurrency.currency
              )}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Booth Charges Due</Label>
            <p className="font-medium">
              {formatCurrency(
                planDetails.dueBoothChargesWithCurrency.amount,
                planDetails.dueBoothChargesWithCurrency.currency
              )}
            </p>
          </div>
        </div>

        {/* Free Ride Count */}
        {planDetails.freeRideCount > 0 && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
               <Label className="text-xs text-muted-foreground">Free Rides Remaining</Label>
               <p className="font-bold text-lg text-green-600">{planDetails.freeRideCount}</p>
            </div>
          </div>
        )}

        {/* Coin Discount */}
        {planDetails.coinEntity.coinDiscountUpto > 0 && (
          <div className="pt-2 border-t">
            <Label className="text-xs text-muted-foreground">Coin Discount (Up to)</Label>
            <p className="font-medium">
              {formatCurrency(
                planDetails.coinEntity.coinDiscountUptoWithCurrency.amount,
                planDetails.coinEntity.coinDiscountUptoWithCurrency.currency
              )}
            </p>
          </div>
        )}

        {/* Waive Off Dialog */}
        <WaiveOffDialog
          open={isWaiveOffDialogOpen}
          onOpenChange={setIsWaiveOffDialogOpen}
          driverId={driverId}
        />
      </CardContent>
    </Card>
  );
}

// Mandate Card Component
function MandateCard({ mandate }: { readonly mandate: MandateDetails }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Zap className="h-5 w-5 text-purple-500" />
          AutoPay Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <Label className="text-xs text-muted-foreground">Status</Label>
            <div className="mt-1">
              <Badge variant={mandate.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {mandate.status}
              </Badge>
            </div>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Max Amount</Label>
            <p className="font-bold text-lg">
              {formatCurrency(
                mandate.maxAmountWithCurrency.amount,
                mandate.maxAmountWithCurrency.currency
              )}
            </p>
          </div>
          <div className="col-span-2">
            <Label className="text-xs text-muted-foreground">Payer VPA</Label>
            <p className="font-mono text-sm break-all">{mandate.payerVpa || 'N/A'}</p>
          </div>
          {mandate.payerApp && (
            <div className="col-span-2">
              <Label className="text-xs text-muted-foreground">Payer App</Label>
              <p className="text-sm">{mandate.payerApp}</p>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Setup Date</Label>
            <p className="text-sm">
              {mandate.autopaySetupDate ? formatDateTime(mandate.autopaySetupDate) : 'N/A'}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Frequency</Label>
            <p className="text-sm">{mandate.frequency || 'N/A'}</p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Start Date</Label>
            <p className="text-sm">
              {mandate.startDate ? new Date(mandate.startDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">End Date</Label>
            <p className="text-sm">
              {mandate.endDate ? new Date(mandate.endDate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
        </div>

        <div className="pt-2 border-t">
          <Label className="text-xs text-muted-foreground">Mandate ID</Label>
          <p className="font-mono text-xs break-all text-muted-foreground">{mandate.mandateId}</p>
        </div>
      </CardContent>
    </Card>
  );
}




// Additional Info Card Component
function AdditionalInfoCard({ data }: { readonly data: DriverPlanResponse }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left"
        >
          <CardTitle className="text-base">Additional Information</CardTitle>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <Label className="text-xs text-muted-foreground">Eligible for Charge</Label>
              <p className="font-medium">
                {data.isEligibleForCharge ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" /> Yes
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center gap-1">
                    <XCircle className="h-4 w-4" /> No
                  </span>
                )}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Last AutoPay Payment</Label>
              <p className="font-medium">
                {data.latestAutopayPaymentDate 
                  ? formatDateTime(data.latestAutopayPaymentDate) 
                  : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Last Manual Payment</Label>
              <p className="font-medium">
                {data.latestManualPaymentDate 
                  ? formatDateTime(data.latestManualPaymentDate) 
                  : 'N/A'}
              </p>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Payout VPA</Label>
              <p className="font-mono text-sm truncate" title={data.payoutVpa || ''}>
                {data.payoutVpa || 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Message type configuration with channel-specific keys
interface MessageTypeConfig {
  id: string;
  label: string;
  description: string;
  whatsappKey: SubscriptionMessageKey;
  smsKey: SubscriptionMessageKey;
  overlayKey: string;
  color: string;
}

const MESSAGE_TYPES: MessageTypeConfig[] = [
  {
    id: 'clear_dues_call_missed',
    label: 'Clear Dues - Call Missed',
    description: 'Reminder for missed payment call',
    whatsappKey: 'WHATSAPP_CLEAR_DUES_CALL_MISSED_MESSAGE',
    smsKey: 'SMS_CLEAR_DUES_CALL_MISSED_MESSAGE',
    overlayKey: 'DASHBOARD CLEAR DUES CALL MISSED OVERLAY',
    color: 'from-red-500 to-orange-500',
  },
  {
    id: 'clear_dues',
    label: 'Clear Dues',
    description: 'Payment reminder for outstanding dues',
    whatsappKey: 'WHATSAPP_CLEAR_DUES_MESSAGE',
    smsKey: 'SMS_CLEAR_DUES_MESSAGE',
    overlayKey: 'DASHBOARD CLEAR DUES TO BE BLOCKED DRIVERS OVERLAY',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    id: 'clear_dues_blocked',
    label: 'Clear Dues - Blocked Drivers',
    description: 'Payment reminder for blocked drivers',
    whatsappKey: 'WHATSAPP_CLEAR_DUES_MESSAGE_TO_BLOCKED_DRIVERS',
    smsKey: 'SMS_CLEAR_DUES_MESSAGE_TO_BLOCKED_DRIVERS',
    overlayKey: 'DASHBOARD CLEAR DUES BLOCKED DRIVERS OVERLAY',
    color: 'from-red-600 to-rose-500',
  },
  {
    id: 'setup_autopay',
    label: 'Setup Autopay',
    description: 'Guide to set up automatic payments',
    whatsappKey: 'WHATSAPP_SETUP_AUTOPAY_MESSAGE',
    smsKey: 'SMS_SETUP_AUTOPAY_MESSAGE',
    overlayKey: 'DASHBOARD SETUP AUTOPAY OVERLAY',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    id: 'switch_plan',
    label: 'Switch Plan',
    description: 'Information about plan switching',
    whatsappKey: 'WHATSAPP_SWITCH_PLAN_MESSAGE',
    smsKey: 'SMS_SWITCH_PLAN_MESSAGE',
    overlayKey: 'DASHBOARD SWITCH TO DAILY UNLIMITED OVERLAY',
    color: 'from-purple-500 to-pink-500',
  },
  {
    id: 'how_it_works',
    label: 'How It Works',
    description: 'Explanation of autopay functionality',
    whatsappKey: 'WHATSAPP_HOW_IT_WORKS_MESSAGE',
    smsKey: 'SMS_HOW_IT_WORKS_MESSAGE',
    overlayKey: 'DASHBOARD HOW AUTOPAY WORKS OVERLAY',
    color: 'from-green-500 to-emerald-500',
  },
];

// Channel configuration 
interface ChannelConfig {
  id: MediaChannel;
  label: string;
  icon: React.ReactNode;
  bgClass: string;
  hoverClass: string;
}

// Send Communication Section Component
function SendCommunicationSection({ driverId }: { readonly driverId: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedMessageType, setSelectedMessageType] = useState<string>(MESSAGE_TYPES[0].id);
  const [sendingChannel, setSendingChannel] = useState<MediaChannel | null>(null);
  const [lastResult, setLastResult] = useState<{ channel: MediaChannel; success: boolean; message: string } | null>(null);

  const sendMutation = useSendSubscriptionCommunication();

  const selectedConfig = MESSAGE_TYPES.find(m => m.id === selectedMessageType) || MESSAGE_TYPES[0];

  const CHANNELS: ChannelConfig[] = [
    {
      id: 'ALERT',
      label: 'In-App Alert',
      icon: <Bell className="h-4 w-4" />,
      bgClass: 'bg-gradient-to-r from-blue-600 to-blue-500',
      hoverClass: 'hover:from-blue-700 hover:to-blue-600',
    },
    {
      id: 'OVERLAY',
      label: 'Overlay',
      icon: <Layers className="h-4 w-4" />,
      bgClass: 'bg-gradient-to-r from-purple-600 to-purple-500',
      hoverClass: 'hover:from-purple-700 hover:to-purple-600',
    },
    {
      id: 'WHATSAPP',
      label: 'WhatsApp',
      icon: <MessageSquare className="h-4 w-4" />,
      bgClass: 'bg-gradient-to-r from-green-600 to-green-500',
      hoverClass: 'hover:from-green-700 hover:to-green-600',
    },
    {
      id: 'SMS',
      label: 'SMS',
      icon: <Smartphone className="h-4 w-4" />,
      bgClass: 'bg-gradient-to-r from-cyan-600 to-cyan-500',
      hoverClass: 'hover:from-cyan-700 hover:to-cyan-600',
    },
  ];

  const handleSend = async (channel: MediaChannel) => {
    setSendingChannel(channel);
    setLastResult(null);

    // Determine the correct message key based on channel
    let messageKey: SubscriptionMessageKey;
    if (channel === 'WHATSAPP') {
      messageKey = selectedConfig.whatsappKey;
    } else {
      // For SMS, ALERT, and OVERLAY, use SMS key
      messageKey = selectedConfig.smsKey;
    }

    // Build request data - messageId only for ALERT and SMS
    const requestData: {
      channel: MediaChannel;
      messageId?: string;
      messageKey: SubscriptionMessageKey;
      overlayKey?: string;
    } = {
      channel,
      messageKey,
    };

    // Add messageId only for ALERT and SMS channels
    if (channel === 'ALERT' || channel === 'SMS') {
      requestData.messageId = crypto.randomUUID();
    }

    // Add overlayKey only for OVERLAY channel
    if (channel === 'OVERLAY') {
      requestData.overlayKey = selectedConfig.overlayKey;
    }

    try {
      await sendMutation.mutateAsync({
        driverId,
        data: requestData,
      });
      setLastResult({ channel, success: true, message: 'Sent successfully!' });
    } catch (error: unknown) {
      const errorMessage = 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.response?.data?.errorMessage || 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.response?.data?.message || 
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any)?.message || 
        'Failed to send';
      setLastResult({ channel, success: false, message: errorMessage });
    } finally {
      setSendingChannel(null);
    }
  };

  return (
    <Card className="overflow-hidden border-2 border-indigo-200 dark:border-indigo-800/50">
      <CardHeader 
        className="pb-3 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/30 dark:via-purple-950/30 dark:to-pink-950/30"
      >
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center justify-between w-full text-left group"
        >
          <CardTitle className="text-base flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
              <Send className="h-4 w-4" />
            </div>
            <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold">
              Send Communication
            </span>
            <Badge variant="outline" className="ml-2 border-indigo-300 text-indigo-600 dark:border-indigo-700 dark:text-indigo-400">
              4 Channels
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 transition-colors" />
            )}
          </div>
        </button>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-6 space-y-6">
          {/* Message Type Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-indigo-500" />
              Message Type
            </Label>
            <Select value={selectedMessageType} onValueChange={setSelectedMessageType}>
              <SelectTrigger className="w-full h-12 border-2 hover:border-indigo-300 transition-colors">
                <SelectValue placeholder="Select message type" />
              </SelectTrigger>
              <SelectContent>
                {MESSAGE_TYPES.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1.5 w-2 h-2 rounded-full bg-gradient-to-r ${type.color} shrink-0`} />
                      <div className="flex flex-col items-start text-left min-w-0">
                        <div className="font-medium leading-none mb-1">{type.label}</div>
                        <div className="text-xs text-muted-foreground leading-tight">{type.description}</div>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Overlay Key Display - Reduced emphasis for reference */}
          <div className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="h-3 w-3 text-slate-400 shrink-0" />
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 whitespace-nowrap">Overlay Key:</span>
                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 truncate" title={selectedConfig.overlayKey}>
                  {selectedConfig.overlayKey}
                </p>
              </div>
            </div>
          </div>

          {/* Channel Buttons */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Send className="h-4 w-4 text-indigo-500" />
              Send via Channel
            </Label>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {CHANNELS.map((channel) => {
                const isLoading = sendingChannel === channel.id;
                const result = lastResult?.channel === channel.id ? lastResult : null;

                return (
                  <Button
                    key={channel.id}
                    onClick={() => handleSend(channel.id)}
                    disabled={sendingChannel !== null}
                    className={`
                      h-16 flex flex-col items-center justify-center gap-1.5 text-white border-0
                      ${channel.bgClass} ${channel.hoverClass}
                      transition-all duration-300 transform hover:scale-105 hover:shadow-lg
                      disabled:opacity-70 disabled:hover:scale-100
                    `}
                  >
                    {(() => {
                      if (isLoading) {
                        return <Loader2 className="h-5 w-5 animate-spin" />;
                      }
                      if (result) {
                        return result.success ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <XCircle className="h-5 w-5" />
                        );
                      }
                      return channel.icon;
                    })()}
                    <span className="text-xs font-medium">
                      {isLoading ? 'Sending...' : channel.label}
                    </span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Success/Error Feedback */}
          {lastResult && (
            <div 
              className={`
                p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 fade-in duration-300
                ${lastResult.success 
                  ? 'bg-green-50 border border-green-200 dark:bg-green-950/30 dark:border-green-800' 
                  : 'bg-red-50 border border-red-200 dark:bg-red-950/30 dark:border-red-800'
                }
              `}
            >
              {lastResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 shrink-0" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${lastResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                  {lastResult.success ? 'Message sent successfully!' : 'Failed to send message'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {CHANNELS.find(c => c.id === lastResult.channel)?.label} · {selectedConfig.label}
                </p>
                {!lastResult.success && lastResult.message && lastResult.message !== 'Failed to send' && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1.5 font-mono">
                    {lastResult.message}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

// Waive Off Dialog Component
function WaiveOffDialog({
  open,
  onOpenChange,
  driverId,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly driverId: string;
}) {
  const [percentage, setPercentage] = useState('');
  const [waiveOffType, setWaiveOffType] = useState<WaiveOfMode | ''>('');
  const [daysValid, setDaysValid] = useState('');
  const [errors, setErrors] = useState<{ percentage?: string; daysValid?: string }>({});
  
  const waiveOffMutation = useWaiveOffFee();

  const validateForm = (): boolean => {
    const newErrors: { percentage?: string; daysValid?: string } = {};
    
    const percentageNum = Number.parseInt(percentage, 10);
    const daysNum = Number.parseInt(daysValid, 10);

    if (!percentage || Number.isNaN(percentageNum) || percentageNum <= 0 || percentageNum > 100) {
      newErrors.percentage = 'Percentage must be between 1 and 100';
    }

    if (!daysValid || Number.isNaN(daysNum) || daysNum <= 0 || daysNum > 365) {
      newErrors.daysValid = 'Days valid must be between 1 and 365';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !waiveOffType) return;

    try {
      const response = await waiveOffMutation.mutateAsync({
        waiveOffEntities: [
          {
            driverId,
            percentage: Number.parseInt(percentage, 10),
            serviceName: 'YATRI_SUBSCRIPTION',
            waiveOfMode: waiveOffType,
            daysValidFor: Number.parseInt(daysValid, 10),
          },
        ],
      });

      // Check for error in response
      if (response.errorCode) {
        toast.error(response.errorMessage || 'Failed to waive off dues');
      } else {
        toast.success('Dues waived off successfully');
        // Reset form and close dialog
        setPercentage('');
        setWaiveOffType('');
        setDaysValid('');
        setErrors({});
        onOpenChange(false);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to waive off dues');
    }
  };

  // Check if form is valid for enabling submit button
  const percentageNum = Number.parseInt(percentage, 10);
  const daysNum = Number.parseInt(daysValid, 10);
  const isFormValid = 
    percentage && 
    waiveOffType && 
    daysValid && 
    !Number.isNaN(percentageNum) && 
    percentageNum > 0 && 
    percentageNum <= 100 &&
    !Number.isNaN(daysNum) && 
    daysNum > 0 && 
    daysNum <= 365;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="h-5 w-5 text-amber-500" />
            Waive Off Dues
          </DialogTitle>
          <DialogDescription>
            Configure the waive-off parameters for this driver's subscription dues.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Percentage Input */}
          <div className="space-y-2">
            <Label htmlFor="percentage">Waive Off Percentage (%)</Label>
            <Input
              id="percentage"
              type="number"
              min="1"
              max="100"
              placeholder="Enter percentage (1-100)"
              value={percentage}
              onChange={(e) => {
                setPercentage(e.target.value);
                setErrors((prev) => ({ ...prev, percentage: undefined }));
              }}
              className={errors.percentage ? 'border-destructive' : ''}
            />
            {errors.percentage && (
              <p className="text-xs text-destructive">{errors.percentage}</p>
            )}
          </div>

          {/* Waive Off Type Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="waiveOffType">Type of Waive Off</Label>
            <Select
              value={waiveOffType}
              onValueChange={(value) => setWaiveOffType(value as WaiveOfMode)}
            >
              <SelectTrigger id="waiveOffType">
                <SelectValue placeholder="Select waive off type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WITH_OFFER">With Offer</SelectItem>
                <SelectItem value="WITHOUT_OFFER">Without Offer</SelectItem>
                <SelectItem value="NO_WAIVE_OFF">No Waive Off</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Days Valid Input */}
          <div className="space-y-2">
            <Label htmlFor="daysValid">Days Valid Till</Label>
            <Input
              id="daysValid"
              type="number"
              min="1"
              max="365"
              placeholder="Enter days (1-365)"
              value={daysValid}
              onChange={(e) => {
                setDaysValid(e.target.value);
                setErrors((prev) => ({ ...prev, daysValid: undefined }));
              }}
              className={errors.daysValid ? 'border-destructive' : ''}
            />
            {errors.daysValid && (
              <p className="text-xs text-destructive">{errors.daysValid}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={waiveOffMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || waiveOffMutation.isPending}
          >
            {waiveOffMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

