import { useState, useEffect } from 'react';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '../../components/ui/collapsible';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import {
    useDomains,
    useLogicRollout,
    useUpsertLogicRollout,
    useTimeBounds,
    useCreateTimeBounds,
    useDeleteTimeBounds,
    useLogicVersions,
    useVerifyDynamicLogic,
} from '../../hooks/useDynamicLogic';
import type {
    LogicDomain,
    LogicRolloutEntry,
    RolloutItem,
    WeekDay,
    WeekdaySchedule,
} from '../../services/dynamicLogic';
import { getDynamicLogic } from '../../services/dynamicLogic';
import {
    Clock,
    GitBranch,
    Settings2,
    Plus,
    Save,
    Trash2,
    Play,
    Loader2,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Lock,
    LogIn,
    ChevronDown,
    ChevronRight,
    X,
    Eye,
    Copy,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ============================================
// Rollout Section
// ============================================
function RolloutSection({ domain }: { domain: LogicDomain }) {
    const { data: rolloutData, isLoading } = useLogicRollout(domain);
    const upsertMutation = useUpsertLogicRollout();
    const [editableRollout, setEditableRollout] = useState<RolloutItem[]>([]);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        if (rolloutData?.[0]?.rollout) {
            setEditableRollout(rolloutData[0].rollout);
        }
    }, [rolloutData]);

    const handlePercentageChange = (index: number, value: number) => {
        const updated = [...editableRollout];
        updated[index].rolloutPercentage = Math.min(100, Math.max(0, value));
        setEditableRollout(updated);
    };

    const handleVersionChange = (index: number, value: number) => {
        const updated = [...editableRollout];
        updated[index].version = value;
        setEditableRollout(updated);
    };

    const handleDescriptionChange = (index: number, value: string) => {
        const updated = [...editableRollout];
        updated[index].versionDescription = value;
        setEditableRollout(updated);
    };

    const handleAddRow = () => {
        setEditableRollout([
            ...editableRollout,
            { version: 1, rolloutPercentage: 0, versionDescription: '' }
        ]);
    };

    const handleRemoveRow = (index: number) => {
        setEditableRollout(editableRollout.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (!rolloutData?.[0]) return;

        const updatedEntry: LogicRolloutEntry = {
            ...rolloutData[0],
            rollout: editableRollout,
        };

        try {
            await upsertMutation.mutateAsync([updatedEntry]);
            setResult({ success: true, message: 'Rollout updated successfully!' });
        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Failed to update rollout' });
        }
    };

    if (isLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (!rolloutData?.length) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                No rollout data found for this domain
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {result && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${result.success ? 'bg-green-50 dark:bg-green-950/30 text-green-700' : 'bg-red-50 dark:bg-red-950/30 text-red-700'
                    }`}>
                    {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {result.message}
                    <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setResult(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-24">Version</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-28">Rollout %</TableHead>
                        <TableHead className="w-16">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {editableRollout.map((item, idx) => (
                        <TableRow key={idx}>
                            <TableCell>
                                <Input
                                    type="number"
                                    min={1}
                                    value={item.version}
                                    onChange={e => handleVersionChange(idx, parseInt(e.target.value) || 1)}
                                    className="w-20"
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    value={item.versionDescription}
                                    onChange={e => handleDescriptionChange(idx, e.target.value)}
                                    placeholder="Version description"
                                />
                            </TableCell>
                            <TableCell>
                                <Input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={item.rolloutPercentage}
                                    onChange={e => handlePercentageChange(idx, parseInt(e.target.value) || 0)}
                                    className="w-20"
                                />
                            </TableCell>
                            <TableCell>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveRow(idx)}
                                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>

            <div className="flex justify-between">
                <Button variant="outline" onClick={handleAddRow}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                </Button>
                <Button onClick={handleSave} disabled={upsertMutation.isPending}>
                    {upsertMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Save Changes
                </Button>
            </div>
        </div>
    );
}

// ============================================
// Time Bounds Section
// ============================================
function TimeBoundsSection({ domain }: { domain: LogicDomain }) {
    const { data: timeBoundsData, isLoading } = useTimeBounds(domain);
    const createMutation = useCreateTimeBounds();
    const deleteMutation = useDeleteTimeBounds();

    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [schedule, setSchedule] = useState<WeekdaySchedule>({
        monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: []
    });
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const weekdays: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    const addTimeSlot = (day: WeekDay) => {
        setSchedule({
            ...schedule,
            [day]: [...schedule[day], ['09:00', '18:00']],
        });
    };

    const removeTimeSlot = (day: WeekDay, index: number) => {
        setSchedule({
            ...schedule,
            [day]: schedule[day].filter((_, i) => i !== index),
        });
    };

    const updateTimeSlot = (day: WeekDay, index: number, start: string, end: string) => {
        const updated = [...schedule[day]];
        updated[index] = [start, end];
        setSchedule({ ...schedule, [day]: updated });
    };

    const handleCreate = async () => {
        if (!newName) return;

        try {
            await createMutation.mutateAsync({
                name: newName,
                timeBoundDomain: domain,
                timeBounds: { contents: schedule, tag: 'BoundedByWeekday' },
            });
            setNewName('');
            setSchedule({ monday: [], tuesday: [], wednesday: [], thursday: [], friday: [], saturday: [], sunday: [] });
            setShowCreateForm(false);
            setResult({ success: true, message: 'Time bound created!' });
        } catch (error: any) {
            setResult({ success: false, message: error.message });
        }
    };

    const handleDelete = async (name: string) => {
        try {
            await deleteMutation.mutateAsync({ domain, name });
            setResult({ success: true, message: 'Time bound deleted!' });
        } catch (error: any) {
            setResult({ success: false, message: error.message });
        }
    };

    if (isLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    return (
        <div className="space-y-4">
            {result && (
                <div className={`p-3 rounded-lg flex items-center gap-2 ${result.success ? 'bg-green-50 dark:bg-green-950/30 text-green-700' : 'bg-red-50 dark:bg-red-950/30 text-red-700'
                    }`}>
                    {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                    {result.message}
                    <Button variant="ghost" size="sm" className="ml-auto h-6 w-6 p-0" onClick={() => setResult(null)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {/* Existing Time Bounds */}
            {timeBoundsData?.map(tb => (
                <Card key={tb.name} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{tb.name}</h4>
                        <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(tb.name)}
                            disabled={deleteMutation.isPending}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="grid grid-cols-7 gap-2 text-xs">
                        {weekdays.map(day => (
                            <div key={day} className="text-center">
                                <div className="font-medium capitalize mb-1">{day.slice(0, 3)}</div>
                                {tb.timeBounds.contents[day]?.length > 0 ? (
                                    tb.timeBounds.contents[day].map((slot, i) => (
                                        <Badge key={i} variant="secondary" className="text-xs mb-1 block">
                                            {slot[0]}-{slot[1]}
                                        </Badge>
                                    ))
                                ) : (
                                    <span className="text-muted-foreground">-</span>
                                )}
                            </div>
                        ))}
                    </div>
                </Card>
            ))}

            {/* Create Form */}
            {showCreateForm ? (
                <Card className="p-4">
                    <h4 className="font-semibold mb-4">New Time Bound</h4>
                    <div className="space-y-4">
                        <Input
                            placeholder="Name"
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                        />
                        <div className="space-y-2">
                            {weekdays.map(day => (
                                <div key={day} className="flex items-center gap-2">
                                    <div className="w-20 font-medium capitalize">{day}</div>
                                    <div className="flex-1 flex flex-wrap gap-2">
                                        {schedule[day].map((slot, i) => (
                                            <div key={i} className="flex items-center gap-1 bg-muted p-1 rounded">
                                                <Input
                                                    type="time"
                                                    value={slot[0]}
                                                    onChange={e => updateTimeSlot(day, i, e.target.value, slot[1])}
                                                    className="w-24 h-7"
                                                />
                                                <span>-</span>
                                                <Input
                                                    type="time"
                                                    value={slot[1]}
                                                    onChange={e => updateTimeSlot(day, i, slot[0], e.target.value)}
                                                    className="w-24 h-7"
                                                />
                                                <Button size="sm" variant="ghost" onClick={() => removeTimeSlot(day, i)}>
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                        <Button size="sm" variant="outline" onClick={() => addTimeSlot(day)}>
                                            <Plus className="h-3 w-3" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreate} disabled={createMutation.isPending || !newName}>
                                {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                Create
                            </Button>
                            <Button variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                        </div>
                    </div>
                </Card>
            ) : (
                <Button variant="outline" onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" /> Add Time Bound
                </Button>
            )}
        </div>
    );
}

// ============================================
// Versions Section
// ============================================
function VersionsSection({ domain }: { domain: LogicDomain }) {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();
    const { data: versions, isLoading } = useLogicVersions(domain, 20, 0);
    const verifyMutation = useVerifyDynamicLogic();

    const [rules, setRules] = useState('[\n  ""\n]');
    const [inputData, setInputData] = useState('[\n  ""\n]');
    const [description, setDescription] = useState('');
    const [password, setPassword] = useState('');
    const [verifyResult, setVerifyResult] = useState<any>(null);
    const [resultExpanded, setResultExpanded] = useState(false);

    // View logic state
    const [viewingVersion, setViewingVersion] = useState<number | null>(null);
    const [viewingLogic, setViewingLogic] = useState<any>(null);
    const [loadingLogic, setLoadingLogic] = useState(false);


    const handleVerify = async (shouldCreate: boolean) => {
        try {
            const parsedRules = JSON.parse(rules);
            const parsedInputData = JSON.parse(inputData);

            const result = await verifyMutation.mutateAsync({
                domain: domain,
                description,
                rules: parsedRules,
                inputData: parsedInputData,
                shouldUpdateRule: shouldCreate,
                updatePassword: shouldCreate ? password : undefined,
                verifyOutput: true,
            });

            setVerifyResult(result);
            setResultExpanded(true);
        } catch (error: any) {
            setVerifyResult({ errors: [error.message || 'Invalid JSON'] });
        }
    };

    const handleViewLogic = async (version: number) => {
        if (viewingVersion === version) {
            // Toggle off
            setViewingVersion(null);
            setViewingLogic(null);
            return;
        }

        setLoadingLogic(true);
        setViewingVersion(version);
        try {
            // Use the getDynamicLogic service to fetch the logic for this version
            const logicData = await getDynamicLogic(
                merchantShortId || merchantId || '',
                cityId || '',
                domain,
                version
            );
            setViewingLogic(logicData);
        } catch (error) {
            setViewingLogic({ error: 'Failed to load logic' });
        } finally {
            setLoadingLogic(false);
        }
    };

    if (isLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    return (
        <div className="space-y-6">
            {/* Existing Versions */}
            <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <GitBranch className="h-4 w-4" />
                    Existing Versions
                </h4>
                {versions?.length ? (
                    <div className="grid gap-2">
                        {versions.map(v => (
                            <Collapsible
                                key={v.version}
                                open={viewingVersion === v.version}
                                onOpenChange={() => handleViewLogic(v.version)}
                            >
                                <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                                    <Badge variant="outline" className="font-mono">v{v.version}</Badge>
                                    <span className="text-sm flex-1">{v.description || 'No description'}</span>
                                    <CollapsibleTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            {loadingLogic && viewingVersion === v.version ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : viewingVersion === v.version ? (
                                                <ChevronDown className="h-4 w-4" />
                                            ) : (
                                                <Eye className="h-4 w-4" />
                                            )}
                                            <span className="ml-1">View</span>
                                        </Button>
                                    </CollapsibleTrigger>
                                </div>
                                <CollapsibleContent className="mt-2">
                                    <div className="p-4 bg-muted/20 rounded-lg border">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm text-muted-foreground">
                                                Logic Rules:
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    const logics = viewingLogic?.[0]?.logics || viewingLogic?.logics || [];
                                                    navigator.clipboard.writeText(JSON.stringify(logics, null, 2));
                                                }}
                                                className="h-7 px-2"
                                            >
                                                <Copy className="h-4 w-4 mr-1" />
                                                Copy
                                            </Button>
                                        </div>
                                        <pre className="text-xs font-mono bg-muted/30 p-3 rounded overflow-x-auto max-h-64 overflow-y-auto">
                                            {viewingLogic
                                                ? JSON.stringify(viewingLogic?.[0]?.logics || viewingLogic?.logics || [], null, 2)
                                                : 'Loading...'}
                                        </pre>
                                    </div>
                                </CollapsibleContent>
                            </Collapsible>
                        ))}
                    </div>
                ) : (
                    <p className="text-muted-foreground">No versions found</p>
                )}
            </div>

            {/* Create/Verify Form */}
            <div className="border-t pt-6">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Verify / Create New Version
                </h4>

                <div className="grid md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Rules (JSON Array)</label>
                        <textarea
                            className="w-full h-40 p-3 rounded-lg border bg-muted/50 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            value={rules}
                            onChange={e => setRules(e.target.value)}
                            spellCheck={false}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Input Data (JSON Array)</label>
                        <textarea
                            className="w-full h-40 p-3 rounded-lg border bg-muted/50 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            value={inputData}
                            onChange={e => setInputData(e.target.value)}
                            spellCheck={false}
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mt-4">
                    <Input
                        placeholder="Description"
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                    <Input
                        type="password"
                        placeholder="Password (required to create)"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>

                <div className="flex gap-2 mt-4">
                    <Button
                        variant="outline"
                        onClick={() => handleVerify(false)}
                        disabled={verifyMutation.isPending}
                    >
                        {verifyMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Play className="h-4 w-4 mr-2" />}
                        Verify Only
                    </Button>
                    <Button
                        onClick={() => handleVerify(true)}
                        disabled={verifyMutation.isPending || !password}
                    >
                        {verifyMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                        Create Version
                    </Button>
                </div>

                {/* Result */}
                {verifyResult && (
                    <Collapsible open={resultExpanded} onOpenChange={setResultExpanded} className="mt-4">
                        <CollapsibleTrigger className="flex items-center gap-2 p-3 w-full bg-muted/50 rounded-lg hover:bg-muted">
                            {resultExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            <Eye className="h-4 w-4" />
                            <span className="font-medium">Result</span>
                            {verifyResult.isRuleUpdated && (
                                <Badge variant="default" className="ml-2">Created v{verifyResult.version}</Badge>
                            )}
                            {verifyResult.errors?.length > 0 && (
                                <Badge variant="destructive" className="ml-2">Errors</Badge>
                            )}
                        </CollapsibleTrigger>
                        <CollapsibleContent className="mt-2">
                            <pre className="p-4 bg-muted/30 rounded-lg text-sm font-mono overflow-x-auto max-h-64">
                                {JSON.stringify(verifyResult, null, 2)}
                            </pre>
                        </CollapsibleContent>
                    </Collapsible>
                )}
            </div>
        </div>
    );
}

// ============================================
// Main DynamicLogicPage Component
// ============================================
export function DynamicLogicPage() {
    const { merchantId, cityId } = useDashboardContext();
    const { loginModule, logout } = useAuth();
    const navigate = useNavigate();

    const { data: domains, isLoading: domainsLoading } = useDomains();
    const [selectedDomain, setSelectedDomain] = useState<LogicDomain | null>(null);

    const hasAccess = loginModule === 'BAP';

    // Auto-select first domain
    useEffect(() => {
        if (domains?.length && !selectedDomain) {
            setSelectedDomain(domains[0]);
        }
    }, [domains, selectedDomain]);

    if (!hasAccess) {
        return (
            <Page>
                <PageHeader
                    title="Dynamic Logic"
                    breadcrumbs={[{ label: 'Config', href: '/config' }, { label: 'Dynamic Logic' }]}
                />
                <PageContent>
                    <Card className="max-w-lg mx-auto">
                        <CardContent className="p-12 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                                <Lock className="h-8 w-8 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-semibold">Customer Login Required</h3>
                            <p className="text-muted-foreground">
                                Dynamic Logic management requires <strong>Customer (BAP)</strong> login.
                            </p>
                            <Button onClick={() => { logout(); navigate('/login'); }} className="mt-4">
                                <LogIn className="h-4 w-4 mr-2" />
                                Switch Login
                            </Button>
                        </CardContent>
                    </Card>
                </PageContent>
            </Page>
        );
    }

    if (!merchantId || !cityId) {
        return (
            <Page>
                <PageHeader title="Dynamic Logic" />
                <PageContent>
                    <Card>
                        <CardContent className="p-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                Please select a merchant and city to manage Dynamic Logic.
                            </p>
                        </CardContent>
                    </Card>
                </PageContent>
            </Page>
        );
    }

    return (
        <Page>
            <PageHeader
                title="Dynamic Logic"
                description="Manage domain logic rollouts, time bounds, and versioned rules"
                breadcrumbs={[{ label: 'Config', href: '/config' }, { label: 'Dynamic Logic' }]}
            />
            <PageContent>
                {/* Domain Selector */}
                <Card className="mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                            <label className="font-medium">Domain:</label>
                            {domainsLoading ? (
                                <Skeleton className="h-10 w-48" />
                            ) : (
                                <Select
                                    value={selectedDomain ? JSON.stringify(selectedDomain) : ''}
                                    onValueChange={(val) => setSelectedDomain(JSON.parse(val))}
                                >
                                    <SelectTrigger className="w-64">
                                        <SelectValue placeholder="Select domain" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {domains?.map(d => {
                                            const value = JSON.stringify(d);
                                            const label = d.contents ? `${d.tag} - ${d.contents}` : d.tag;
                                            return (
                                                <SelectItem key={value} value={value}>{label}</SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tabs */}
                {selectedDomain && (
                    <Tabs defaultValue="rollout">
                        <TabsList className="mb-6">
                            <TabsTrigger value="rollout" className="gap-2">
                                <Settings2 className="h-4 w-4" />
                                Rollout
                            </TabsTrigger>
                            <TabsTrigger value="timebounds" className="gap-2">
                                <Clock className="h-4 w-4" />
                                Time Bounds
                            </TabsTrigger>
                            <TabsTrigger value="versions" className="gap-2">
                                <GitBranch className="h-4 w-4" />
                                Versions
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="rollout">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Logic Rollout</CardTitle>
                                    <CardDescription>Configure rollout percentages for each version</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <RolloutSection domain={selectedDomain} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="timebounds">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Time Bounds</CardTitle>
                                    <CardDescription>Define weekly schedules for when logic is active</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <TimeBoundsSection domain={selectedDomain} />
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="versions">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Logic Versions</CardTitle>
                                    <CardDescription>View and create new logic versions</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <VersionsSection domain={selectedDomain} />
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                )}
            </PageContent>
        </Page>
    );
}
