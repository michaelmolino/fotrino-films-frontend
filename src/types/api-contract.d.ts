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