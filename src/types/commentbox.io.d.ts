declare module 'commentbox.io' {
    interface CommentBoxLocation {
        href: string
        search: string
    }

    interface CommentBoxOptions {
        textColor?: string
        createBoxUrl?: (boxId: string, pageLocation: CommentBoxLocation) => string
        onCommentCount?: (count: number) => void
        singleSignOn?: {
            autoSignOn?: boolean
            onSignOn?: (
                onComplete: (token: string) => void,
                onError: (error: any) => void
            ) => void
            onSignOut?: () => void
        }
    }

    function commentBox(instanceId: string, options?: CommentBoxOptions): void

    export = commentBox
}