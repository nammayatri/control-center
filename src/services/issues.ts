import { bapApi } from './api';

export interface PersonDetail {
    firstName: string;
    lastName: string | null;
    middleName: string | null;
    mobileNumber: string;
    personId: string;
}

export interface IssueChat {
    actionText: string | null;
    chatType: 'Text';
    content: string;
    id: string;
    label: string | null;
    sender: 'USER' | 'BOT';
    timestamp: string;
    title: string | null;
}

export interface Issue {
    assignee: string | null;
    category: string;
    createdAt: string;
    deleted: boolean;
    issueReportId: string;
    issueReportShortId: string;
    personId: string;
    rideId: string;
    status: 'OPEN' | 'PENDING_INTERNAL' | 'PENDING_EXTERNAL' | 'RESOLVED' | 'CLOSED' | 'REOPENED' | 'NOT_APPLICABLE';
}

export interface IssueSummary {
    count: number;
    totalCount: number;
}

export interface GetIssuesResponse {
    issues: Issue[];
    summary: IssueSummary;
}

export interface IssueDetails extends Issue {
    chats: IssueChat[];
    comments: any[]; // Adjust if comment structure is known
    description: string;
    mediaFiles: any[];
    option: string;
    personDetail: PersonDetail;
}

export interface GetIssuesParams {
    limit: number;
    offset: number;
    status: string;
    category?: string;
    phoneNumber?: string;
    rideShortId?: string;
    assignee?: string;
}

// Helper to remove redundant /bap prefix if present in base URL config, 
// but based on previous fixes (NammaTags/DynamicLogic), we should avoid adding /bap manually 
// if the axios instance `bapApi` already has it. 
// However, the curl shows `/api/bap/NAMMA_YATRI/Bangalore/issueV2/...`
// `bapApi` usually is configured with `/api/bap`.
// So we just append `/${merchantId}/${cityId}/issueV2/...`

export const getIssuesList = async (
    merchantId: string,
    cityId: string,
    params: GetIssuesParams
) => {
    // Manually ensure status is double-quoted
    const queryParams = {
        ...params,
        status: `"${params.status}"`
    };

    const response = await bapApi.get<GetIssuesResponse>(
        `/${merchantId}/${cityId}/issueV2/list`,
        { params: queryParams }
    );
    return response.data;
};

export const getIssueDetails = async (
    merchantId: string,
    cityId: string,
    issueId: string
) => {
    const response = await bapApi.get<IssueDetails>(
        `/${merchantId}/${cityId}/issueV2/${issueId}/info`
    );
    return response.data;
};

export const updateIssueAssignee = async (
    merchantId: string,
    cityId: string,
    issueId: string,
    assignee: string
) => {
    const response = await bapApi.put(
        `/${merchantId}/${cityId}/issueV2/${issueId}/update`,
        { assignee }
    );
    return response.data;
};

export const updateIssueStatus = async (
    merchantId: string,
    cityId: string,
    issueId: string,
    status: string
) => {
    const response = await bapApi.put(
        `/${merchantId}/${cityId}/issueV2/${issueId}/update`,
        { status }
    );
    return response.data;
};

export const addIssueComment = async (
    merchantId: string,
    cityId: string,
    issueId: string,
    comment: string
) => {
    const response = await bapApi.post(
        `/${merchantId}/${cityId}/issueV2/${issueId}/comment`,
        { comment }
    );
    return response.data;
};

export const sendIssuePush = async (
    merchantId: string,
    cityId: string,
    rideId: string,
    message: string,
    title: string
) => {
    // Note: The curl used `/api/bap/NAMMA_YATRI/Bangalore/rideBooking/multiModal/sendMessage/...`
    // This is a different path structure than issueV2.
    // Assuming rideBooking aligns with bapApi base.
    const response = await bapApi.post(
        `/${merchantId}/${cityId}/rideBooking/multiModal/sendMessage/${rideId}/`,
        {
            title,
            message,
            channel: 'PUSH_NOTIFICATION',
        }
    );
    return response.data;
};
