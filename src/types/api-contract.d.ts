export * from './api.generated'

export type ChannelResourceType = 'channel' | 'project' | 'media'

export interface ChannelResourceRef {
    type: ChannelResourceType
    id: string | number
}