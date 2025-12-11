import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useIssueDetails, useUpdateIssueAssignee, useUpdateIssueStatus, useAddIssueComment, useSendIssuePush } from '../../hooks/useIssues';
import { Page, PageHeader, PageContent } from '../../components/layout/Page';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';

import { Skeleton } from '../../components/ui/skeleton';
import { Separator } from '../../components/ui/separator';
import { Label } from '../../components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '../../components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../components/ui/select';
import { ArrowLeft, User, Phone, Send, Bell, CheckCircle, AlertCircle, Hash } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

export default function IssueDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [comment, setComment] = useState('');


    // Push Notification State
    const [pushMessage, setPushMessage] = useState('');
    const [pushTitle, setPushTitle] = useState('');
    const [isPushDialogOpen, setIsPushDialogOpen] = useState(false);

    // Editing State
    const [assignee, setAssignee] = useState('');
    const [isEditingAssignee, setIsEditingAssignee] = useState(false);

    const { data: issue, isLoading, error } = useIssueDetails(id!);

    const updateAssigneeMutation = useUpdateIssueAssignee();
    const updateStatusMutation = useUpdateIssueStatus();
    const addCommentMutation = useAddIssueComment();
    const sendPushMutation = useSendIssuePush();

    const handleUpdateStatus = (newStatus: string) => {
        toast.promise(updateStatusMutation.mutateAsync({ issueId: id!, status: newStatus }), {
            loading: 'Updating status...',
            success: 'Status updated successfully',
            error: 'Failed to update status',
        });
    };

    const handleUpdateAssignee = () => {
        toast.promise(updateAssigneeMutation.mutateAsync({ issueId: id!, assignee }), {
            loading: 'Updating assignee...',
            success: () => {
                setIsEditingAssignee(false);
                return 'Assignee updated successfully';
            },
            error: 'Failed to update assignee',
        });
    };

    const handleAddComment = () => {
        if (!comment.trim()) return;
        toast.promise(addCommentMutation.mutateAsync({ issueId: id!, comment }), {
            loading: 'Adding comment...',
            success: () => {
                setComment('');
                return 'Comment added successfully';
            },
            error: 'Failed to add comment',
        });
    };

    const handleSendPush = () => {
        if (!pushTitle.trim() || !pushMessage.trim()) return;
        toast.promise(sendPushMutation.mutateAsync({
            rideId: issue?.rideId!,
            title: pushTitle,
            message: pushMessage
        }), {
            loading: 'Sending notification...',
            success: () => {
                setIsPushDialogOpen(false);
                setPushTitle('');
                setPushMessage('');
                return 'Notification sent successfully';
            },
            error: 'Failed to send notification',
        });
    };

    if (isLoading) {
        return (
            <Page>
                <PageHeader title="Issue Details" description="Loading..." />
                <PageContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Skeleton className="h-[600px] md:col-span-2" />
                        <Skeleton className="h-[400px]" />
                    </div>
                </PageContent>
            </Page>
        );
    }

    if (error || !issue) {
        return (
            <div className="flex flex-col items-center justify-center h-screen">
                <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Issue Not Found</h2>
                <Button onClick={() => navigate('/ops/issues')}>Back to Issues</Button>
            </div>
        );
    }

    return (
        <Page>
            <div className="mb-4">
                <Button variant="ghost" className="pl-0 hover:bg-transparent" onClick={() => navigate('/ops/issues')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Issues
                </Button>
            </div>

            <PageHeader
                title={`Issue #${issue.issueReportShortId || issue.issueReportId.slice(0, 8)}`}
                description={`Created on ${format(new Date(issue.createdAt), 'PPpp')}`}
            />

            <PageContent>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Chat and Activity Section */}
                    <div className="lg:col-span-3 space-y-6">
                        {/* Chat History */}
                        <Card className="h-[600px] flex flex-col">
                            <CardHeader className="border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <MessageSquare className="h-5 w-5" />
                                    Conversation History
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950/50">
                                {issue.chats.map((chat) => (
                                    <div
                                        key={chat.id || Math.random().toString()}
                                        className={cn(
                                            "flex flex-col max-w-[80%] rounded-lg p-3 text-sm",
                                            chat.sender === 'USER'
                                                ? "ml-auto bg-primary text-primary-foreground rounded-br-none"
                                                : "bg-muted rounded-bl-none border"
                                        )}
                                    >
                                        <p>{chat.content}</p>
                                        <span className="text-[10px] opacity-70 mt-1 self-end">
                                            {format(new Date(chat.timestamp), 'h:mm a')}
                                        </span>
                                    </div>
                                ))}
                                {issue.chats.length === 0 && (
                                    <div className="text-center text-muted-foreground py-10">
                                        No conversation history available.
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Internal Comments */}
                        <Card className="flex flex-col h-[400px]">
                            <CardHeader className="border-b">
                                <CardTitle className="flex items-center gap-2">
                                    <Hash className="h-5 w-5" />
                                    Internal Comments
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                                {issue.comments?.length ? (
                                    issue.comments.map((comment: any, index: number) => (
                                        <div key={index} className="bg-muted p-3 rounded-lg text-sm">
                                            <p>{comment.comment || comment.text || JSON.stringify(comment)}</p>
                                            <div className="flex justify-between items-center mt-1">
                                                <span className="text-[10px] opacity-70">
                                                    {comment.timestamp ? format(new Date(comment.timestamp), 'MMM d, h:mm a') : ''}
                                                </span>
                                                <span className="text-[10px] opacity-70 font-medium ml-2">
                                                    {(comment?.authorDetail?.firstName + " " + comment?.authorDetail?.lastName) || 'System'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center text-muted-foreground py-10">
                                        No internal comments yet.
                                    </div>
                                )}
                            </CardContent>
                            <div className="p-4 border-t bg-background">
                                <div className="flex gap-2">
                                    <Textarea
                                        placeholder="Add an internal comment..."
                                        value={comment}
                                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)}
                                        className="resize-none min-h-[44px]"
                                    />
                                    <Button onClick={handleAddComment} disabled={addCommentMutation.isPending || !comment.trim()}>
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    </div>

                    {/* Sidebar Details Section */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Status & Assignment */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs text-muted-foreground">Category</Label>
                                    <div className="font-medium">{issue.category}</div>
                                </div>
                                <Separator />

                                <div>
                                    <Label className="text-xs text-muted-foreground mb-1 block">Status</Label>
                                    <Select value={issue.status} onValueChange={handleUpdateStatus} disabled={updateStatusMutation.isPending}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="OPEN">Open</SelectItem>
                                            <SelectItem value="PENDING_INTERNAL">Pending Internal</SelectItem>
                                            <SelectItem value="PENDING_EXTERNAL">Pending External</SelectItem>
                                            <SelectItem value="RESOLVED">Resolved</SelectItem>
                                            <SelectItem value="CLOSED">Closed</SelectItem>
                                            <SelectItem value="REOPENED">Reopened</SelectItem>
                                            <SelectItem value="NOT_APPLICABLE">Not Applicable</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-1">
                                        <Label className="text-xs text-muted-foreground">Assignee</Label>
                                        <Button
                                            variant="link"
                                            className="h-auto p-0 text-xs"
                                            onClick={() => {
                                                setAssignee(issue.assignee || '');
                                                setIsEditingAssignee(!isEditingAssignee);
                                            }}
                                        >
                                            {isEditingAssignee ? 'Cancel' : 'Edit'}
                                        </Button>
                                    </div>
                                    {isEditingAssignee ? (
                                        <div className="flex gap-2">
                                            <Input
                                                value={assignee}
                                                onChange={(e) => setAssignee(e.target.value)}
                                                placeholder="Name"
                                                className="h-8"
                                            />
                                            <Button size="sm" className="h-8" onClick={handleUpdateAssignee} disabled={updateAssigneeMutation.isPending}>
                                                <CheckCircle className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-muted-foreground" />
                                            <span>{issue.assignee || 'Unassigned'}</span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Customer Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Customer Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {issue.personDetail.firstName?.[0]?.toUpperCase() || 'U'}
                                    </div>
                                    <div>
                                        <div className="font-medium">
                                            {issue.personDetail.firstName} {issue.personDetail.lastName}
                                        </div>
                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                            <Phone className="h-3 w-3" />
                                            {issue.personDetail.mobileNumber}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-2">
                                    <ViewCustomerProfileButton
                                        mobileNumber={issue.personDetail.mobileNumber}
                                        fallbackPersonId={issue.personDetail.personId}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        {/* Ride Info Link */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ride Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="mb-4">
                                    <div className="text-sm text-muted-foreground mb-1">Ride ID</div>
                                    <div className="font-mono text-xs break-all bg-muted p-2 rounded">
                                        {issue.rideId}
                                    </div>
                                </div>
                                <Button className="w-full" variant="secondary" onClick={() => navigate(`/ops/rides/${issue.rideId}`)}>
                                    View Ride Details
                                </Button>
                            </CardContent>
                        </Card>

                        {/* Actions */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Actions</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Dialog open={isPushDialogOpen} onOpenChange={setIsPushDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button className="w-full" variant="outline">
                                            <Bell className="mr-2 h-4 w-4" />
                                            Send Push Notification
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Send Push Notification</DialogTitle>
                                            <DialogDescription>
                                                Send a message directly to the customer's device regarding this issue.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="title">Title</Label>
                                                <Input
                                                    id="title"
                                                    placeholder="Notification Title"
                                                    value={pushTitle}
                                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPushTitle(e.target.value)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="message">Message</Label>
                                                <Textarea
                                                    id="message"
                                                    placeholder="Enter your message..."
                                                    value={pushMessage}
                                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPushMessage(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button variant="outline" onClick={() => setIsPushDialogOpen(false)}>Cancel</Button>
                                            <Button onClick={handleSendPush} disabled={sendPushMutation.isPending}>
                                                Send
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </PageContent>
        </Page>
    );
}

// Helper icons
function MessageSquare({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    )
}

function ViewCustomerProfileButton({ mobileNumber, fallbackPersonId }: { mobileNumber: string; fallbackPersonId: string }) {
    const navigate = useNavigate();

    const handleClick = async () => {
        navigate(`/ops/customers/${fallbackPersonId}?phone=${mobileNumber}`);
    };

    return (
        <Button
            variant="outline"
            className="w-full"
            onClick={handleClick}
        >
            View Customer Profile
        </Button>
    );
}
