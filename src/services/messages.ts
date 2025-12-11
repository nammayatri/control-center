import { bppApi, apiRequest, buildPath, buildQueryParams } from './api';
import type { Message, MessageDetail, MessageDeliveryInfo, Summary } from '../types';

// ============================================
// Message APIs
// ============================================

export interface MessageListResponse {
  messages: Message[];
  summary: Summary;
}

export async function listMessages(
  merchantId: string,
  cityId?: string,
  limit?: number,
  offset?: number
): Promise<MessageListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/message/list`
    : `/bpp/driver-offer/{merchantId}/message/list`;
  
  const path = buildPath(basePath, merchantId, cityId);
  const query = buildQueryParams({ limit, offset });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export async function getMessageInfo(
  merchantId: string,
  messageId: string,
  cityId?: string
): Promise<MessageDetail> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/message/{messageId}/info`
    : `/bpp/driver-offer/{merchantId}/message/{messageId}/info`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{messageId}', messageId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

export async function getMessageDeliveryInfo(
  merchantId: string,
  messageId: string,
  cityId?: string
): Promise<MessageDeliveryInfo> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/message/{messageId}/deliveryInfo`
    : `/bpp/driver-offer/{merchantId}/message/{messageId}/deliveryInfo`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{messageId}', messageId);
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: path,
  });
}

export interface MessageReceiverItem {
  receiverId: string;
  receiverName: string;
  receiverNumber: string;
  status: string;
  seen?: boolean;
  liked?: boolean;
  reply?: string;
}

export interface MessageReceiverListResponse {
  receivers: MessageReceiverItem[];
  summary: Summary;
}

export async function getMessageReceivers(
  merchantId: string,
  messageId: string,
  cityId?: string,
  limit?: number,
  offset?: number
): Promise<MessageReceiverListResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/message/{messageId}/receiverList`
    : `/bpp/driver-offer/{merchantId}/message/{messageId}/receiverList`;
  
  const path = buildPath(basePath, merchantId, cityId).replace('{messageId}', messageId);
  const query = buildQueryParams({ limit, offset });
  
  return apiRequest(bppApi, {
    method: 'GET',
    url: `${path}${query}`,
  });
}

export interface AddMessageRequest {
  _type: 'Text' | 'Audio' | 'Image';
  title: string;
  description: string;
  shortDescription: string;
  label?: string;
  translations: Array<{
    language: string;
    title: string;
    description: string;
    shortDescription: string;
    label?: string;
  }>;
  mediaFiles?: string[];
  alwaysTriggerOnOnboarding?: boolean;
}

export interface AddMessageResponse {
  messageId: string;
}

export async function addMessage(
  merchantId: string,
  data: AddMessageRequest,
  cityId?: string
): Promise<AddMessageResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/message/add`
    : `/bpp/driver-offer/{merchantId}/message/add`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

export interface EditMessageRequest {
  messageId: string;
  title?: string;
  description?: string;
  shortDescription?: string;
  label?: string;
  messageTranslations?: Array<{
    language: string;
    title: string;
    description: string;
    shortDescription: string;
    label?: string;
  }>;
}

export async function editMessage(
  merchantId: string,
  data: EditMessageRequest,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/message/edit`
    : `/bpp/driver-offer/{merchantId}/message/edit`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

export interface SendMessageRequest {
  messageId: string;
  driverIds?: string[];
  vehicleVariant?: string;
  driverTags?: string[];
}

export async function sendMessage(
  merchantId: string,
  data: SendMessageRequest,
  cityId?: string
): Promise<void> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/message/send`
    : `/bpp/driver-offer/{merchantId}/message/send`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

export interface UploadFileResponse {
  fileId: string;
}

export async function uploadMessageFile(
  merchantId: string,
  file: File,
  cityId?: string
): Promise<UploadFileResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/message/uploadFile`
    : `/bpp/driver-offer/{merchantId}/message/uploadFile`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  const formData = new FormData();
  formData.append('file', file);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
}

export interface AddLinkAsMediaRequest {
  url: string;
  fileType: 'Audio' | 'Video' | 'Image' | 'PDF';
}

export async function addLinkAsMedia(
  merchantId: string,
  data: AddLinkAsMediaRequest,
  cityId?: string
): Promise<UploadFileResponse> {
  const basePath = cityId && cityId !== 'all'
    ? `/bpp/driver-offer/{merchantId}/{city}/message/addLink`
    : `/bpp/driver-offer/{merchantId}/message/addLink`;
  
  const path = buildPath(basePath, merchantId, cityId);
  
  return apiRequest(bppApi, {
    method: 'POST',
    url: path,
    data,
  });
}

