import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  useBapLogin, 
  useBppLogin, 
  useFleetRequestOtp, 
  useFleetVerifyOtp,
  MODULE_INFO, 
  FLEET_MERCHANTS, 
  FLEET_CITIES 
} from '../../hooks/useAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  Users, 
  Car, 
  Truck, 
  Phone, 
  KeyRound,
  Eye,
  EyeOff,
  Mail,
  Lock
} from 'lucide-react';
import type { LoginModule, FleetConfig } from '../../types';
import { cn } from '../../lib/utils';

type LoginStep = 'module-select' | 'fleet-config' | 'credentials' | 'otp-verify';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();

  // Redirect to dashboard when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  // Mutations for different login types
  const bapLoginMutation = useBapLogin();
  const bppLoginMutation = useBppLogin();
  const fleetRequestOtpMutation = useFleetRequestOtp();
  const fleetVerifyOtpMutation = useFleetVerifyOtp();
  
  // State
  const [step, setStep] = useState<LoginStep>('module-select');
  const [selectedModule, setSelectedModule] = useState<LoginModule | null>(null);
  const [fleetConfig, setFleetConfig] = useState<FleetConfig>({ merchantId: '', city: '' });
  
  // Password login state (BAP/BPP)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // OTP login state (Fleet)
  const [mobileNumber, setMobileNumber] = useState('');
  const [mobileCountryCode, setMobileCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  
  const [error, setError] = useState('');

  // Module selection handler
  const handleModuleSelect = (module: LoginModule) => {
    setSelectedModule(module);
    setError('');
    
    if (module === 'FLEET') {
      setStep('fleet-config');
    } else {
      setStep('credentials');
    }
  };

  // Fleet config handler
  const handleFleetConfigSubmit = () => {
    if (!fleetConfig.merchantId || !fleetConfig.city) {
      setError('Please select both merchant and city');
      return;
    }
    setError('');
    setStep('credentials');
  };

  // Handle password-based login (BAP/BPP)
  const handlePasswordLogin = async () => {
    if (!email || !password) {
      setError('Please enter email and password');
      return;
    }

    setError('');
    
    try {
      let result;
      
      if (selectedModule === 'BAP') {
        result = await bapLoginMutation.mutateAsync({ email, password });
      } else if (selectedModule === 'BPP') {
        result = await bppLoginMutation.mutateAsync({ email, password });
      } else {
        throw new Error('Invalid module for password login');
      }
      
      console.log('Login API result:', result);
      
      // Login will trigger useEffect to navigate
      // Don't await - let profile fetch happen in background
      login(result.token, result.user, selectedModule!);
    } catch (err: any) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error ||
                          err.message ||
                          'Invalid credentials. Please try again.';
      setError(errorMessage);
    }
  };

  // Request OTP handler (Fleet)
  const handleRequestOtp = async () => {
    if (!mobileNumber || mobileNumber.length < 10) {
      setError('Please enter a valid mobile number');
      return;
    }

    setError('');
    
    try {
      await fleetRequestOtpMutation.mutateAsync({
        fleetConfig,
        data: { mobileNumber, mobileCountryCode },
      });
      setStep('otp-verify');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    }
  };

  // Verify OTP handler (Fleet)
  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setError('Please enter a valid OTP');
      return;
    }

    setError('');
    
    try {
      const result = await fleetVerifyOtpMutation.mutateAsync({
        fleetConfig,
        data: { mobileNumber, mobileCountryCode, otp },
      });
      
      // Login will trigger useEffect to navigate
      login(result.token, result.user, 'FLEET', fleetConfig);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    }
  };

  // Go back handler
  const handleBack = () => {
    setError('');
    switch (step) {
      case 'fleet-config':
        setStep('module-select');
        setSelectedModule(null);
        break;
      case 'credentials':
        if (selectedModule === 'FLEET') {
          setStep('fleet-config');
        } else {
          setStep('module-select');
          setSelectedModule(null);
        }
        break;
      case 'otp-verify':
        setStep('credentials');
        setOtp('');
        break;
    }
  };

  // Resend OTP handler
  const handleResendOtp = async () => {
    setError('');
    try {
      await fleetRequestOtpMutation.mutateAsync({
        fleetConfig,
        data: { mobileNumber, mobileCountryCode },
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to resend OTP.');
    }
  };

  const moduleIcons: Record<LoginModule, React.ReactNode> = {
    BAP: <Users className="h-8 w-8" />,
    BPP: <Car className="h-8 w-8" />,
    FLEET: <Truck className="h-8 w-8" />,
  };

  const isLoading = 
    bapLoginMutation.isPending || 
    bppLoginMutation.isPending || 
    fleetRequestOtpMutation.isPending || 
    fleetVerifyOtpMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMyMDI1MmIiIGZpbGwtb3BhY2l0eT0iMC40Ij48cGF0aCBkPSJNMzYgMzRoLTJ2LTRoMnY0em0wLTZ2LTRoLTJ2NGgyek0zMCAzNGgtMnYtNGgydjR6bTAtNnYtNGgtMnY0aDJ6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
      
      {/* Animated gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full filter blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      <Card className="w-full max-w-lg relative z-10 shadow-2xl border-slate-700 bg-slate-900/95 backdrop-blur-xl">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <span className="text-white font-bold text-2xl">M</span>
          </div>
          <div>
            <CardTitle className="text-2xl text-white font-semibold tracking-tight">
              Moving Control Center
            </CardTitle>
            <CardDescription className="text-slate-400 mt-1">
              {step === 'module-select' && 'Select your dashboard to continue'}
              {step === 'fleet-config' && 'Configure your fleet access'}
              {step === 'credentials' && (selectedModule === 'FLEET' ? 'Enter your mobile number' : 'Enter your credentials')}
              {step === 'otp-verify' && 'Verify your identity'}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-3 text-sm text-red-400 bg-red-900/20 border border-red-800/50 rounded-lg animate-shake">
              {error}
            </div>
          )}

          {/* Step 1: Module Selection */}
          {step === 'module-select' && (
            <div className="space-y-4">
              {(Object.keys(MODULE_INFO) as LoginModule[]).map((module) => (
                <button
                  key={module}
                  onClick={() => handleModuleSelect(module)}
                  className={cn(
                    "w-full p-4 rounded-xl border transition-all duration-300",
                    "flex items-center gap-4 text-left group",
                    "hover:scale-[1.02] hover:shadow-lg",
                    "bg-slate-800/50 border-slate-700 hover:border-slate-600",
                    "hover:bg-gradient-to-r hover:from-slate-800 hover:to-slate-700/50"
                  )}
                >
                  <div className={cn(
                    "w-14 h-14 rounded-xl flex items-center justify-center text-white",
                    "bg-gradient-to-br",
                    MODULE_INFO[module].color,
                    "shadow-lg group-hover:scale-110 transition-transform"
                  )}>
                    {moduleIcons[module]}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-lg">
                      {MODULE_INFO[module].name}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {MODULE_INFO[module].description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          )}

          {/* Step 2: Fleet Configuration (only for FLEET module) */}
          {step === 'fleet-config' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                <Truck className="h-5 w-5 text-purple-400" />
                <span className="text-purple-200 text-sm">Fleet Dashboard Access</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">Merchant</label>
                  <Select
                    value={fleetConfig.merchantId}
                    onValueChange={(value) => setFleetConfig({ merchantId: value, city: '' })}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue placeholder="Select merchant" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {FLEET_MERCHANTS.map((merchant) => (
                        <SelectItem 
                          key={merchant.id} 
                          value={merchant.id}
                          className="text-white hover:bg-slate-700"
                        >
                          {merchant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-300">City</label>
                  <Select
                    value={fleetConfig.city}
                    onValueChange={(value) => setFleetConfig({ ...fleetConfig, city: value })}
                    disabled={!fleetConfig.merchantId}
                  >
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white disabled:opacity-50">
                      <SelectValue placeholder="Select city" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {fleetConfig.merchantId && FLEET_CITIES[fleetConfig.merchantId]?.map((city) => (
                        <SelectItem 
                          key={city.id} 
                          value={city.id}
                          className="text-white hover:bg-slate-700"
                        >
                          {city.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleFleetConfigSubmit}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Credentials Input */}
          {step === 'credentials' && (
            <div className="space-y-4">
              {selectedModule && (
                <div className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border",
                  selectedModule === 'BAP' && "bg-blue-500/10 border-blue-500/20",
                  selectedModule === 'BPP' && "bg-green-500/10 border-green-500/20",
                  selectedModule === 'FLEET' && "bg-purple-500/10 border-purple-500/20",
                )}>
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                    "bg-gradient-to-br",
                    MODULE_INFO[selectedModule].color
                  )}>
                    {moduleIcons[selectedModule]}
                  </div>
                  <span className="text-slate-300 text-sm">
                    {MODULE_INFO[selectedModule].name}
                    {selectedModule === 'FLEET' && fleetConfig.city && (
                      <span className="text-slate-500"> • {fleetConfig.city}</span>
                    )}
                  </span>
                </div>
              )}

              {/* Password Login for BAP/BPP */}
              {(selectedModule === 'BAP' || selectedModule === 'BPP') && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@moving.tech"
                      className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Password
                    </label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handlePasswordLogin}
                      disabled={isLoading || !email || !password}
                      className={cn(
                        "flex-1 text-white",
                        selectedModule === 'BAP' && "bg-blue-600 hover:bg-blue-700",
                        selectedModule === 'BPP' && "bg-green-600 hover:bg-green-700",
                      )}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Signing in...
                        </>
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </div>
                </>
              )}

              {/* OTP Login for Fleet */}
              {selectedModule === 'FLEET' && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Mobile Number
                    </label>
                    <div className="flex gap-2">
                      <Select value={mobileCountryCode} onValueChange={setMobileCountryCode}>
                        <SelectTrigger className="w-24 bg-slate-800 border-slate-700 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          <SelectItem value="+91" className="text-white">+91</SelectItem>
                          <SelectItem value="+1" className="text-white">+1</SelectItem>
                          <SelectItem value="+44" className="text-white">+44</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="tel"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        placeholder="Enter 10-digit number"
                        maxLength={10}
                        className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 text-lg tracking-wider"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back
                    </Button>
                    <Button
                      onClick={handleRequestOtp}
                      disabled={isLoading || mobileNumber.length < 10}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          Get OTP
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: OTP Verification (Fleet only) */}
          {step === 'otp-verify' && (
            <div className="space-y-4">
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                  <KeyRound className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-400 text-sm">
                  We've sent a verification code to
                </p>
                <p className="text-white font-medium">
                  {mobileCountryCode} {mobileNumber}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Enter OTP</label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 focus:border-purple-500 text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                />
              </div>

              <div className="text-center">
                <button
                  onClick={handleResendOtp}
                  disabled={isLoading}
                  className="text-sm text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Didn't receive code? <span className="text-purple-400 hover:text-purple-300">Resend OTP</span>
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
                <Button
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length < 4}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Login'
                  )}
                </Button>
              </div>
            </div>
          )}

          <div className="pt-4 text-center text-sm text-slate-500 border-t border-slate-800">
            <p>Contact your administrator for access credentials</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
