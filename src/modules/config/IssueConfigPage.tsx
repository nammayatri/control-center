import { useState, useEffect } from 'react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../components/ui/table';
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import {
    useCategories,
    useCreateCategory,
    useUpdateCategory,
    useDeleteCategory,
    useReorderCategories,
    useIssueConfig,
    useUpdateIssueConfig,
    useBulkUpsertTranslations,
    useTranslations,
} from '../../hooks/useIssueContent';
import type {
    IssueCategoryRes,
    IssueCategoryDetailRes,
    CreateIssueCategoryReq,
    UpdateIssueCategoryReq,
    UpdateIssueConfigReq,
    Language,
    Translation,
    CategoryType,
    MessageType,
    CreateIssueMessageReq,
} from '../../types/issueContent';
import { LANGUAGES } from '../../types/issueContent';
import {
    FolderTree,
    Languages,
    Sliders,
    Plus,
    Save,
    Trash2,
    Edit,
    Eye,
    Loader2,
    CheckCircle,
    XCircle,
    Lock,
    LogIn,
    AlertTriangle,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';


// ============================================
// Category Form Dialog
// ============================================
function CategoryFormDialog({
    open,
    onOpenChange,
    editCategory,
    onSuccess,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editCategory: IssueCategoryDetailRes | null;
    onSuccess: () => void;
}) {
    const [category, setCategory] = useState('');
    const [label, setLabel] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [categoryType, setCategoryType] = useState<CategoryType>('Category');
    const [priority, setPriority] = useState(1);
    const [isRideRequired, setIsRideRequired] = useState(false);
    const [isActive, setIsActive] = useState(true);
    const [maxAllowedRideAge, setMaxAllowedRideAge] = useState<number | undefined>();
    const [translations, setTranslations] = useState<Translation[]>([]);

    // Messages for new category creation
    const [messages, setMessages] = useState<CreateIssueMessageReq[]>([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [newMessageTitle, setNewMessageTitle] = useState('');
    const [newMessageType, setNewMessageType] = useState<MessageType>('Intermediate');
    const [newMessagePriority, setNewMessagePriority] = useState(1);

    const createMutation = useCreateCategory();
    const updateMutation = useUpdateCategory();

    const isEdit = !!editCategory;

    const resetForm = () => {
        setCategory('');
        setLabel('');
        setLogoUrl('');
        setCategoryType('Category');
        setPriority(1);
        setIsRideRequired(false);
        setIsActive(true);
        setMaxAllowedRideAge(undefined);
        setTranslations([]);
        setMessages([]);
        setNewMessageText('');
        setNewMessageTitle('');
        setNewMessageType('Intermediate');
        setNewMessagePriority(1);
    };

    const addMessage = () => {
        if (!newMessageText.trim()) {
            toast.error('Message text is required');
            return;
        }
        const newMsg: CreateIssueMessageReq = {
            message: newMessageText.trim(),
            messageTitle: newMessageTitle.trim() || undefined,
            messageType: newMessageType,
            priority: newMessagePriority,
            messageTranslations: [],
            titleTranslations: [],
            actionTranslations: [],
            options: [],
        };
        setMessages([...messages, newMsg]);
        setNewMessageText('');
        setNewMessageTitle('');
        setNewMessageType('Intermediate');
        setNewMessagePriority(messages.length + 2);
    };

    const removeMessage = (index: number) => {
        setMessages(messages.filter((_, i) => i !== index));
    };

    // Populate form when editing
    useEffect(() => {
        if (editCategory) {
            setCategory(editCategory.category.category);
            setLabel(editCategory.category.label || '');
            setLogoUrl(editCategory.category.logoUrl);
            setCategoryType(editCategory.category.categoryType);
            setPriority(editCategory.category.priority || 1);
            setIsRideRequired(editCategory.category.isRideRequired);
            setMaxAllowedRideAge(editCategory.category.maxAllowedRideAge || undefined);
            setTranslations(editCategory.translations || []);
            setMessages([]); // Messages are managed separately for editing
        } else {
            resetForm();
        }
    }, [editCategory]);

    const handleSubmit = async () => {
        if (!isEdit && messages.length === 0) {
            toast.error('At least one message is required');
            return;
        }

        try {
            if (isEdit && editCategory) {
                const data: UpdateIssueCategoryReq = {
                    categoryId: editCategory.category.issueCategoryId,
                    category,
                    label: label || undefined,
                    logoUrl,
                    priority,
                    isRideRequired,
                    maxAllowedRideAge,
                    translations,
                };
                await updateMutation.mutateAsync(data);
                toast.success('Category updated successfully');
            } else {
                const data: CreateIssueCategoryReq = {
                    category,
                    label: label || undefined,
                    logoUrl,
                    priority,
                    categoryType,
                    isRideRequired,
                    isActive,
                    maxAllowedRideAge,
                    translations,
                    messages,
                };
                await createMutation.mutateAsync(data);
                toast.success('Category created successfully');
            }
            onOpenChange(false);
            resetForm();
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Operation failed');
        }
    };

    const isLoading = createMutation.isPending || updateMutation.isPending;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Category' : 'Create Category'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update the category details' : 'Add a new issue category'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Category Name *</Label>
                            <Input
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                placeholder="e.g., Payment Issues"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Label</Label>
                            <Input
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="Optional label"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Logo URL</Label>
                        <Input
                            value={logoUrl}
                            onChange={(e) => setLogoUrl(e.target.value)}
                            placeholder="https://..."
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={categoryType}
                                onValueChange={(v: CategoryType) => setCategoryType(v)}
                                disabled={isEdit}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Category">Category</SelectItem>
                                    <SelectItem value="FAQ">FAQ</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Input
                                type="number"
                                value={priority}
                                onChange={(e) => setPriority(Number(e.target.value))}
                                min={1}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Max Ride Age (seconds)</Label>
                            <Input
                                type="number"
                                value={maxAllowedRideAge || ''}
                                onChange={(e) => setMaxAllowedRideAge(e.target.value ? Number(e.target.value) : undefined)}
                                placeholder="Optional"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch
                            id="isRideRequired"
                            checked={isRideRequired}
                            onCheckedChange={setIsRideRequired}
                        />
                        <Label htmlFor="isRideRequired">Ride Required</Label>
                    </div>

                    <div className="flex items-center gap-2">
                        <Switch
                            id="isActive"
                            checked={isActive}
                            onCheckedChange={setIsActive}
                        />
                        <Label htmlFor="isActive">Active</Label>
                    </div>

                    {/* Messages Section - Only for new category creation */}
                    {!isEdit && (
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <Label className="text-base font-medium">Messages *</Label>
                                <Badge variant="outline">{messages.length} message(s)</Badge>
                            </div>

                            {/* List of added messages */}
                            {messages.length > 0 && (
                                <div className="space-y-2 max-h-40 overflow-y-auto border rounded-md p-2">
                                    {messages.map((msg, index) => (
                                        <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="secondary" className="text-xs">{msg.messageType}</Badge>
                                                    <span className="text-xs text-muted-foreground">Priority: {msg.priority}</span>
                                                </div>
                                                <p className="text-sm truncate mt-1">{msg.message}</p>
                                                {msg.messageTitle && (
                                                    <p className="text-xs text-muted-foreground truncate">Title: {msg.messageTitle}</p>
                                                )}
                                            </div>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeMessage(index)}
                                                className="ml-2 shrink-0"
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Add new message form */}
                            <div className="border rounded-md p-3 space-y-3 bg-muted/30">
                                <h5 className="text-sm font-medium">Add Message</h5>
                                <div className="space-y-2">
                                    <Input
                                        value={newMessageText}
                                        onChange={(e) => setNewMessageText(e.target.value)}
                                        placeholder="Message content..."
                                    />
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    <Input
                                        value={newMessageTitle}
                                        onChange={(e) => setNewMessageTitle(e.target.value)}
                                        placeholder="Title (optional)"
                                    />
                                    <Select value={newMessageType} onValueChange={(v: MessageType) => setNewMessageType(v)}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Intermediate">Intermediate</SelectItem>
                                            <SelectItem value="Terminal">Terminal</SelectItem>
                                            <SelectItem value="FAQ">FAQ</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Input
                                        type="number"
                                        value={newMessagePriority}
                                        onChange={(e) => setNewMessagePriority(Number(e.target.value))}
                                        placeholder="Priority"
                                        min={1}
                                    />
                                </div>
                                <Button type="button" variant="secondary" size="sm" onClick={addMessage}>
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Message
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Translations Section */}
                    <div className="space-y-2">
                        <Label>Translations</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                            {LANGUAGES.map((lang) => {
                                const existing = translations.find((t) => t.language === lang);
                                return (
                                    <div key={lang} className="flex items-center gap-2">
                                        <span className="text-xs w-20 text-muted-foreground">{lang}</span>
                                        <Input
                                            value={existing?.translation || ''}
                                            onChange={(e) => {
                                                const newTrans = translations.filter((t) => t.language !== lang);
                                                if (e.target.value) {
                                                    newTrans.push({ language: lang, translation: e.target.value });
                                                }
                                                setTranslations(newTrans);
                                            }}
                                            placeholder={`${lang} translation`}
                                            className="flex-1"
                                        />
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading || !category}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isEdit ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// Categories Tab
// ============================================
function CategoriesTab() {
    const navigate = useNavigate();
    const { data: categories, isLoading, refetch } = useCategories();
    const deleteMutation = useDeleteCategory();
    const reorderMutation = useReorderCategories();

    const [formOpen, setFormOpen] = useState(false);
    const [editCategory, setEditCategory] = useState<IssueCategoryDetailRes | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const handleEdit = (cat: IssueCategoryRes) => {
        setEditCategory({ category: cat, translations: [], messages: [], options: [] });
        setFormOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await deleteMutation.mutateAsync(deleteId);
            toast.success('Category deleted');
            setDeleteId(null);
            refetch();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete');
        }
    };

    const handleReorder = async (categoryId: string, direction: 'up' | 'down') => {
        if (!categories) return;
        const index = categories.findIndex((c) => c.issueCategoryId === categoryId);
        if (index === -1) return;
        if (direction === 'up' && index === 0) return;
        if (direction === 'down' && index === categories.length - 1) return;

        const newOrder = categories.map((c, i) => {
            if (i === index) {
                return [c.issueCategoryId, direction === 'up' ? i : i + 2] as [string, number];
            }
            if (direction === 'up' && i === index - 1) {
                return [c.issueCategoryId, i + 2] as [string, number];
            }
            if (direction === 'down' && i === index + 1) {
                return [c.issueCategoryId, i] as [string, number];
            }
            return [c.issueCategoryId, i + 1] as [string, number];
        });

        try {
            await reorderMutation.mutateAsync({ categoryOrder: newOrder });
            refetch();
        } catch (error: any) {
            toast.error('Failed to reorder');
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Actions */}
            <div className="flex items-center justify-end">
                <Button onClick={() => { setEditCategory(null); setFormOpen(true); }}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                </Button>
            </div>

            {/* Categories Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                    ) : !categories || categories.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No categories found. Create your first category!
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">Order</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Label</TableHead>
                                    <TableHead>Ride Required</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.map((cat, idx) => (
                                    <TableRow key={cat.issueCategoryId}>
                                        <TableCell>
                                            <div className="flex flex-col gap-0.5">
                                                <button
                                                    onClick={() => handleReorder(cat.issueCategoryId, 'up')}
                                                    disabled={idx === 0 || reorderMutation.isPending}
                                                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                                                >
                                                    <ArrowUp className="h-3 w-3" />
                                                </button>
                                                <button
                                                    onClick={() => handleReorder(cat.issueCategoryId, 'down')}
                                                    disabled={idx === categories.length - 1 || reorderMutation.isPending}
                                                    className="p-0.5 hover:bg-muted rounded disabled:opacity-30"
                                                >
                                                    <ArrowDown className="h-3 w-3" />
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell
                                            className="font-medium cursor-pointer hover:text-primary hover:underline"
                                            onClick={() => navigate(`/config/issue-config/${cat.issueCategoryId}`)}
                                        >
                                            {cat.category}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={cat.categoryType === 'FAQ' ? 'secondary' : 'default'}>
                                                {cat.categoryType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{cat.label || '-'}</TableCell>
                                        <TableCell>
                                            {cat.isRideRequired ? (
                                                <CheckCircle className="h-4 w-4 text-green-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-muted-foreground" />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => navigate(`/config/issue-config/${cat.issueCategoryId}`)}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Manage
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleEdit(cat)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setDeleteId(cat.issueCategoryId)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Category Form Dialog */}
            <CategoryFormDialog
                open={formOpen}
                onOpenChange={setFormOpen}
                editCategory={editCategory}
                onSuccess={refetch}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Category?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will soft-delete the category. It can be restored later if needed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// ============================================
// Config Tab
// ============================================
function ConfigTab() {
    const { data: config, isLoading } = useIssueConfig();
    const updateMutation = useUpdateIssueConfig();

    const [formData, setFormData] = useState<UpdateIssueConfigReq>({});

    // Populate form when data loads
    useEffect(() => {
        if (config) {
            setFormData({
                autoMarkIssueClosedDuration: config.autoMarkIssueClosedDuration,
                reopenCount: config.reopenCount,
                merchantName: config.merchantName || undefined,
                supportEmail: config.supportEmail || undefined,
                onCreateIssueMsgs: config.onCreateIssueMsgs,
                onIssueReopenMsgs: config.onIssueReopenMsgs,
                onAutoMarkIssueClsMsgs: config.onAutoMarkIssueClsMsgs,
                onKaptMarkIssueResMsgs: config.onKaptMarkIssueResMsgs,
                onIssueCloseMsgs: config.onIssueCloseMsgs,
            });
        }
    }, [config]);

    const handleSave = async () => {
        try {
            await updateMutation.mutateAsync(formData);
            toast.success('Config updated successfully');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update config');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
            </div>
        );
    }

    if (!config) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                No config found. The API may not be available yet.
            </div>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Issue Configuration</CardTitle>
                <CardDescription>
                    Manage issue behavior settings for this merchant
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Auto-close Duration (hours)</Label>
                        <Input
                            type="number"
                            value={formData.autoMarkIssueClosedDuration ?? config.autoMarkIssueClosedDuration}
                            onChange={(e) => setFormData({ ...formData, autoMarkIssueClosedDuration: Number(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Issues are auto-closed after this duration
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Reopen Count</Label>
                        <Input
                            type="number"
                            value={formData.reopenCount ?? config.reopenCount}
                            onChange={(e) => setFormData({ ...formData, reopenCount: Number(e.target.value) })}
                        />
                        <p className="text-xs text-muted-foreground">
                            Max times a user can reopen an issue
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Merchant Name</Label>
                        <Input
                            value={formData.merchantName ?? config.merchantName ?? ''}
                            onChange={(e) => setFormData({ ...formData, merchantName: e.target.value || undefined })}
                            placeholder="Used in message placeholders"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Support Email</Label>
                        <Input
                            type="email"
                            value={formData.supportEmail ?? config.supportEmail ?? ''}
                            onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value || undefined })}
                            placeholder="support@example.com"
                        />
                    </div>
                </div>

                <div className="pt-4">
                    <h4 className="text-sm font-medium mb-2">Message IDs (comma-separated)</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>On Create Issue</Label>
                            <Input
                                value={(formData.onCreateIssueMsgs ?? config.onCreateIssueMsgs)?.join(', ') || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    onCreateIssueMsgs: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                })}
                                placeholder="msg1, msg2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>On Issue Reopen</Label>
                            <Input
                                value={(formData.onIssueReopenMsgs ?? config.onIssueReopenMsgs)?.join(', ') || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    onIssueReopenMsgs: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                })}
                                placeholder="msg1, msg2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>On Auto-close</Label>
                            <Input
                                value={(formData.onAutoMarkIssueClsMsgs ?? config.onAutoMarkIssueClsMsgs)?.join(', ') || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    onAutoMarkIssueClsMsgs: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                })}
                                placeholder="msg1, msg2"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>On Issue Close</Label>
                            <Input
                                value={(formData.onIssueCloseMsgs ?? config.onIssueCloseMsgs)?.join(', ') || ''}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    onIssueCloseMsgs: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                })}
                                placeholder="msg1, msg2"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={updateMutation.isPending}>
                        {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        <Save className="h-4 w-4 mr-2" />
                        Save Config
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}


function TranslationsTab() {
    const [sentence, setSentence] = useState('');
    const { data: translations, isLoading, refetch } = sentence ?
        // eslint-disable-next-line react-hooks/rules-of-hooks
        useTranslations(sentence) : { data: null, isLoading: false, refetch: () => { } };
    const bulkMutation = useBulkUpsertTranslations();

    const [editedTranslations, setEditedTranslations] = useState<Record<Language, string>>({} as Record<Language, string>);

    const handleSave = async () => {
        const items = LANGUAGES.map((lang) => ({
            sentence,
            language: lang,
            translation: editedTranslations[lang] || '',
        })).filter((t) => t.translation);

        if (items.length === 0) {
            toast.error('No translations to save');
            return;
        }

        try {
            await bulkMutation.mutateAsync({ translations: items });
            toast.success('Translations saved');
            refetch();
        } catch (error: any) {
            toast.error(error.message || 'Failed to save');
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Translations</CardTitle>
                <CardDescription>
                    Manage translations for issue content
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        value={sentence}
                        onChange={(e) => setSentence(e.target.value)}
                        placeholder="Enter original text to find/add translations"
                        className="flex-1"
                    />
                    <Button
                        variant="outline"
                        onClick={() => {
                            if (translations?.translations) {
                                const map: Record<Language, string> = {} as Record<Language, string>;
                                translations.translations.forEach((t) => {
                                    map[t.language] = t.translation;
                                });
                                setEditedTranslations(map);
                            }
                        }}
                        disabled={!sentence || isLoading}
                    >
                        Load
                    </Button>
                </div>

                {sentence && (
                    <div className="border rounded-lg p-4">
                        <h4 className="text-sm font-medium mb-4">Translations for: "{sentence}"</h4>
                        {isLoading ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : (
                            <div className="grid gap-3">
                                {LANGUAGES.map((lang) => (
                                    <div key={lang} className="flex items-center gap-3">
                                        <span className="w-24 text-sm font-medium">{lang}</span>
                                        <Input
                                            value={editedTranslations[lang] || ''}
                                            onChange={(e) => setEditedTranslations({
                                                ...editedTranslations,
                                                [lang]: e.target.value,
                                            })}
                                            placeholder={`${lang} translation`}
                                            className="flex-1"
                                        />
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex justify-end mt-4">
                            <Button onClick={handleSave} disabled={bulkMutation.isPending || !sentence}>
                                {bulkMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                <Save className="h-4 w-4 mr-2" />
                                Save Translations
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// ============================================
// Main IssueConfigPage Component
// ============================================
export function IssueConfigPage() {
    const { merchantId, cityId } = useDashboardContext();
    const { loginModule, logout } = useAuth();
    const navigate = useNavigate();

    const hasAccess = loginModule === 'BAP';

    if (!hasAccess) {
        return (
            <Page>
                <PageHeader
                    title="Issue Config"
                    breadcrumbs={[
                        { label: 'Config', href: '/config' },
                        { label: 'Issue Config' },
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
                                Issue Config management requires <strong>Customer (BAP)</strong> login.
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
                <PageHeader title="Issue Config" />
                <PageContent>
                    <Card>
                        <CardContent className="p-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                Please select a merchant and city to manage Issue Config.
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
                title="Issue Config"
                description="Manage issue categories, messages, options, translations, and settings"
                breadcrumbs={[
                    { label: 'Config', href: '/config' },
                    { label: 'Issue Config' },
                ]}
            />
            <PageContent>
                <Tabs defaultValue="categories">
                    <TabsList className="mb-6">
                        <TabsTrigger value="categories" className="gap-2">
                            <FolderTree className="h-4 w-4" />
                            Categories
                        </TabsTrigger>
                        <TabsTrigger value="translations" className="gap-2">
                            <Languages className="h-4 w-4" />
                            Translations
                        </TabsTrigger>
                        <TabsTrigger value="config" className="gap-2">
                            <Sliders className="h-4 w-4" />
                            Settings
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="categories">
                        <CategoriesTab />
                    </TabsContent>

                    <TabsContent value="translations">
                        <TranslationsTab />
                    </TabsContent>

                    <TabsContent value="config">
                        <ConfigTab />
                    </TabsContent>
                </Tabs>
            </PageContent>
        </Page>
    );
}
