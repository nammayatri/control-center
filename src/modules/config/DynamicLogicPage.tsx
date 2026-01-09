
import { useState, useEffect, useRef } from 'react';
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
import { LogicBuilder } from '../json-logic/components/LogicBuilder';
import { InputBuilder } from '../json-logic/components/InputBuilder';
import { useLogicBuilderData } from '../json-logic/hooks/useLogicBuilderData';
import { importFromJson } from '../json-logic/utils/jsonLogicImporter';
import { exportToJson } from '../json-logic/utils/jsonLogicConverter';
import type { LogicNode } from '../json-logic/types/JsonLogicTypes';
import { toast } from 'sonner';
import { Textarea } from '../../components/ui/textarea';

// ============================================
// Rollout Section
// ============================================
// Extended rollout item with timeBounds for local editing
interface EditableRolloutItem extends RolloutItem {
    timeBounds: string;
}

function RolloutSection({ domain }: { domain: LogicDomain }) {
    const { data: rolloutData, isLoading } = useLogicRollout(domain);
    const { data: timeBoundsData, isLoading: timeBoundsLoading } = useTimeBounds(domain);
    const upsertMutation = useUpsertLogicRollout();
    const [editableRollout, setEditableRollout] = useState<EditableRolloutItem[]>([]);
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    useEffect(() => {
        if (rolloutData?.length) {
            // Flatten all rollout entries into editable rows with their timeBounds
            const allRows: EditableRolloutItem[] = [];
            rolloutData.forEach(entry => {
                entry.rollout.forEach(item => {
                    allRows.push({
                        ...item,
                        timeBounds: entry.timeBounds || '',
                    });
                });
            });
            setEditableRollout(allRows);
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

    const handleTimeBoundChange = (index: number, value: string) => {
        const updated = [...editableRollout];
        updated[index].timeBounds = value;
        setEditableRollout(updated);
    };

    const handleAddRow = () => {
        setEditableRollout([
            ...editableRollout,
            { version: 1, rolloutPercentage: 0, versionDescription: '', timeBounds: '' }
        ]);
    };

    const handleRemoveRow = (index: number) => {
        setEditableRollout(editableRollout.filter((_, i) => i !== index));
    };

    const handleSave = async () => {
        if (editableRollout.length === 0) {
            setResult({ success: false, message: 'Please add at least one rollout entry' });
            return;
        }

        // Group rows by timeBounds to create separate entries
        const groupedByTimeBound = editableRollout.reduce((acc, item) => {
            const key = item.timeBounds || '';
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push({
                version: item.version,
                rolloutPercentage: item.rolloutPercentage,
                versionDescription: item.versionDescription,
            });
            return acc;
        }, {} as Record<string, RolloutItem[]>);

        // Create LogicRolloutEntry for each timeBound group
        const entries: LogicRolloutEntry[] = Object.entries(groupedByTimeBound).map(([timeBounds, rollout]) => ({
            domain,
            rollout,
            modifiedBy: '',
            timeBounds,
        }));

        try {
            await upsertMutation.mutateAsync(entries);
            setResult({ success: true, message: 'Rollout updated successfully!' });
        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Failed to update rollout' });
        }
    };

    if (isLoading || timeBoundsLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    const hasExistingData = rolloutData && rolloutData.length > 0;

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

            {!hasExistingData && editableRollout.length === 0 && (
                <div className="text-center py-4 text-muted-foreground border border-dashed rounded-lg">
                    <AlertTriangle className="h-6 w-6 mx-auto mb-2" />
                    <p>No rollout data found for this domain.</p>
                    <p className="text-sm">Click "Add Row" below to create a new rollout configuration.</p>
                </div>
            )}

            {editableRollout.length > 0 && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-24">Version</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="w-28">Rollout %</TableHead>
                            <TableHead className="w-40">Time Bound</TableHead>
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
                                    <Select
                                        value={item.timeBounds || 'Unbounded'}
                                        onValueChange={(val) => handleTimeBoundChange(idx, val)}
                                    >
                                        <SelectTrigger className="w-32">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Unbounded">Unbounded</SelectItem>
                                            {timeBoundsData?.map(tb => (
                                                <SelectItem key={tb.name} value={tb.name}>{tb.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
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
            )}

            <div className="flex justify-between">
                <Button variant="outline" onClick={handleAddRow}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Row
                </Button>
                <Button onClick={handleSave} disabled={upsertMutation.isPending || editableRollout.length === 0}>
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
    const { loginModule } = useAuth();
    const { data: versions, isLoading } = useLogicVersions(domain, 20, 0);
    const verifyMutation = useVerifyDynamicLogic();

    // Ref for auto-scroll
    const builderRef = useRef<HTMLDivElement>(null);

    // Builder State
    const [logicNodes, setLogicNodes] = useState<LogicNode[]>([]);
    const [inputs, setInputs] = useState<string[]>(['{}']);
    const [rawLogicText, setRawLogicText] = useState<string>('');
    const [rawInputText, setRawInputText] = useState<string>('');

    // Metadata State
    const [description, setDescription] = useState('');
    const [password, setPassword] = useState('');
    const [verifyResult, setVerifyResult] = useState<any>(null);
    const [resultExpanded, setResultExpanded] = useState(false);

    // View logic state
    const [viewingVersion, setViewingVersion] = useState<number | null>(null);
    const [viewingLogic, setViewingLogic] = useState<any>(null);
    const [loadingLogic, setLoadingLogic] = useState(false);

    // JSON Preview state
    const [showJsonPreview, setShowJsonPreview] = useState(false);
    const [showInputPreview, setShowInputPreview] = useState(false);

    // Logic Builder Data Hook
    const builderData = useLogicBuilderData(domain.tag, logicNodes);

    useEffect(() => {
        // Initialize raw logic text when logicNodes changes
        try {
            const json = exportToJson(logicNodes);
            setRawLogicText(JSON.stringify(json, null, 2));
        } catch (e) {
            setRawLogicText('Error converting to JSON');
        }
    }, [logicNodes]);

    useEffect(() => {
        // Initialize raw input text when inputs changes
        try {
            const parsedInputs = inputs.map(i => JSON.parse(i));
            setRawInputText(JSON.stringify(parsedInputs, null, 2));
        } catch (e) {
            setRawInputText(inputs.join('\n')); // Fallback if not all are valid JSON
        }
    }, [inputs]);

    const handleVerify = async (shouldCreate: boolean) => {
        try {
            // Convert Builder State to JSON for API
            const finalLogic = exportToJson(logicNodes);
            // Inputs are already array of strings (JSON)
            const parsedInputs = inputs.map(i => JSON.parse(i));

            const result = await verifyMutation.mutateAsync({
                domain: domain,
                description,
                rules: finalLogic,
                inputData: parsedInputs,
                shouldUpdateRule: shouldCreate,
                updatePassword: shouldCreate ? password : undefined,
                verifyOutput: true,
            });

            setVerifyResult(result);
            setResultExpanded(true);

            if (shouldCreate) {
                toast.success("Success", {
                    description: `created version ${result.version}`,
                });
                // Reset password after creation
                setPassword('');
            }
        } catch (error: any) {
            setVerifyResult({ errors: [error.message || 'Verification Failed'] });
            setResultExpanded(true);
            toast.error("Error", {
                description: error.message || "Failed to verify logic",
            });
        }
    };

    const handleViewLogic = async (version: number) => {
        if (viewingVersion === version) {
            setViewingVersion(null);
            setViewingLogic(null);
            return;
        }

        setLoadingLogic(true);
        setViewingVersion(version);
        try {
            const logicData = await getDynamicLogic(
                merchantShortId || merchantId || '',
                cityId || '',
                domain,
                version,
                loginModule || undefined
            );
            setViewingLogic(logicData);
        } catch (error) {
            setViewingLogic({ error: 'Failed to load logic' });
        } finally {
            setLoadingLogic(false);
        }
    };

    const handleClone = (versionLogic: any) => {
        try {
            console.log('handleClone received:', versionLogic);

            // API returns DynamicLogicEntry[] where logics is string[]
            const logsArray = versionLogic?.[0]?.logics || versionLogic?.logics || [];
            console.log('logsArray (raw strings):', logsArray);

            // Parse each JSON string into an object
            const parsedLogics = logsArray.map((s: string) => {
                try {
                    return typeof s === 'string' ? JSON.parse(s) : s;
                } catch (e) {
                    console.warn('Failed to parse logic string:', s, e);
                    return s;
                }
            });
            console.log('parsedLogics:', parsedLogics);

            // If the result is an array with one element that's also an array, unwrap it
            // This handles the case where the API returns [["[{config...}]"]]
            let logicToImport = parsedLogics;
            if (parsedLogics.length === 1 && Array.isArray(parsedLogics[0])) {
                logicToImport = parsedLogics[0];
            }
            console.log('logicToImport (final):', logicToImport);

            // Import to Nodes
            const nodes = importFromJson(logicToImport);
            console.log('Imported nodes:', nodes);

            if (nodes.length === 0) {
                throw new Error('No nodes were imported. Check console for parsing errors.');
            }

            setLogicNodes(nodes);
            // Also reset raw logic text to match
            setRawLogicText(JSON.stringify(logicToImport, null, 2));

            toast.success("Cloned", {
                description: `Logic imported to builder (${nodes.length} nodes). Modify and create new version.`,
            });

            // Scroll to builder section
            setTimeout(() => {
                builderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);

        } catch (e: any) {
            console.error('Clone error:', e);
            toast.error("Clone Failed", {
                description: e.message || "Could not parse this logic into the builder."
            });
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
                                    <div className="p-4 bg-muted/20 rounded-lg border relative">
                                        <div className="flex items-center justify-between mb-2">
                                            <p className="text-sm text-muted-foreground">Logic Rules</p>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    disabled={!viewingLogic || viewingLogic.error}
                                                    onClick={() => handleClone(viewingLogic)}
                                                >
                                                    <Copy className="h-3 w-3 mr-1" />
                                                    Clone to New
                                                </Button>
                                            </div>
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

            {/* Create/Verify Form - Replaced with Builders */}
            <div ref={builderRef} className="border-t pt-6 bg-card">
                <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Verify / Create New Version
                </h4>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Logic Builder Column */}
                    <div className="space-y-2">
                        <Tabs defaultValue="visual" className="w-full">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium">Logic Rules</label>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs mr-2">
                                        {logicNodes.length} nodes
                                    </Badge>
                                    <TabsList className="h-8">
                                        <TabsTrigger value="visual" className="text-xs h-7">Visual</TabsTrigger>
                                        <TabsTrigger value="raw" className="text-xs h-7">Raw JSON</TabsTrigger>
                                    </TabsList>
                                </div>
                            </div>

                            <TabsContent value="visual" className="mt-0">
                                <LogicBuilder
                                    initialLogic={logicNodes}
                                    onChange={setLogicNodes}
                                    data={builderData}
                                />
                            </TabsContent>

                            <TabsContent value="raw" className="mt-0">
                                <div className="space-y-2">
                                    <Textarea
                                        className="font-mono text-xs min-h-[400px]"
                                        value={rawLogicText}
                                        onChange={(e) => {
                                            setRawLogicText(e.target.value);
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                // Try to import valid JSON
                                                const nodes = importFromJson(parsed);
                                                if (nodes.length > 0) {
                                                    setLogicNodes(nodes);
                                                }
                                            } catch (err) {
                                                // Ignore parse errors while typing
                                            }
                                        }}
                                        placeholder='[{"if": [...]}]'
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Edit the raw JSON Logic here. The visual builder will update automatically if the JSON is valid.
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Input Builder Column */}
                    <div className="space-y-2">
                        <Tabs defaultValue="visual" className="w-full">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-medium">Verification Data</label>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs mr-2">
                                        {inputs.length} scenarios
                                    </Badge>
                                    <TabsList className="h-8">
                                        <TabsTrigger value="visual" className="text-xs h-7">Visual Input</TabsTrigger>
                                        <TabsTrigger value="raw" className="text-xs h-7">Raw Input</TabsTrigger>
                                    </TabsList>
                                </div>
                            </div>

                            <TabsContent value="visual" className="mt-0">
                                <InputBuilder
                                    initialInput={inputs}
                                    onChange={(newInputs) => {
                                        setInputs(newInputs);
                                        // Sync raw text
                                        try {
                                            const combined = newInputs.map(s => JSON.parse(s));
                                            setRawInputText(JSON.stringify(combined, null, 2));
                                        } catch (e) {
                                            setRawInputText(newInputs.join('\n'));
                                        }
                                    }}
                                    filterOptions={builderData.filterOptions}
                                />
                            </TabsContent>

                            <TabsContent value="raw" className="mt-0">
                                <div className="space-y-2">
                                    <Textarea
                                        className="font-mono text-xs min-h-[400px]"
                                        value={rawInputText}
                                        onChange={(e) => {
                                            setRawInputText(e.target.value);
                                            try {
                                                const parsed = JSON.parse(e.target.value);
                                                // Expecting array of objects or single object
                                                const array = Array.isArray(parsed) ? parsed : [parsed];
                                                const strings = array.map(o => JSON.stringify(o));
                                                setInputs(strings);
                                            } catch (err) {
                                                // Ignore errors
                                            }
                                        }}
                                        placeholder='[{"config": { ... }}]'
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Edit input JSON scenarios here.
                                    </p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>

                {/* JSON Preview Dialog for Logic */}
                {showJsonPreview && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowJsonPreview(false)}>
                        <div className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] m-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold">Logic JSON Preview</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(exportToJson(logicNodes), null, 2));
                                        toast.success('Copied to clipboard');
                                    }}>
                                        <Copy className="h-4 w-4 mr-1" /> Copy
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setShowJsonPreview(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <pre className="p-4 text-sm font-mono overflow-auto max-h-[60vh]">
                                {JSON.stringify(exportToJson(logicNodes), null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                {/* JSON Preview Dialog for Input */}
                {showInputPreview && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowInputPreview(false)}>
                        <div className="bg-background rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] m-4" onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between p-4 border-b">
                                <h3 className="font-semibold">Input JSON Preview</h3>
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={() => {
                                        navigator.clipboard.writeText(JSON.stringify(inputs.map(i => { try { return JSON.parse(i); } catch { return i; } }), null, 2));
                                        toast.success('Copied to clipboard');
                                    }}>
                                        <Copy className="h-4 w-4 mr-1" /> Copy
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => setShowInputPreview(false)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <pre className="p-4 text-sm font-mono overflow-auto max-h-[60vh]">
                                {JSON.stringify(inputs.map(i => { try { return JSON.parse(i); } catch { return i; } }), null, 2)}
                            </pre>
                        </div>
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-4 mt-6">
                    <Input
                        placeholder="Version Description"
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
                            <span className="font-medium">Verification Result</span>
                            {verifyResult.isRuleUpdated && (
                                <Badge variant="default" className="ml-2 bg-green-600">Version Created</Badge>
                            )}
                            {verifyResult && !verifyResult.success && verifyResult.errors?.length > 0 && (
                                <Badge variant="destructive" className="ml-2">Errors Found</Badge>
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

    const hasAccess = loginModule === 'BAP' || loginModule === 'BPP';

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
