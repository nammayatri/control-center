import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import {
    useSendAuthOtp,
    useVerifyAuthOtp,
    useAvailablePasses,
    usePurchasedPasses,
    useSelectPass,
    usePaymentStatus,
} from '../../hooks/useBooth';
import { Loader2, CheckCircle2, Ticket, QrCode } from 'lucide-react';
import { toast } from 'sonner';
import type { PassDetails, PurchasedPass } from '../../types/booth';

type Step = 'VERIFY' | 'SELECT' | 'PAYMENT' | 'SUCCESS';

export default function PassBookingPage() {
    const [step, setStep] = useState<Step>('VERIFY');
    const [mobileNumber, setMobileNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [authId, setAuthId] = useState<string>('');
    const [deviceToken, setDeviceToken] = useState('');
    const [customerId, setCustomerId] = useState<string | null>(null);
    const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
    const [paymentUrl, setPaymentUrl] = useState<string | null>(null);

    // Purchase Selection State
    const [selectedPassForPurchase, setSelectedPassForPurchase] = useState<PassDetails | null>(null);
    const [bookingStartDate, setBookingStartDate] = useState<string>(new Date().toISOString().split('T')[0]);

    // Hooks
    const sendOtpMutation = useSendAuthOtp();
    const verifyOtpMutation = useVerifyAuthOtp();
    const selectPassMutation = useSelectPass();

    // Data Hooks
    const { data: availablePasses, isLoading: isLoadingPasses } = useAvailablePasses(customerId);
    const { data: purchasedPasses } = usePurchasedPasses(customerId);
    const { data: paymentStatus } = usePaymentStatus(customerId, paymentOrderId);

    // Clock for Active Pass UI
    const [currentTime, setCurrentTime] = useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    React.useEffect(() => {
        if (paymentStatus?.paymentFulfillmentStatus === 'FulfillmentSucceeded') {
            setStep('SUCCESS');
        }
    }, [paymentStatus]);

    const handleSendOtp = () => {
        if (mobileNumber.length !== 10) {
            toast.error('Please enter a valid 10-digit mobile number');
            return;
        }
        sendOtpMutation.mutate(
            {
                mobileCountryCode: '+91',
                mobileNumber: mobileNumber,
                otpChannel: 'SMS',
            },
            {
                onSuccess: (data) => {
                    toast.success('OTP sent successfully');
                    setAuthId(data.authId);
                    setDeviceToken(Math.random().toString(36).substring(7));
                },
                onError: (error) => {
                    toast.error(error.message);
                },
            }
        );
    };

    const handleVerifyOtp = () => {
        if (otp.length < 4) {
            toast.error('Please enter valid OTP');
            return;
        }
        if (!authId) {
            toast.error('Missing Auth ID. Please resend OTP.');
            return;
        }
        verifyOtpMutation.mutate(
            {
                authId: authId,
                data: {
                    deviceToken: deviceToken || 'dummy-token',
                    otp: otp,
                    whatsappNotificationEnroll: 'OPT_IN',
                },
            },
            {
                onSuccess: (data) => {
                    toast.success('Customer verified successfully');
                    setCustomerId(data.person.id);
                    setStep('SELECT');
                },
                onError: (error) => {
                    toast.error(error.message);
                },
            }
        );
    };

    const initiatePassPurchase = (pass: PassDetails) => {
        setSelectedPassForPurchase(pass);
        setBookingStartDate(new Date().toISOString().split('T')[0]); // Reset to today
    };

    const confirmPassPurchase = () => {
        if (!customerId || !selectedPassForPurchase) return;

        selectPassMutation.mutate(
            {
                customerId,
                passId: selectedPassForPurchase.id,
                data: {
                    startDay: bookingStartDate,
                },
            },
            {
                onSuccess: (data) => {
                    setPaymentOrderId(data.paymentOrder.order_id);
                    const iframeUrl = data.paymentOrder.payment_links.iframe || data.paymentOrder.payment_links.web;
                    setPaymentUrl(iframeUrl || null);
                    setSelectedPassForPurchase(null); // Close dialog
                    if (iframeUrl) {
                        setStep('PAYMENT');
                    } else {
                        toast.error('No payment link available');
                    }
                },
                onError: (error) => {
                    toast.error(error.message);
                },
            }
        );
    };

    const resetFlow = () => {
        setStep('VERIFY');
        setMobileNumber('');
        setOtp('');
        setAuthId('');
        setCustomerId(null);
        setPaymentOrderId(null);
        setPaymentUrl(null);
        setSelectedPassForPurchase(null);
    };

    // Helper for Active Pass UI
    const renderActivePass = (pass: PurchasedPass) => {
        const isDiamond = pass?.passEntity?.passDetails?.name.toLowerCase().includes('2000');

        // Gradient Styles
        const goldGradient = 'bg-gradient-to-b from-[#D4AF37] via-[#F7E7CE] to-[#AA6C39] border-[#C5A028]';
        const silverGradient = 'bg-gradient-to-b from-[#E0E0E0] via-[#F5F5F5] to-[#BDBDBD] border-[#A0A0A0] text-gray-800';

        const bgClass = isDiamond ? silverGradient : goldGradient;
        const textColor = isDiamond ? 'text-gray-900' : 'text-[#5C4018]';
        const borderColor = isDiamond ? 'border-gray-400' : 'border-[#C5A028]';

        return (
            <div key={pass.id} className={`relative w-[340px] h-[520px] rounded-[30px] p-6 shadow-2xl flex flex-col items-center justify-between border-4 ${bgClass} font-sans mx-auto transition-transform hover:scale-105 duration-300`}>
                {/* Header Section */}
                <div className="w-full flex justify-between items-start z-10">
                    <div className="bg-black/10 rounded-full p-2 backdrop-blur-sm">
                        <div className={`w-10 h-10 rounded-full border-2 ${borderColor} flex items-center justify-center font-bold text-xs ${textColor}`}>MTC</div>
                    </div>
                    <div className={`text-right ${textColor}`}>
                        <div className="text-xs font-bold tracking-widest opacity-80">PASS NO</div>
                        <div className="font-mono text-lg font-black tracking-wider">{pass.passNumber || '000000'}</div>
                    </div>
                </div>

                <div className={`text-center -mt-2 ${textColor}`}>
                    <p className="text-xs font-medium opacity-90 uppercase tracking-wide">{pass.passEntity?.passDetails?.name}</p>
                </div>

                {/* Main White Card Area */}
                <div className="relative bg-white rounded-[24px] w-full aspect-[3/4] p-4 flex flex-col items-center justify-center shadow-inner mt-2 mb-4 z-10">
                    {/* User Image */}
                    <Avatar className="w-24 h-24 rounded-xl border-4 border-gray-100 shadow-sm mb-3">
                        <AvatarImage src={pass.profilePicture || ''} alt="User" className="object-cover" />
                        <AvatarFallback className="rounded-xl bg-gray-200 text-gray-400 text-2xl">U</AvatarFallback>
                    </Avatar>

                    {/* Price */}
                    <div className="text-4xl font-black text-gray-800 mb-1">
                        ₹{pass.passEntity.passDetails.amount}
                    </div>

                    {/* Divider */}
                    <div className="w-3/4 h-px bg-gray-200 my-2"></div>

                    {/* Validity */}
                    <div className="text-center">
                        <p className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-0.5">Valid Till</p>
                        <p className="text-xl font-bold text-gray-900 uppercase">
                            {new Date(pass.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                </div>

                {/* Footer Section */}
                <div className="w-full flex justify-between items-end z-10 mt-auto">
                    {/* Time Ticker */}
                    <div className="bg-white rounded-lg px-2 py-1 shadow-sm">
                        <div className="text-[10px] text-gray-500 font-mono text-center leading-tight">
                            {currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}
                        </div>
                        <div className="text-sm font-mono font-bold text-gray-800 leading-tight">
                            {currentTime.toLocaleTimeString('en-GB', { hour12: false })}
                        </div>
                    </div>

                    {/* Gold/Silver Seal Effect */}
                    <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${isDiamond ? 'from-gray-100 to-gray-400' : 'from-yellow-200 to-yellow-600'} shadow-lg border-2 ${isDiamond ? 'border-gray-300' : 'border-yellow-400'} flex items-center justify-center -mb-2`}>
                        <span className={`text-[10px] font-black ${isDiamond ? 'text-gray-600' : 'text-yellow-900'} opacity-60`}>MTC</span>
                    </div>

                    {/* QR Code */}
                    <div className="bg-white p-1 rounded-lg shadow-sm">
                        <QrCode className="w-8 h-8 text-black" />
                    </div>
                </div>

                {/* Verified Stamp (Floating) */}
                <div className={`absolute top-1/4 right-0 transform translate-x-2 -translate-y-4 rotate-12 w-16 h-16 border-2 ${isDiamond ? 'border-gray-500 text-gray-500' : 'border-yellow-700 text-yellow-700'} rounded-full flex items-center justify-center opacity-30 z-0 pointer-events-none`}>
                    <span className="text-[8px] font-black uppercase tracking-widest border-t border-b border-current py-0.5">Verified</span>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-6 max-w-4xl min-h-screen">
            <h1 className="text-3xl font-bold mb-8">Agent Booth - Pass Booking</h1>

            {/* Steps Indicator */}
            <div className="flex justify-between mb-8 max-w-xl mx-auto">
                {['VERIFY', 'SELECT', 'PAYMENT', 'SUCCESS'].map((s, idx) => (
                    <div
                        key={s}
                        className={`flex items-center space-x-2 ${['VERIFY', 'SELECT', 'PAYMENT', 'SUCCESS'].indexOf(step) >= idx
                            ? 'text-primary font-semibold'
                            : 'text-muted-foreground'
                            }`}
                    >
                        <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${['VERIFY', 'SELECT', 'PAYMENT', 'SUCCESS'].indexOf(step) >= idx
                                ? 'border-primary bg-primary/10'
                                : 'border-muted'
                                }`}
                        >
                            {idx + 1}
                        </div>
                        <span className="text-sm">{s}</span>
                    </div>
                ))}
            </div>

            {/* Step 1: Verification */}
            {step === 'VERIFY' && (
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle>Customer Verification</CardTitle>
                        <CardDescription>Enter customer mobile number to verify</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Mobile Number</Label>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Enter 10 digit number"
                                    value={mobileNumber}
                                    onChange={(e) => setMobileNumber(e.target.value)}
                                    maxLength={10}
                                />
                                <Button
                                    onClick={handleSendOtp}
                                    disabled={sendOtpMutation.isPending || mobileNumber.length !== 10}
                                >
                                    {sendOtpMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Send OTP
                                </Button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>OTP</Label>
                            <Input
                                placeholder="Enter OTP"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value)}
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button
                            className="w-full"
                            onClick={handleVerifyOtp}
                            disabled={verifyOtpMutation.isPending || !otp}
                        >
                            {verifyOtpMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Verify & Proceed
                        </Button>
                    </CardFooter>
                </Card>
            )}

            {/* Step 2: Pass Selection */}
            {step === 'SELECT' && (
                <div className="space-y-12">
                    {/* Active Passes */}
                    {purchasedPasses && purchasedPasses.length > 0 && (
                        <div className="space-y-6">
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-green-600" /> Active Passes
                            </h2>
                            <div className="flex flex-wrap gap-8 justify-center pb-8 border-b">
                                {purchasedPasses.map((pass) => renderActivePass(pass))}
                            </div>
                        </div>
                    )}

                    {/* Available Passes */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">Available Passes</h2>
                        {isLoadingPasses ? (
                            <div className="flex justify-center p-8">
                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-6">
                                {availablePasses?.map((category) => (
                                    <div key={category.passCategory.id} className="space-y-4">
                                        <h3 className="text-lg font-medium text-muted-foreground">
                                            {category.passCategory.name}
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {category.passes.map((pass) => (
                                                <Card
                                                    key={pass.id}
                                                    className={`cursor-pointer transition-all hover:border-primary border-2 ${selectedPassForPurchase?.id === pass.id ? 'border-primary ring-2 ring-primary/20' : 'border-transparent'
                                                        } hover:shadow-lg`}
                                                    onClick={() => initiatePassPurchase(pass)}
                                                >
                                                    <CardHeader>
                                                        <CardTitle className="text-lg flex justify-between">
                                                            <span>{pass.name}</span>
                                                            <span className="text-primary font-bold">
                                                                ₹{pass.amount}
                                                            </span>
                                                        </CardTitle>
                                                        <CardDescription className="line-clamp-2">{pass.description}</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="space-y-2 text-sm">
                                                        <div className="flex justify-between border-b pb-2 border-dashed">
                                                            <span className="text-muted-foreground">Validity</span>
                                                            <span className="font-medium">
                                                                {pass.maxDays > 1000 ? 'Unlimited' : pass.maxDays} Days
                                                            </span>
                                                        </div>

                                                        {pass.offer && (
                                                            <div className="bg-green-100 text-green-800 p-2 rounded text-xs mt-2 font-medium text-center">
                                                                {pass.offer.offerTitle}
                                                            </div>
                                                        )}
                                                    </CardContent>
                                                    <CardFooter>
                                                        <Button
                                                            className="w-full"
                                                            variant="outline"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                initiatePassPurchase(pass);
                                                            }}
                                                        >
                                                            Select
                                                        </Button>
                                                    </CardFooter>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Date Selection Dialog */}
            <Dialog open={!!selectedPassForPurchase} onOpenChange={(open) => !open && setSelectedPassForPurchase(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Pass Purchase</DialogTitle>
                        <DialogDescription>
                            Select start date for the pass.
                        </DialogDescription>
                    </DialogHeader>
                    {selectedPassForPurchase && (
                        <div className="space-y-4 py-4">
                            <div className="bg-muted p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="font-semibold">{selectedPassForPurchase.name}</p>
                                    <p className="text-sm text-muted-foreground">{selectedPassForPurchase.maxDays > 1000 ? 'Unlimited' : selectedPassForPurchase.maxDays} Days Validity</p>
                                </div>
                                <div className="text-xl font-bold">₹{selectedPassForPurchase.amount}</div>
                            </div>

                            <div className="space-y-2">
                                <Label>Start Date</Label>
                                <Input
                                    type="date"
                                    value={bookingStartDate}
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setBookingStartDate(e.target.value)}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedPassForPurchase(null)}>Cancel</Button>
                        <Button onClick={confirmPassPurchase} disabled={selectPassMutation.isPending}>
                            {selectPassMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Proceed to Pay
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Step 3: Payment */}
            {step === 'PAYMENT' && paymentUrl && (
                <div className="space-y-6">
                    <Card className="max-w-3xl mx-auto h-[600px] flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Complete Payment</CardTitle>
                            <div className="flex items-center gap-2">
                                {paymentStatus?.status === 'PENDING' || paymentStatus?.status === 'NEW' ? (
                                    <span className="flex items-center text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full text-sm">
                                        <Loader2 className="w-3 h-3 mr-2 animate-spin" /> Waiting for payment...
                                    </span>
                                ) : (
                                    <span className="text-sm font-medium">Status: {paymentStatus?.status}</span>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 overflow-hidden">
                            <iframe
                                src={paymentUrl}
                                className="w-full h-full border-0"
                                title="Payment Page"
                            />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Step 4: Success */}
            {step === 'SUCCESS' && (
                <Card className="max-w-md mx-auto text-center py-12">
                    <CardContent className="space-y-6">
                        <div className="flex justify-center">
                            <CheckCircle2 className="w-20 h-20 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <CardTitle className="text-2xl">Payment Successful!</CardTitle>
                            <CardDescription>
                                The pass has been successfully activated for the customer.
                                <br />
                                A confirmation message has been sent to their phone. Please check.
                            </CardDescription>
                        </div>
                        <Button onClick={resetFlow} className="w-full">
                            Process Another Booking
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
