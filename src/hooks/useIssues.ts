import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDashboardContext } from '../context/DashboardContext';
import {
    getIssuesList,
    getIssueDetails,
    updateIssueAssignee,
    updateIssueStatus,
    addIssueComment,
    sendIssuePush,
} from '../services/issues';
import type { GetIssuesParams } from '../services/issues';

export const useIssuesList = (params: GetIssuesParams) => {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();

    return useQuery({
        queryKey: ['issues', merchantShortId || merchantId, cityId, params],
        queryFn: () => getIssuesList(merchantShortId || merchantId!, cityId!, params),
        enabled: !!(merchantShortId || merchantId) && !!cityId,
        placeholderData: (previousData) => previousData,
    });
};

export const useIssueDetails = (issueId: string) => {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();

    return useQuery({
        queryKey: ['issue', merchantShortId || merchantId, cityId, issueId],
        queryFn: () => getIssueDetails(merchantShortId || merchantId!, cityId!, issueId),
        enabled: !!(merchantShortId || merchantId) && !!cityId && !!issueId,
    });
};

export const useUpdateIssueAssignee = () => {
    const queryClient = useQueryClient();
    const { merchantShortId, merchantId, cityId } = useDashboardContext();

    return useMutation({
        mutationFn: ({ issueId, assignee }: { issueId: string; assignee: string }) =>
            updateIssueAssignee(merchantShortId || merchantId!, cityId!, issueId, assignee),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['issue', merchantShortId || merchantId, cityId, variables.issueId] });
            queryClient.invalidateQueries({ queryKey: ['issues', merchantShortId || merchantId, cityId] });
        },
    });
};

export const useUpdateIssueStatus = () => {
    const queryClient = useQueryClient();
    const { merchantShortId, merchantId, cityId } = useDashboardContext();

    return useMutation({
        mutationFn: ({ issueId, status }: { issueId: string; status: string }) =>
            updateIssueStatus(merchantShortId || merchantId!, cityId!, issueId, status),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['issue', merchantShortId || merchantId, cityId, variables.issueId] });
            queryClient.invalidateQueries({ queryKey: ['issues', merchantShortId || merchantId, cityId] });
        },
    });
};

export const useAddIssueComment = () => {
    const queryClient = useQueryClient();
    const { merchantShortId, merchantId, cityId } = useDashboardContext();

    return useMutation({
        mutationFn: ({ issueId, comment }: { issueId: string; comment: string }) =>
            addIssueComment(merchantShortId || merchantId!, cityId!, issueId, comment),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['issue', merchantShortId || merchantId, cityId, variables.issueId] });
        },
    });
};

export const useSendIssuePush = () => {
    const { merchantShortId, merchantId, cityId } = useDashboardContext();

    return useMutation({
        mutationFn: ({ rideId, message, title }: { rideId: string; message: string; title: string }) =>
            sendIssuePush(merchantShortId || merchantId!, cityId!, rideId, message, title),
    });
};
