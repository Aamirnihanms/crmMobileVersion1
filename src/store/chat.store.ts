import { create } from 'zustand';
import { 
    ApiMessage, 
    createMessage, 
    generatePresignedUploadUrl, 
    getUploadedFileUrl, 
    PresignedUploadFile, 
    uploadFileToPresignedPost 
} from '../api/chat.api';

export type PendingUpload = {
    chatId: string;
    tempId: string;
    attachment: {
        uri: string;
        name: string;
        mimeType: string;
        size?: number;
        isImage: boolean;
        isVideo?: boolean;
    };
    progress: number;
    status: 'sending' | 'failed' | 'completed';
    error?: string;
    caption?: string;
    replyToId?: string;
};

type ChatState = {
    pendingUploads: Record<string, PendingUpload>; // Keyed by tempId
    addUpload: (upload: Omit<PendingUpload, 'progress' | 'status'>) => void;
    updateUpload: (tempId: string, updates: Partial<PendingUpload>) => void;
    removeUpload: (tempId: string) => void;
    processUpload: (tempId: string, options: { 
        onSuccess?: (msg: ApiMessage) => void;
    }) => Promise<void>;
};

export const useChatStore = create<ChatState>((set, get) => ({
    pendingUploads: {},

    addUpload: (upload) => set((state) => ({
        pendingUploads: {
            ...state.pendingUploads,
            [upload.tempId]: { ...upload, progress: 0, status: 'sending' }
        }
    })),

    updateUpload: (tempId, updates) => set((state) => ({
        pendingUploads: {
            ...state.pendingUploads,
            [tempId]: { ...state.pendingUploads[tempId], ...updates }
        }
    })),

    removeUpload: (tempId) => set((state) => {
        const next = { ...state.pendingUploads };
        delete next[tempId];
        return { pendingUploads: next };
    }),

    processUpload: async (tempId, { onSuccess }) => {
        const upload = get().pendingUploads[tempId];
        if (!upload) return;

        try {
            const presigned = await generatePresignedUploadUrl({
                file_name: upload.attachment.name,
                folder: 'chat',
            });

            if (!presigned?.success) {
                throw new Error('Unable to generate upload URL');
            }

            const uploadFile: PresignedUploadFile = {
                uri: upload.attachment.uri,
                name: upload.attachment.name,
                type: upload.attachment.mimeType,
            };

            await uploadFileToPresignedPost(presigned, uploadFile, (event) => {
                const progressValue = event.total ? event.loaded / event.total : 0;
                get().updateUpload(tempId, { progress: progressValue });
            });

            const uploadedUrl = getUploadedFileUrl(presigned);
            if (!uploadedUrl) {
                throw new Error('Uploaded URL missing');
            }

            const payload: Record<string, unknown> = {
                content: upload.caption || (upload.attachment.isImage ? 'Image attachment' : 'File attachment'),
                message_type: upload.attachment.isImage ? 'image' : 'file',
                file_url: uploadedUrl,
                file: uploadedUrl,
                attachment_url: uploadedUrl,
                file_name: upload.attachment.name,
                original_filename: upload.attachment.name,
                s3_key: presigned.s3_key,
                content_type: upload.attachment.mimeType,
            };

            if (upload.replyToId) {
                payload.reply_to = upload.replyToId;
            }

            const response = await createMessage(upload.chatId, payload, { silent: true } as any);
            const confirmed = response?.message as ApiMessage | undefined;

            if (confirmed?.uid) {
                onSuccess?.(confirmed);
            }
            
            get().removeUpload(tempId);
        } catch (err: any) {
            console.error(`Upload ${tempId} failed:`, err);
            get().updateUpload(tempId, { 
                status: 'failed', 
                error: err?.message || 'Upload failed' 
            });
        }
    }
}));
