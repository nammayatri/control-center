import { useState } from 'react';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import {
    useCreateTag,
    useUpdateTag,
    useDeleteTag,
    useVerifyTagRule,
    useCreateQuery,
    useUpdateQuery,
    useDeleteQuery,
} from '../../hooks/useNammaTags';
import type {
    TagStage,
    TagChakra,
    CreateTagRequest,
    UpdateTagRequest,
    CreateQueryRequest,
    UpdateQueryRequest,
    QueryResult,
    ResultType,
} from '../../services/nammaTags';
import {
    Tag,
    Database,
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
    Code,
    FileJson,
    X,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// ============================================
// Tag Form Component
// ============================================
function TagForm() {

    // Form state
    const [tagName, setTagName] = useState('');
    const [tagCategory, setTagCategory] = useState('');
    const [description, setDescription] = useState('');
    const [tagValidity, setTagValidity] = useState<number>(86400);
    const [tagStages, setTagStages] = useState<TagStage[]>(['Search']);
    const [tagChakra, setTagChakra] = useState<TagChakra>('Daily');
    const [possibleValues, setPossibleValues] = useState<string[]>([]);
    const [newPossibleValue, setNewPossibleValue] = useState('');
    const [tagRule, setTagRule] = useState('{"==": [{"var": "isActive"}, true]}');
    const [isEditMode, setIsEditMode] = useState(false);

    // Mutations
    const createMutation = useCreateTag();
    const updateMutation = useUpdateTag();
    const deleteMutation = useDeleteTag();
    const verifyMutation = useVerifyTagRule();

    // Verification state
    const [verifyResult, setVerifyResult] = useState<{ success: boolean; message: string } | null>(null);

    const allStages: TagStage[] = ['Search', 'Confirm', 'Ride', 'PostRide'];
    const allChakras: TagChakra[] = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'LTD'];

    const handleStageToggle = (stage: TagStage) => {
        if (tagStages.includes(stage)) {
            setTagStages(tagStages.filter(s => s !== stage));
        } else {
            setTagStages([...tagStages, stage]);
        }
    };

    const handleAddPossibleValue = () => {
        if (newPossibleValue && !possibleValues.includes(newPossibleValue)) {
            setPossibleValues([...possibleValues, newPossibleValue]);
            setNewPossibleValue('');
        }
    };

    const handleRemovePossibleValue = (value: string) => {
        setPossibleValues(possibleValues.filter(v => v !== value));
    };

    const handleCreate = async () => {
        if (!tagName || !tagCategory) return;

        const data: CreateTagRequest = {
            tag: 'ApplicationTag',
            contents: {
                tagName,
                tagCategory,
                description,
                tagValidity,
                tagStages,
                tagPossibleValues: { contents: possibleValues, tag: 'Tags' },
                tagRule: { contents: tagRule, tag: 'RuleEngine' },
            },
        };

        try {
            await createMutation.mutateAsync(data);
            resetForm();
            setVerifyResult({ success: true, message: 'Tag created successfully!' });
        } catch (error: any) {
            setVerifyResult({ success: false, message: error.message || 'Failed to create tag' });
        }
    };

    const handleUpdate = async () => {
        if (!tagName) return;

        const data: UpdateTagRequest = {
            tagName,
            tagCategory,
            description,
            tagValidity,
            tagStages,
            tagChakra,
            tagPossibleValues: { contents: possibleValues, tag: 'Tags' },
            tagRule: { contents: tagRule, tag: 'RuleEngine' },
            resetTagValidity: false,
        };

        try {
            await updateMutation.mutateAsync(data);
            setVerifyResult({ success: true, message: 'Tag updated successfully!' });
        } catch (error: any) {
            setVerifyResult({ success: false, message: error.message || 'Failed to update tag' });
        }
    };

    const handleDelete = async () => {
        if (!tagName) return;

        try {
            await deleteMutation.mutateAsync(tagName);
            resetForm();
            setVerifyResult({ success: true, message: 'Tag deleted successfully!' });
        } catch (error: any) {
            setVerifyResult({ success: false, message: error.message || 'Failed to delete tag' });
        }
    };

    const handleVerify = async () => {
        try {
            const result = await verifyMutation.mutateAsync({
                logic: tagRule,
                logicData: '{}',
                source: { contents: tagStages[0] || 'Search', tag: 'Application' },
                useDefaultData: true,
            });
            setVerifyResult({
                success: result.result,
                message: result.result ? 'Rule is valid!' : 'Rule validation returned false'
            });
        } catch (error: any) {
            setVerifyResult({ success: false, message: error.message || 'Failed to verify rule' });
        }
    };

    const resetForm = () => {
        setTagName('');
        setTagCategory('');
        setDescription('');
        setTagValidity(86400);
        setTagStages(['Search']);
        setPossibleValues([]);
        setTagRule('{"==": [{"var": "isActive"}, true]}');
        setIsEditMode(false);
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Result Alert */}
            {verifyResult && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${verifyResult.success
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                    }`}>
                    {verifyResult.success
                        ? <CheckCircle className="h-5 w-5 text-green-600" />
                        : <XCircle className="h-5 w-5 text-red-600" />
                    }
                    <span className={verifyResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                        {verifyResult.message}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-6 w-6 p-0"
                        onClick={() => setVerifyResult(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Basic Info */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Tag Name *</label>
                        <Input
                            value={tagName}
                            onChange={e => setTagName(e.target.value)}
                            placeholder="e.g., high_value_customer"
                            disabled={isEditMode}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Category *</label>
                        <Input
                            value={tagCategory}
                            onChange={e => setTagCategory(e.target.value)}
                            placeholder="e.g., customer_segment"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Description</label>
                        <Input
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            placeholder="Brief description of this tag"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Validity (seconds)</label>
                        <Input
                            type="number"
                            value={tagValidity}
                            onChange={e => setTagValidity(Number(e.target.value))}
                            placeholder="86400"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            {Math.floor(tagValidity / 86400)} days, {Math.floor((tagValidity % 86400) / 3600)} hours
                        </p>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Chakra</label>
                        <Select value={tagChakra} onValueChange={(v: TagChakra) => setTagChakra(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {allChakras.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Tag Stages</label>
                        <div className="flex flex-wrap gap-2">
                            {allStages.map(stage => (
                                <Badge
                                    key={stage}
                                    variant={tagStages.includes(stage) ? 'default' : 'outline'}
                                    className="cursor-pointer"
                                    onClick={() => handleStageToggle(stage)}
                                >
                                    {stage}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Possible Values</label>
                        <div className="flex gap-2 mb-2">
                            <Input
                                value={newPossibleValue}
                                onChange={e => setNewPossibleValue(e.target.value)}
                                placeholder="Add a value"
                                onKeyDown={e => e.key === 'Enter' && handleAddPossibleValue()}
                            />
                            <Button size="sm" onClick={handleAddPossibleValue}>
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {possibleValues.map(v => (
                                <Badge key={v} variant="secondary" className="gap-1">
                                    {v}
                                    <X
                                        className="h-3 w-3 cursor-pointer"
                                        onClick={() => handleRemovePossibleValue(v)}
                                    />
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - JSON Logic Editor */}
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <FileJson className="h-4 w-4" />
                                Tag Rule (JSON Logic)
                            </label>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleVerify}
                                disabled={verifyMutation.isPending}
                            >
                                {verifyMutation.isPending ? (
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                ) : (
                                    <Play className="h-4 w-4 mr-1" />
                                )}
                                Verify
                            </Button>
                        </div>
                        <textarea
                            className="w-full h-64 p-3 rounded-lg border bg-muted/50 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            value={tagRule}
                            onChange={e => setTagRule(e.target.value)}
                            placeholder='{"==": [{"var": "field"}, "value"]}'
                            spellCheck={false}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Enter a valid <a href="https://jsonlogic.com/" target="_blank" rel="noopener noreferrer" className="text-primary underline">JSON Logic</a> expression
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        {isEditMode ? (
                            <>
                                <Button onClick={handleUpdate} disabled={isLoading || !tagName}>
                                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Update Tag
                                </Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                                    {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    Delete
                                </Button>
                                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                            </>
                        ) : (
                            <>
                                <Button onClick={handleCreate} disabled={isLoading || !tagName || !tagCategory}>
                                    {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Create Tag
                                </Button>
                                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                                    Edit Existing Tag
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Query Form Component
// ============================================
function QueryForm() {

    // Form state
    const [queryName, setQueryName] = useState('');
    const [chakra, setChakra] = useState<TagChakra>('Daily');
    const [queryText, setQueryText] = useState('SELECT COUNT(*) as count FROM rides WHERE created_at >= today()');
    const [queryResults, setQueryResults] = useState<QueryResult[]>([
        { resultName: 'count', resultDefault: { contents: 0, tag: 'INT' } }
    ]);
    const [isEditMode, setIsEditMode] = useState(false);

    // Mutations
    const createMutation = useCreateQuery();
    const updateMutation = useUpdateQuery();
    const deleteMutation = useDeleteQuery();

    // Result state
    const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

    const allChakras: TagChakra[] = ['Daily', 'Weekly', 'Monthly', 'Yearly', 'LTD'];
    const resultTypes: ResultType[] = ['BOOL', 'INT', 'STRING', 'DOUBLE'];

    const handleAddResult = () => {
        setQueryResults([
            ...queryResults,
            { resultName: '', resultDefault: { contents: 0, tag: 'INT' } }
        ]);
    };

    const handleRemoveResult = (index: number) => {
        setQueryResults(queryResults.filter((_, i) => i !== index));
    };

    const handleResultChange = (index: number, field: 'name' | 'type' | 'default', value: any) => {
        const updated = [...queryResults];
        if (field === 'name') {
            updated[index].resultName = value;
        } else if (field === 'type') {
            updated[index].resultDefault.tag = value;
            // Reset default based on type
            if (value === 'BOOL') updated[index].resultDefault.contents = false;
            else if (value === 'INT' || value === 'DOUBLE') updated[index].resultDefault.contents = 0;
            else updated[index].resultDefault.contents = '';
        } else if (field === 'default') {
            const tag = updated[index].resultDefault.tag;
            if (tag === 'BOOL') updated[index].resultDefault.contents = value === 'true';
            else if (tag === 'INT') updated[index].resultDefault.contents = parseInt(value) || 0;
            else if (tag === 'DOUBLE') updated[index].resultDefault.contents = parseFloat(value) || 0;
            else updated[index].resultDefault.contents = value;
        }
        setQueryResults(updated);
    };

    const handleCreate = async () => {
        if (!queryName || !queryText) return;

        const data: CreateQueryRequest = {
            queryName,
            chakra,
            queryText,
            queryResults,
        };

        try {
            await createMutation.mutateAsync(data);
            resetForm();
            setResult({ success: true, message: 'Query created successfully!' });
        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Failed to create query' });
        }
    };

    const handleUpdate = async () => {
        if (!queryName) return;

        const data: UpdateQueryRequest = {
            queryName,
            chakra,
            queryText,
            queryResults,
        };

        try {
            await updateMutation.mutateAsync(data);
            setResult({ success: true, message: 'Query updated successfully!' });
        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Failed to update query' });
        }
    };

    const handleDelete = async () => {
        if (!queryName) return;

        try {
            await deleteMutation.mutateAsync({ queryName, chakra });
            resetForm();
            setResult({ success: true, message: 'Query deleted successfully!' });
        } catch (error: any) {
            setResult({ success: false, message: error.message || 'Failed to delete query' });
        }
    };

    const resetForm = () => {
        setQueryName('');
        setChakra('Daily');
        setQueryText('SELECT COUNT(*) as count FROM rides WHERE created_at >= today()');
        setQueryResults([{ resultName: 'count', resultDefault: { contents: 0, tag: 'INT' } }]);
        setIsEditMode(false);
    };

    const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

    return (
        <div className="space-y-6">
            {/* Result Alert */}
            {result && (
                <div className={`p-4 rounded-lg flex items-center gap-3 ${result.success
                    ? 'bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800'
                    : 'bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800'
                    }`}>
                    {result.success
                        ? <CheckCircle className="h-5 w-5 text-green-600" />
                        : <XCircle className="h-5 w-5 text-red-600" />
                    }
                    <span className={result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
                        {result.message}
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="ml-auto h-6 w-6 p-0"
                        onClick={() => setResult(null)}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Left Column - Query Info */}
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Query Name *</label>
                        <Input
                            value={queryName}
                            onChange={e => setQueryName(e.target.value)}
                            placeholder="e.g., daily_ride_count"
                            disabled={isEditMode}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-1.5 block">Chakra</label>
                        <Select value={chakra} onValueChange={(v: TagChakra) => setChakra(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {allChakras.map(c => (
                                    <SelectItem key={c} value={c}>{c}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Query Results */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium">Query Results</label>
                            <Button size="sm" variant="outline" onClick={handleAddResult}>
                                <Plus className="h-4 w-4 mr-1" /> Add Result
                            </Button>
                        </div>
                        <div className="space-y-2">
                            {queryResults.map((qr, idx) => (
                                <div key={idx} className="flex gap-2 items-center p-2 bg-muted/30 rounded-lg">
                                    <Input
                                        className="flex-1"
                                        value={qr.resultName}
                                        onChange={e => handleResultChange(idx, 'name', e.target.value)}
                                        placeholder="Result name"
                                    />
                                    <Select
                                        value={qr.resultDefault.tag}
                                        onValueChange={v => handleResultChange(idx, 'type', v)}
                                    >
                                        <SelectTrigger className="w-24">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {resultTypes.map(t => (
                                                <SelectItem key={t} value={t}>{t}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        className="w-24"
                                        value={String(qr.resultDefault.contents)}
                                        onChange={e => handleResultChange(idx, 'default', e.target.value)}
                                        placeholder="Default"
                                    />
                                    {queryResults.length > 1 && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleRemoveResult(idx)}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column - ClickHouse Query */}
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="text-sm font-medium flex items-center gap-2">
                                <Code className="h-4 w-4" />
                                Query Text (ClickHouse SQL)
                            </label>
                        </div>
                        <textarea
                            className="w-full h-64 p-3 rounded-lg border bg-muted/50 font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                            value={queryText}
                            onChange={e => setQueryText(e.target.value)}
                            placeholder="SELECT ..."
                            spellCheck={false}
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                            Enter a valid ClickHouse SQL query
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        {isEditMode ? (
                            <>
                                <Button onClick={handleUpdate} disabled={isLoading || !queryName}>
                                    {updateMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                                    Update Query
                                </Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
                                    {deleteMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                    Delete
                                </Button>
                                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                            </>
                        ) : (
                            <>
                                <Button onClick={handleCreate} disabled={isLoading || !queryName || !queryText}>
                                    {createMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                                    Create Query
                                </Button>
                                <Button variant="outline" onClick={() => setIsEditMode(true)}>
                                    Edit Existing Query
                                </Button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================
// Main NammaTagsPage Component
// ============================================
export function NammaTagsPage() {
    const { merchantId, cityId } = useDashboardContext();
    const { loginModule, logout } = useAuth();
    const navigate = useNavigate();

    const hasAccess = loginModule === 'BAP';

    if (!hasAccess) {
        return (
            <Page>
                <PageHeader
                    title="NammaTags"
                    breadcrumbs={[
                        { label: 'Config', href: '/config' },
                        { label: 'NammaTags' },
                    ]}
                />
                <PageContent>
                    <Card className="max-w-lg mx-auto">
                        <CardContent className="p-12 text-center space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center">
                                <Lock className="h-8 w-8 text-amber-600" />
                            </div>
                            <h3 className="text-lg font-semibold">Customer Login Required</h3>
                            <p className="text-muted-foreground">
                                NammaTags management requires <strong>Customer (BAP)</strong> login.
                            </p>
                            <Button
                                onClick={() => {
                                    logout();
                                    navigate('/login');
                                }}
                                className="mt-4"
                            >
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
                <PageHeader title="NammaTags" />
                <PageContent>
                    <Card>
                        <CardContent className="p-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                Please select a merchant and city to manage NammaTags.
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
                title="NammaTags"
                description="Manage application tags with JSON Logic rules and ClickHouse queries"
                breadcrumbs={[
                    { label: 'Config', href: '/config' },
                    { label: 'NammaTags' },
                ]}
            />
            <PageContent>
                <Tabs defaultValue="tags">
                    <TabsList className="mb-6">
                        <TabsTrigger value="tags" className="gap-2">
                            <Tag className="h-4 w-4" />
                            Tags
                        </TabsTrigger>
                        <TabsTrigger value="queries" className="gap-2">
                            <Database className="h-4 w-4" />
                            Queries
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tags">
                        <Card>
                            <CardHeader>
                                <CardTitle>Application Tags</CardTitle>
                                <CardDescription>
                                    Create and manage tags with JSON Logic rules for customer segmentation and targeting
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <TagForm />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="queries">
                        <Card>
                            <CardHeader>
                                <CardTitle>Tag Queries</CardTitle>
                                <CardDescription>
                                    Define ClickHouse queries to compute tag values based on aggregated data
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <QueryForm />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </PageContent>
        </Page>
    );
}
