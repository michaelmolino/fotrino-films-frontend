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