import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { MODULE_INFO, VISIBLE_MODULES, useBapLogin, useBppLogin } from '../../hooks/useAuth';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../ui/popover';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { cn } from '../../lib/utils';
import {
    Users,
    Car,
    ChevronDown,
    Check,
    Lock,
    Loader2,
    Mail,
    Eye,
    EyeOff,
} from 'lucide-react';
import type { LoginModule } from '../../types';

const moduleIcons: Record<LoginModule, React.ReactNode> = {
    BAP: <Users className="h-4 w-4" />,
    BPP: <Car className="h-4 w-4" />,
    FLEET: <Car className="h-4 w-4" />, // Not used but needed for type
};

export function ModuleSwitcher() {
    const navigate = useNavigate();
    const {
        loginModule,
        login,
        switchToModule,
        isModuleAuthenticated,
    } = useAuth();

    const bapLoginMutation = useBapLogin();
    const bppLoginMutation = useBppLogin();

    const [isOpen, setIsOpen] = useState(false);
    const [loginDialogModule, setLoginDialogModule] = useState<LoginModule | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const isLoading = bapLoginMutation.isPending || bppLoginMutation.isPending;

    const handleModuleClick = useCallback(async (module: LoginModule) => {
        if (module === loginModule) {
            // Already on this module
            setIsOpen(false);
            return;
        }

        // Try to switch to the module
        const switched = await switchToModule(module);
        if (switched) {
            setIsOpen(false);
            // Navigate to dashboard to reset state
            navigate('/dashboard');
        } else {
            // Not authenticated for this module, show login dialog
            setLoginDialogModule(module);
            setEmail('');
            setPassword('');
            setError('');
            setIsOpen(false);
        }
    }, [loginModule, switchToModule, navigate]);

    const handleLogin = async () => {
        if (!loginDialogModule || !email || !password) {
            setError('Please enter email and password');
            return;
        }

        setError('');

        try {
            let result;

            if (loginDialogModule === 'BAP') {
                result = await bapLoginMutation.mutateAsync({ email, password });
            } else if (loginDialogModule === 'BPP') {
                result = await bppLoginMutation.mutateAsync({ email, password });
            } else {
                throw new Error('Invalid module');
            }

            // Login and switch to this module
            await login(result.token, result.user, loginDialogModule);
            setLoginDialogModule(null);
            navigate('/dashboard');
        } catch (err: any) {
            const errorMessage = err.response?.data?.message ||
                err.response?.data?.error ||
                err.message ||
                'Invalid credentials. Please try again.';
            setError(errorMessage);
        }
    };

    if (!loginModule) {
        return null;
    }

    const currentModuleInfo = MODULE_INFO[loginModule];

    return (
        <>
            <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                    <button
                        className={cn(
                            "flex items-center gap-2 w-full px-2 py-1.5 rounded-lg transition-colors",
                            "hover:bg-sidebar-accent/50 text-left"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                            "bg-gradient-to-br",
                            currentModuleInfo.color
                        )}>
                            {moduleIcons[loginModule]}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-sidebar-foreground truncate">
                                {currentModuleInfo.name.replace(' Dashboard', '')}
                            </p>
                            <p className="text-xs text-sidebar-foreground/60 truncate">
                                Dashboard
                            </p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-sidebar-foreground/60 flex-shrink-0" />
                    </button>
                </PopoverTrigger>
                <PopoverContent
                    align="start"
                    side="bottom"
                    className="w-56 p-1 bg-popover border-border"
                >
                    <div className="text-xs text-muted-foreground px-2 py-1.5">
                        Switch Dashboard
                    </div>
                    {VISIBLE_MODULES.map((module) => {
                        const moduleInfo = MODULE_INFO[module];
                        const isActive = module === loginModule;
                        const isAuthenticated = isModuleAuthenticated(module);

                        return (
                            <button
                                key={module}
                                onClick={() => handleModuleClick(module)}
                                className={cn(
                                    "flex items-center gap-3 w-full px-2 py-2 rounded-md transition-colors",
                                    "hover:bg-accent text-left",
                                    isActive && "bg-accent"
                                )}
                            >
                                <div className={cn(
                                    "w-7 h-7 rounded-md flex items-center justify-center text-white",
                                    "bg-gradient-to-br",
                                    moduleInfo.color
                                )}>
                                    {moduleIcons[module]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">
                                        {moduleInfo.name.replace(' Dashboard', '')}
                                    </p>
                                </div>
                                {isActive ? (
                                    <Check className="h-4 w-4 text-primary" />
                                ) : !isAuthenticated ? (
                                    <Lock className="h-3 w-3 text-muted-foreground" />
                                ) : null}
                            </button>
                        );
                    })}
                </PopoverContent>
            </Popover>

            {/* Login Dialog for switching to unauthenticated module */}
            <Dialog open={!!loginDialogModule} onOpenChange={(open) => !open && setLoginDialogModule(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            {loginDialogModule && (
                                <>
                                    <div className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center text-white",
                                        "bg-gradient-to-br",
                                        MODULE_INFO[loginDialogModule].color
                                    )}>
                                        {moduleIcons[loginDialogModule]}
                                    </div>
                                    <span>Login to {MODULE_INFO[loginDialogModule].name}</span>
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            Enter your credentials to access this dashboard.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-4">
                        {error && (
                            <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                Email
                            </label>
                            <Input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email"
                                autoFocus
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Lock className="h-4 w-4" />
                                Password
                            </label>
                            <div className="relative">
                                <Input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter your password"
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setLoginDialogModule(null)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleLogin}
                                disabled={isLoading || !email || !password}
                                className={cn(
                                    "flex-1 text-white",
                                    loginDialogModule === 'BAP' && "bg-blue-600 hover:bg-blue-700",
                                    loginDialogModule === 'BPP' && "bg-green-600 hover:bg-green-700",
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
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
