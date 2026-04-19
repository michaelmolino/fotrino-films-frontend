export type LabeledValue = {
    value: number | string
    label?: string | null
}

export type PreviewType = 'frame' | 'new'
export type CoverType = 'profile' | 'new'
export type PosterType = 'default' | 'new'
export type UploadResourceType = 'cover' | 'poster' | 'preview' | 'upload'

export interface MediaUploadPayload {
    filename?: string | null
    title?: string | null
    description?: string | null
    main: boolean
    previewType: PreviewType
    resourceDate: string
}

export interface ProjectUploadPayload {
    id: LabeledValue | null
    posterType: PosterType
    title?: string | null
    subtitle?: string | null
    poster_color?: string | null
    media: MediaUploadPayload
}

export interface UploadMediaRequest {
    uuid: LabeledValue | null
    coverType: CoverType
    title?: string | null
    project: ProjectUploadPayload
}

export interface UploadInstruction {
    resourceType: UploadResourceType
    reference: number
    url: string
}

export interface ChannelMedia {
    id: number
    private_id: string
    project: number
    resource_date: string | null
    title: string
    slug: string
    description_unsafe: string | null
    preview: string | null
    src: string | null
    type: string | null
    main: boolean | null
    created: string | null
    deleted: boolean
    pending: boolean
}

export interface ChannelProject {
    id: number
    channel: number
    resource_date: string | null
    title: string
    slug: string
    subtitle: string | null
    poster: string | null
    poster_color: string | null
    created: string | null
    deleted: boolean
    pending: boolean
    media: ChannelMedia[]
}

export interface ChannelSummary {
    id: number
    owner: number
    title: string
    slug: string
    cover: string | null
    uuid: string
    created: string
    deleted: boolean
    pending: boolean
}

export interface ChannelDetail extends ChannelSummary {
    ownername: string | null
    projects: ChannelProject[]
}

export interface PrivateMediaProject {
    title: string
    media: ChannelMedia
}

export interface PrivateMediaChannel {
    title: string
    cover: string | null
    ownername: string
    project: PrivateMediaProject
}

export interface MediaTokenResponse {
    token: string
    expires_at: string
    src: string
}

export interface ReportMediaResponse {
    reported: boolean
    message?: string
}

export type ChannelResourceType = 'channel' | 'project' | 'media'

export interface ChannelResourceRef {
    type: ChannelResourceType
    id: string | number
}

export type OAuthProvider = 'apple' | 'facebook' | 'github' | 'google' | 'microsoft' | 'yahoo' | 'test'

export interface AccountProfile {
    id: number
    name: string
    email: string
    profile_pic: string | null
    country: string | null
    csrf_token: string
    last_login: string | null
    created: string | null
    is_admin: boolean
    deleted: boolean
    identity_provider?: string | null
}

export interface AccountProvidersResponse {
    providers: OAuthProvider[]
}

export interface AdminUserProvider {
    provider: string
    external_id: string
}

export interface AdminOwnedChannel {
    id: number
    title: string
    slug: string
    cover: string | null
    uuid: string
    created: string | null
}

export interface AdminUser {
    id: number
    name: string
    email: string
    profile_pic: string | null
    country: string | null
    is_admin: boolean
    last_login: string | null
    created: string | null
    deleted: boolean
    providers: AdminUserProvider[]
    channels: AdminOwnedChannel[]
}

export interface AdminUsersResponse {
    users: AdminUser[]
}

export interface AdminDeleteUserResponse {
    user_id: number
    deleted: boolean
}

export interface DeadLetterQueueItem {
    id: number
    created: string | null
    available_at: string | null
    type: string
    payload: unknown
    attempts: number
    last_error: string | null
}

export interface RequeueOutboxResponse {
    event_id: number
    requeued: boolean
    error?: string
}

export interface ReportedMediaReport {
    reporter: string
    reason: string | null
    created_at: string
}

export interface ReportedMediaItem {
    media_id: number
    private_id: string
    title: string
    reports: ReportedMediaReport[]
}