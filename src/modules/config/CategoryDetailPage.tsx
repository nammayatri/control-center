import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
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
import { Switch } from '../../components/ui/switch';
import { Label } from '../../components/ui/label';
import { useDashboardContext } from '../../context/DashboardContext';
import { useAuth } from '../../context/AuthContext';
import {
    useCategoryDetail,
    useCategoryPreview,
    useUpsertMessage,
    useDeleteMessage,
    useCreateOption,
    useUpdateOption,
    useDeleteOption,
} from '../../hooks/useIssueContent';
import type {
    Language,
    Translation,
    MessageType,
    MessageFlowNode,
    OptionFlowNode,
    UpsertIssueMessageReq,
    CreateIssueOptionReq,
    CreateIssueMessageReq,
    UpdateIssueOptionReq,
    IssueMessageDetailRes,
    IssueOptionDetailRes,
    VehicleVariant,
    RideStatus,
} from '../../types/issueContent';
import { LANGUAGES, VEHICLE_VARIANTS, RIDE_STATUSES } from '../../types/issueContent';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '../../components/ui/popover';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '../../components/ui/command';
import {
    ArrowLeft,
    Plus,
    Trash2,
    Edit,
    Loader2,
    ChevronRight,
    ChevronDown,
    MessageSquare,
    Settings2,
    AlertTriangle,
    Lock,
    LogIn,
} from 'lucide-react';
import { toast } from 'sonner';

// ============================================
// Message Form Dialog
// ============================================
interface MessageFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categoryId: string;
    parentOptionId?: string;
    editMessage?: IssueMessageDetailRes | null;
    onSuccess: () => void;
}

