export * from './api.generated'

export type LabeledValue = ApiContracts['LabeledValue']
export type PreviewType = ApiContracts['PreviewType']
export type CoverType = ApiContracts['CoverType']
export type PosterType = ApiContracts['PosterType']
export type UploadResourceType = ApiContracts['UploadResourceType']
export type MediaUploadPayload = ApiContracts['MediaUploadPayload']
export type ProjectUploadPayload = ApiContracts['ProjectUploadPayload']
export type UploadMediaRequest = ApiContracts['UploadMediaRequest']
export type UploadInstruction = ApiContracts['UploadInstruction']
export type ChannelMedia = ApiContracts['ChannelMedia']
export type ChannelProject = ApiContracts['ChannelProject']
export type ChannelSummary = ApiContracts['ChannelSummary']
export type ChannelDetail = ApiContracts['ChannelDetail']
export type PrivateMediaProject = ApiContracts['PrivateMediaProject']
export type PrivateMediaChannel = ApiContracts['PrivateMediaChannel']
export type MediaTokenResponse = ApiContracts['MediaTokenResponse']
export type ReportMediaResponse = ApiContracts['ReportMediaResponse']
export type OAuthProvider = ApiContracts['OAuthProvider']
export type AccountProfile = ApiContracts['AccountProfile']
export type AccountProvidersResponse = ApiContracts['AccountProvidersResponse']
export type AdminUserProvider = ApiContracts['AdminUserProvider']
export type AdminOwnedChannel = ApiContracts['AdminOwnedChannel']
export type AdminUser = ApiContracts['AdminUser']
export type AdminUsersResponse = ApiContracts['AdminUsersResponse']
export type AdminDeleteUserResponse = ApiContracts['AdminDeleteUserResponse']
export type DeadLetterQueueItem = ApiContracts['DeadLetterQueueItem']
export type RequeueOutboxResponse = ApiContracts['RequeueOutboxResponse']
export type ReportedMediaReport = ApiContracts['ReportedMediaReport']
export type ReportedMediaItem = ApiContracts['ReportedMediaItem']

export type ChannelResourceType = 'channel' | 'project' | 'media'

export interface ChannelResourceRef {
    type: ChannelResourceType
    id: string | number
}