function MessageFormDialog({
    open,
    onOpenChange,
    categoryId,
    parentOptionId,
    editMessage,
    onSuccess,
}: MessageFormDialogProps) {
    const upsertMutation = useUpsertMessage();
    const isEdit = !!editMessage;

    const [message, setMessage] = useState(editMessage?.message || '');
    const [messageTitle, setMessageTitle] = useState(editMessage?.messageTitle || '');
    const [messageAction, setMessageAction] = useState(editMessage?.messageAction || '');
    const [messageType, setMessageType] = useState<MessageType>(editMessage?.messageType || 'Intermediate');
    const [priority, setPriority] = useState(editMessage?.priority || 1);
    const [label, setLabel] = useState(editMessage?.label || '');
    const [isActive, setIsActive] = useState(editMessage?.isActive ?? true);
    const [messageTranslations, setMessageTranslations] = useState<Translation[]>(
        editMessage?.translations?.contentTranslation || []
    );
    const [titleTranslations, setTitleTranslations] = useState<Translation[]>(
        editMessage?.translations?.titleTranslation || []
    );
    const [actionTranslations, setActionTranslations] = useState<Translation[]>(
        editMessage?.translations?.actionTranslation || []
    );

    // Reset form when dialog opens/closes or editMessage changes
    const resetForm = () => {
        setMessage(editMessage?.message || '');
        setMessageTitle(editMessage?.messageTitle || '');
        setMessageAction(editMessage?.messageAction || '');
        setMessageType(editMessage?.messageType || 'Intermediate');
        setPriority(editMessage?.priority || 1);
        setLabel(editMessage?.label || '');
        setIsActive(editMessage?.isActive ?? true);
        setMessageTranslations(editMessage?.translations?.contentTranslation || []);
        setTitleTranslations(editMessage?.translations?.titleTranslation || []);
        setActionTranslations(editMessage?.translations?.actionTranslation || []);
    };

    const handleSubmit = async () => {
        if (!message.trim()) {
            toast.error('Message content is required');
            return;
        }

        try {
            // Backend requires either categoryId OR optionId (not both)
            // When editing a message under an option, use the parentOptionId
            const data: UpsertIssueMessageReq = {
                issueMessageId: editMessage?.messageId,
                categoryId: parentOptionId ? undefined : categoryId, // Only if no parent option
                optionId: parentOptionId, // Pass optionId when message is under an option
                message: message.trim(),
                messageTitle: messageTitle.trim() || undefined,
                messageAction: messageAction.trim() || undefined,
                messageType,
                priority,
                label: label.trim() || undefined,
                isActive,
                messageTranslations,
                titleTranslations,
                actionTranslations
            };

            await upsertMutation.mutateAsync({ data });
            toast.success(isEdit ? 'Message updated' : 'Message created');
            onOpenChange(false);
            resetForm();
            onSuccess();
        } catch (error: any) {
            toast.error(error.message || 'Operation failed');
        }
    };

    const renderTranslationSection = (
        title: string,
        translations: Translation[],
        setTranslations: (t: Translation[]) => void
    ) => (
        <div className="space-y-2">
            <Label className="text-sm">{title}</Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                {LANGUAGES.map((lang) => {
                    const existing = translations.find((t) => t.language === lang);
                    return (
                        <div key={lang} className="flex items-center gap-2">
                            <span className="text-xs w-16 text-muted-foreground">{lang}</span>
                            <Input
                                value={existing?.translation || ''}
                                onChange={(e) => {
                                    const newTrans = translations.filter((t) => t.language !== lang);
                                    if (e.target.value) {
                                        newTrans.push({ language: lang, translation: e.target.value });
                                    }
                                    setTranslations(newTrans);
                                }}
                                placeholder={lang}
                                className="flex-1 h-7 text-xs"
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Message' : 'Create Message'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update the message details' : 'Add a new message to the flow'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Message Content *</Label>
                        <Textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Enter the message content..."
                            rows={3}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Title (Optional)</Label>
                            <Input
                                value={messageTitle}
                                onChange={(e) => setMessageTitle(e.target.value)}
                                placeholder="Message title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Action Text (Optional)</Label>
                            <Input
                                value={messageAction}
                                onChange={(e) => setMessageAction(e.target.value)}
                                placeholder="e.g., Contact Support"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={messageType} onValueChange={(v: MessageType) => setMessageType(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                                    <SelectItem value="Terminal">Terminal</SelectItem>
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
                            <Label>Label (Optional)</Label>
                            <Input
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="Internal label"
                            />
                        </div>
                        <div className="space-y-2 flex items-end pb-2">
                            <div className="flex items-center gap-2">
                                <Switch
                                    id="isActiveMsg"
                                    checked={isActive}
                                    onCheckedChange={setIsActive}
                                />
                                <Label htmlFor="isActiveMsg">Active</Label>
                            </div>
                        </div>
                    </div>

                    {/* Translations Sections */}
                    <div className="space-y-3">
                        <h4 className="font-medium text-sm">Translations</h4>
                        {renderTranslationSection('Message Content', messageTranslations, setMessageTranslations)}
                        {renderTranslationSection('Title', titleTranslations, setTitleTranslations)}
                        {renderTranslationSection('Action Text', actionTranslations, setActionTranslations)}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={upsertMutation.isPending || !message.trim()}>
                        {upsertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isEdit ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// Option Form Dialog
// ============================================
interface OptionFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    categoryId: string;
    parentMessageId?: string;
    editOption?: IssueOptionDetailRes | null;
    onSuccess: () => void;
}

function OptionFormDialog({
    open,
    onOpenChange,
    categoryId,
    parentMessageId,
    editOption,
    onSuccess,
}: OptionFormDialogProps) {
    const createMutation = useCreateOption();
    const updateMutation = useUpdateOption();
    const isEdit = !!editOption;

    const [option, setOption] = useState(editOption?.option || '');
    const [label, setLabel] = useState(editOption?.label || '');
    const [priority, setPriority] = useState(editOption?.priority || 1);
    const [isActive, setIsActive] = useState(editOption?.isActive ?? true);
    const [showOnlyWhenUserBlocked, setShowOnlyWhenUserBlocked] = useState(editOption?.showOnlyWhenUserBlocked || false);
    const [restrictedVariants, setRestrictedVariants] = useState<VehicleVariant[]>(
        (editOption?.restrictedVariants as VehicleVariant[]) || []
    );
    const [restrictedRideStatuses, setRestrictedRideStatuses] = useState<RideStatus[]>(
        (editOption?.restrictedRideStatuses as RideStatus[]) || []
    );
    const [igmSubCategory, setIgmSubCategory] = useState('');
    const [translations, setTranslations] = useState<Translation[]>(editOption?.translations || []);

    // Messages for new option creation
    const [messages, setMessages] = useState<CreateIssueMessageReq[]>([]);
    const [newMessageText, setNewMessageText] = useState('');
    const [newMessageTitle, setNewMessageTitle] = useState('');
    const [newMessageType, setNewMessageType] = useState<MessageType>('Intermediate');
    const [newMessagePriority, setNewMessagePriority] = useState(1);

    const resetForm = () => {
        setOption(editOption?.option || '');
        setLabel(editOption?.label || '');
        setPriority(editOption?.priority || 1);
        setIsActive(editOption?.isActive ?? true);
        setShowOnlyWhenUserBlocked(editOption?.showOnlyWhenUserBlocked || false);
        setRestrictedVariants((editOption?.restrictedVariants as VehicleVariant[]) || []);
        setRestrictedRideStatuses((editOption?.restrictedRideStatuses as RideStatus[]) || []);
        setIgmSubCategory('');
        setTranslations(editOption?.translations || []);
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

    const handleSubmit = async () => {
        if (!option.trim()) {
            toast.error('Option text is required');
            return;
        }

        if (!isEdit && messages.length === 0) {
            toast.error('At least one message is required');
            return;
        }

        try {
            if (isEdit && editOption) {
                const data: UpdateIssueOptionReq = {
                    optionId: editOption.optionId,
                    option: option.trim(),
                    label: label.trim() || undefined,
                    priority,
                    isActive,
                    showOnlyWhenUserBlocked,
                    restrictedVariants: restrictedVariants.length > 0 ? restrictedVariants : undefined,
                    restrictedRideStatuses: restrictedRideStatuses.length > 0 ? restrictedRideStatuses : undefined,
                    translations,
                };
                await updateMutation.mutateAsync(data);
                toast.success('Option updated');
            } else {
                const data: CreateIssueOptionReq = {
                    categoryId: categoryId,
                    issueMessageId: parentMessageId,
                    option: option.trim(),
                    label: label.trim() || undefined,
                    priority,
                    isActive,
                    showOnlyWhenUserBlocked,
                    restrictedVariants: restrictedVariants.length > 0 ? restrictedVariants : undefined,
                    restrictedRideStatuses: restrictedRideStatuses.length > 0 ? restrictedRideStatuses : undefined,
                    igmSubCategory: igmSubCategory.trim() || undefined,
                    translations,
                    messages,
                };
                await createMutation.mutateAsync(data);
                toast.success('Option created');
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
        <Dialog open={open} onOpenChange={(o) => { if (!o) resetForm(); onOpenChange(o); }}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Edit Option' : 'Create Option'}</DialogTitle>
                    <DialogDescription>
                        {isEdit ? 'Update the option details' : 'Add a new option to the message'}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                        <Label>Option Text *</Label>
                        <Input
                            value={option}
                            onChange={(e) => setOption(e.target.value)}
                            placeholder="Enter option text..."
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Label (Optional)</Label>
                            <Input
                                value={label}
                                onChange={(e) => setLabel(e.target.value)}
                                placeholder="Internal label"
                            />
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
                            <Label>IGM Sub-Category</Label>
                            <Input
                                value={igmSubCategory}
                                onChange={(e) => setIgmSubCategory(e.target.value)}
                                placeholder="e.g., FLM01"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Restricted Variants</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start h-auto min-h-10 font-normal">
                                        {restrictedVariants.length > 0
                                            ? restrictedVariants.join(', ')
                                            : 'Select variants...'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-80 p-0" align="start">
                                    <Command>
                                        <CommandInput placeholder="Search variants..." />
                                        <CommandList>
                                            <CommandEmpty>No variant found.</CommandEmpty>
                                            <CommandGroup className="max-h-64 overflow-auto">
                                                {VEHICLE_VARIANTS.map((variant) => (
                                                    <CommandItem
                                                        key={variant}
                                                        onSelect={() => {
                                                            setRestrictedVariants(prev =>
                                                                prev.includes(variant)
                                                                    ? prev.filter(v => v !== variant)
                                                                    : [...prev, variant]
                                                            );
                                                        }}
                                                    >
                                                        <div className={`mr-2 h-4 w-4 border rounded flex items-center justify-center ${restrictedVariants.includes(variant) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                                            {restrictedVariants.includes(variant) && (
                                                                <span className="text-primary-foreground text-xs">✓</span>
                                                            )}
                                                        </div>
                                                        {variant}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label>Restricted Ride Statuses</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start h-auto min-h-10 font-normal">
                                        {restrictedRideStatuses.length > 0
                                            ? restrictedRideStatuses.join(', ')
                                            : 'Select statuses...'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-64 p-0" align="start">
                                    <Command>
                                        <CommandList>
                                            <CommandGroup>
                                                {RIDE_STATUSES.map((status) => (
                                                    <CommandItem
                                                        key={status}
                                                        onSelect={() => {
                                                            setRestrictedRideStatuses(prev =>
                                                                prev.includes(status)
                                                                    ? prev.filter(s => s !== status)
                                                                    : [...prev, status]
                                                            );
                                                        }}
                                                    >
                                                        <div className={`mr-2 h-4 w-4 border rounded flex items-center justify-center ${restrictedRideStatuses.includes(status) ? 'bg-primary border-primary' : 'border-muted-foreground'}`}>
                                                            {restrictedRideStatuses.includes(status) && (
                                                                <span className="text-primary-foreground text-xs">✓</span>
                                                            )}
                                                        </div>
                                                        {status}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="isActiveOption"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                            <Label htmlFor="isActiveOption">Active</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                id="showOnlyWhenBlocked"
                                checked={showOnlyWhenUserBlocked}
                                onCheckedChange={setShowOnlyWhenUserBlocked}
                            />
                            <Label htmlFor="showOnlyWhenBlocked">Show only when user is blocked</Label>
                        </div>
                    </div>

                    {/* Messages Section - Only for new option creation */}
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
                        <Label>Option Translations</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
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
                                            className="flex-1 h-8 text-sm"
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
                    <Button onClick={handleSubmit} disabled={isLoading || !option.trim()}>
                        {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                        {isEdit ? 'Update' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ============================================
// Interactive Flow Tree
// ============================================
interface FlowTreeProps {
    categoryId: string;
    language: Language;
    onRefresh: () => void;
}

function InteractiveFlowTree({ categoryId, language, onRefresh }: FlowTreeProps) {
    const { data: preview, isLoading, refetch: refetchPreview } = useCategoryPreview(categoryId, language);
    const deleteMsgMutation = useDeleteMessage();
    const deleteOptMutation = useDeleteOption();

    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // Message form state
    const [messageFormOpen, setMessageFormOpen] = useState(false);
    const [editMessageData, setEditMessageData] = useState<IssueMessageDetailRes | null>(null);
    const [messageParentOptionId, setMessageParentOptionId] = useState<string | undefined>();

    // Option form state
    const [optionFormOpen, setOptionFormOpen] = useState(false);
    const [editOptionData, setEditOptionData] = useState<IssueOptionDetailRes | null>(null);
    const [optionParentMessageId, setOptionParentMessageId] = useState<string | undefined>();

    // Delete confirmation state
    const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
    const [deleteOptionId, setDeleteOptionId] = useState<string | null>(null);

    // Combined refresh function that reloads both preview and parent data
    const handleRefresh = () => {
        refetchPreview();
        onRefresh();
    };

    const toggleNode = (nodeId: string) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    const handleAddMessage = (parentOptionId?: string) => {
        setEditMessageData(null);
        setMessageParentOptionId(parentOptionId);
        setMessageFormOpen(true);
    };

    const handleEditMessage = (msg: any) => {
        // Convert flow node to detail format
        setEditMessageData({
            messageId: msg.messageId,
            message: msg.message,
            messageTitle: msg.messageTitle,
            messageAction: msg.messageAction,
            label: msg.label,
            priority: 1,
            messageType: msg.messageType,
            isActive: true,
            mediaFiles: [],
            translations: { titleTranslation: [], contentTranslation: [], actionTranslation: [] },
            childOptions: [],
        });
        setMessageParentOptionId(undefined);
        setMessageFormOpen(true);
    };

    const handleDeleteMessage = async () => {
        if (!deleteMessageId) return;
        try {
            await deleteMsgMutation.mutateAsync(deleteMessageId);
            toast.success('Message deleted');
            setDeleteMessageId(null);
            onRefresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete');
        }
    };

    const handleAddOption = (parentMessageId: string) => {
        setEditOptionData(null);
        setOptionParentMessageId(parentMessageId);
        setOptionFormOpen(true);
    };

    const handleEditOption = (opt: OptionFlowNode) => {
        setEditOptionData({
            optionId: opt.optionId,
            option: opt.option,
            label: opt.label,
            priority: 1,
            isActive: true,
            translations: [],
            childMessages: [],
        });
        setOptionParentMessageId(undefined);
        setOptionFormOpen(true);
    };

    const handleDeleteOption = async () => {
        if (!deleteOptionId) return;
        try {
            await deleteOptMutation.mutateAsync(deleteOptionId);
            toast.success('Option deleted');
            setDeleteOptionId(null);
            onRefresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to delete');
        }
    };

    const typeColors: Record<string, string> = {
        Intermediate: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
        Terminal: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
        FAQ: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
    };

    const renderMessageNode = (node: MessageFlowNode, depth: number = 0): React.ReactNode => {
        const nodeId = node.message.messageId;
        const isExpanded = expandedNodes.has(nodeId);
        const hasChildren = node.options.length > 0 || node.nextMessage !== null;

        return (
            <div key={nodeId} className="ml-4 border-l-2 border-blue-200 dark:border-blue-800 pl-4 py-2">
                <div className="group flex items-start gap-2">
                    {hasChildren ? (
                        <button
                            onClick={() => toggleNode(nodeId)}
                            className="mt-1 p-0.5 hover:bg-muted rounded"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                    ) : (
                        <div className="w-5" />
                    )}

                    <div className="flex-1 space-y-1 bg-card border rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 flex-wrap">
                                <MessageSquare className="h-4 w-4 text-blue-500" />
                                <Badge variant="outline" className={typeColors[node.message.messageType]}>
                                    {node.message.messageType}
                                </Badge>
                                {node.message.label && (
                                    <span className="text-xs text-muted-foreground">({node.message.label})</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditMessage(node.message)}
                                    className="h-7 w-7 p-0"
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddOption(node.message.messageId)}
                                    className="h-7 w-7 p-0"
                                    title="Add option"
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteMessageId(node.message.messageId)}
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                        {node.message.messageTitle && (
                            <p className="text-sm font-medium">{node.message.messageTitle}</p>
                        )}
                        <p className="text-sm text-muted-foreground">{node.message.message}</p>
                        {node.message.messageAction && (
                            <p className="text-xs text-primary font-medium">{node.message.messageAction}</p>
                        )}
                    </div>
                </div>

                {isExpanded && (
                    <>
                        {node.options.map((opt) => renderOptionNode(opt, depth + 1))}
                        {node.nextMessage && renderMessageNode(node.nextMessage, depth + 1)}
                    </>
                )}
            </div>
        );
    };

    const renderOptionNode = (opt: OptionFlowNode, depth: number): React.ReactNode => {
        const nodeId = `opt-${opt.optionId}`;
        const isExpanded = expandedNodes.has(nodeId);
        const hasChildren = opt.childNodes.length > 0;

        return (
            <div key={nodeId} className="ml-4 border-l-2 border-amber-300 dark:border-amber-700 pl-4 py-2">
                <div className="group flex items-start gap-2">
                    {hasChildren ? (
                        <button
                            onClick={() => toggleNode(nodeId)}
                            className="mt-1 p-0.5 hover:bg-muted rounded"
                        >
                            {isExpanded ? (
                                <ChevronDown className="h-4 w-4" />
                            ) : (
                                <ChevronRight className="h-4 w-4" />
                            )}
                        </button>
                    ) : (
                        <div className="w-5" />
                    )}

                    <div className="flex-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Settings2 className="h-4 w-4 text-amber-600" />
                                <Badge variant="secondary">Option</Badge>
                                <span className="text-sm font-medium">{opt.option}</span>
                                {opt.label && (
                                    <span className="text-xs text-muted-foreground">({opt.label})</span>
                                )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditOption(opt)}
                                    className="h-7 w-7 p-0"
                                >
                                    <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAddMessage(opt.optionId)}
                                    className="h-7 w-7 p-0"
                                    title="Add message"
                                >
                                    <Plus className="h-3 w-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteOptionId(opt.optionId)}
                                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>

                {isExpanded && (
                    <>
                        {opt.childNodes.map((child) => renderMessageNode(child, depth + 1))}
                    </>
                )}
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!preview || preview.flowNodes.length === 0) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">No messages yet</h3>
                    <p className="text-muted-foreground mb-4">
                        Start building your issue flow by adding the first message.
                    </p>
                    <Button onClick={() => handleAddMessage()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add First Message
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <>
            <Card>
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base">Flow Structure</CardTitle>
                        <Button size="sm" onClick={() => handleAddMessage()}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Message
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {preview.flowNodes.map((node) => renderMessageNode(node))}
                    </div>
                </CardContent>
            </Card>

            {/* Message Form Dialog */}
            <MessageFormDialog
                open={messageFormOpen}
                onOpenChange={setMessageFormOpen}
                categoryId={categoryId}
                parentOptionId={messageParentOptionId}
                editMessage={editMessageData}
                onSuccess={handleRefresh}
            />

            {/* Option Form Dialog */}
            <OptionFormDialog
                open={optionFormOpen}
                onOpenChange={setOptionFormOpen}
                categoryId={categoryId}
                parentMessageId={optionParentMessageId}
                editOption={editOptionData}
                onSuccess={handleRefresh}
            />

            {/* Delete Message Confirmation */}
            <AlertDialog open={!!deleteMessageId} onOpenChange={() => setDeleteMessageId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Message?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the message and all its child options. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteMessage}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMsgMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Option Confirmation */}
            <AlertDialog open={!!deleteOptionId} onOpenChange={() => setDeleteOptionId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Option?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will delete the option and all its child messages. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteOption}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteOptMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

// ============================================
// Category Detail Page
// ============================================
export function CategoryDetailPage() {
    const { categoryId } = useParams<{ categoryId: string }>();
    const navigate = useNavigate();
    const { merchantId, cityId } = useDashboardContext();
    const { loginModule, logout } = useAuth();

    const [language, setLanguage] = useState<Language>('ENGLISH');
    const { data: categoryDetail, isLoading, refetch } = useCategoryDetail(categoryId || null, language);

    const hasAccess = loginModule === 'BAP';

    if (!hasAccess) {
        return (
            <Page>
                <PageHeader
                    title="Category Detail"
                    breadcrumbs={[
                        { label: 'Config', href: '/config' },
                        { label: 'Issue Config', href: '/config/issue-config' },
                        { label: 'Category' },
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
                <PageHeader title="Category Detail" />
                <PageContent>
                    <Card>
                        <CardContent className="p-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                            <p className="text-muted-foreground">
                                Please select a merchant and city to manage categories.
                            </p>
                        </CardContent>
                    </Card>
                </PageContent>
            </Page>
        );
    }

    if (!categoryId) {
        return (
            <Page>
                <PageHeader title="Category Detail" />
                <PageContent>
                    <Card>
                        <CardContent className="p-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                            <p className="text-muted-foreground">Invalid category ID.</p>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/config/issue-config')}
                                className="mt-4"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Categories
                            </Button>
                        </CardContent>
                    </Card>
                </PageContent>
            </Page>
        );
    }

    return (
        <Page>
            <PageHeader
                title={isLoading ? 'Loading...' : categoryDetail?.category.category || 'Category Detail'}
                description={categoryDetail ? `Manage messages and options for this ${categoryDetail.category.categoryType.toLowerCase()}` : ''}
                breadcrumbs={[
                    { label: 'Config', href: '/config' },
                    { label: 'Issue Config', href: '/config/issue-config' },
                    { label: categoryDetail?.category.category || 'Category' },
                ]}
                actions={
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                            <Label className="text-sm">Language:</Label>
                            <Select value={language} onValueChange={(v: Language) => setLanguage(v)}>
                                <SelectTrigger className="w-32 h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGES.map((lang) => (
                                        <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => navigate('/config/issue-config')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back
                        </Button>
                    </div>
                }
            />

            <PageContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : categoryDetail ? (
                    <div className="space-y-6">
                        {/* Category Info Card */}
                        <Card>
                            <CardContent className="py-4">
                                <div className="flex items-center gap-4 flex-wrap">
                                    {categoryDetail.category.logoUrl && (
                                        <img
                                            src={categoryDetail.category.logoUrl}
                                            alt=""
                                            className="h-10 w-10 rounded object-cover"
                                        />
                                    )}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-lg font-semibold">{categoryDetail.category.category}</h2>
                                            <Badge variant={categoryDetail.category.categoryType === 'FAQ' ? 'secondary' : 'default'}>
                                                {categoryDetail.category.categoryType}
                                            </Badge>
                                            {categoryDetail.category.isRideRequired && (
                                                <Badge variant="outline">Ride/Ticket Required</Badge>
                                            )}
                                        </div>
                                        {categoryDetail.category.label && (
                                            <p className="text-sm text-muted-foreground">{categoryDetail.category.label}</p>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interactive Flow Tree */}
                        <InteractiveFlowTree
                            categoryId={categoryId}
                            language={language}
                            onRefresh={refetch}
                        />
                    </div>
                ) : (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                            <p className="text-muted-foreground">Category not found.</p>
                            <Button
                                variant="outline"
                                onClick={() => navigate('/config/issue-config')}
                                className="mt-4"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Categories
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </PageContent>
        </Page>
    );
}

export default CategoryDetailPage;
