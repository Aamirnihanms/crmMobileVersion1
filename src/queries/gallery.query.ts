import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    addVideo,
    createFolder,
    createGallery,
    CreateGalleryPayload,
    fetchFolderByUid,
    fetchFolders,
    fetchGalleries,
    fetchGalleryByUid,
    fetchVideos,
    GalleriesResponse,
    updateVideo,
    deleteVideo,
    updateFolder,
    deleteFolder,
    updateGallery,
    deleteGallery
} from '../api/gallery.api';

export const useInfiniteGalleries = (search: string = '', batchUid?: string) => {
    return useInfiniteQuery({
        queryKey: ['galleries', search, batchUid],
        initialPageParam: 1,
        queryFn: ({ pageParam }) => fetchGalleries(pageParam, 10, search, batchUid),
        getNextPageParam: (lastPage: GalleriesResponse) => {
            if (lastPage.current_page >= lastPage.total_pages) {
                return undefined;
            }
            return lastPage.current_page + 1;
        },
    });
};

export const useGalleryDetail = (uid: string) => {
    return useQuery({
        queryKey: ['gallery', uid],
        queryFn: () => fetchGalleryByUid(uid),
        enabled: !!uid,
    });
};

export const useGalleryVideos = (params: {
    gallery_uid: string;
    folder_uid?: string;
    without_folder?: boolean;
}) => {
    return useInfiniteQuery({
        queryKey: ['gallery-videos', params],
        initialPageParam: 1,
        queryFn: ({ pageParam }) => fetchVideos({ ...params, page: pageParam }),
        getNextPageParam: (lastPage) => {
            if (lastPage.pagination.current_page >= lastPage.pagination.total_pages) {
                return undefined;
            }
            return lastPage.pagination.current_page + 1;
        },
        enabled: !!params.gallery_uid,
    });
};

export const useGalleryFolders = (params: {
    gallery_uid: string;
    parent_folder_uid?: string;
}) => {
    return useQuery({
        queryKey: ['gallery-folders', params],
        queryFn: () => fetchFolders(params),
        enabled: !!params.gallery_uid,
    });
};

export const useFolderDetail = (uid: string) => {
    return useQuery({
        queryKey: ['folder', uid],
        queryFn: () => fetchFolderByUid(uid),
        enabled: !!uid,
    });
};

export const useCreateGallery = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload: CreateGalleryPayload) => createGallery(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['galleries'] });
        },
    });
};

export const useCreateFolder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createFolder,
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['gallery-folders', { gallery_uid: variables.gallery }] });
            if (variables.parent_folder) {
                void queryClient.invalidateQueries({ queryKey: ['folder', variables.parent_folder] });
            }
        },
    });
};

export const useUpdateFolder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ uid, payload }: { uid: string; payload: any }) => updateFolder(uid, payload),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['gallery-folders'] });
            void queryClient.invalidateQueries({ queryKey: ['folder'] });
        },
    });
};

export const useDeleteFolder = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteFolder,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['gallery-folders'] });
            void queryClient.invalidateQueries({ queryKey: ['folder'] });
            void queryClient.invalidateQueries({ queryKey: ['galleries'] });
        },
    });
};

export const useAddVideo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: addVideo,
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['gallery-videos'] });
            if (variables.folder) {
                void queryClient.invalidateQueries({ queryKey: ['folder', variables.folder] });
            }
        },
    });
};

export const useUpdateVideo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ uid, payload }: { uid: string; payload: any }) => updateVideo(uid, payload),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['gallery-videos'] });
            // Folder detail also contains videos
            void queryClient.invalidateQueries({ queryKey: ['folder'] });
        },
    });
};

export const useDeleteVideo = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteVideo,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['gallery-videos'] });
            void queryClient.invalidateQueries({ queryKey: ['folder'] });
        },
    });
};

export const useUpdateGallery = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ uid, payload }: { uid: string; payload: CreateGalleryPayload }) => updateGallery(uid, payload),
        onSuccess: (_data, variables) => {
            void queryClient.invalidateQueries({ queryKey: ['galleries'] });
            void queryClient.invalidateQueries({ queryKey: ['gallery', variables.uid] });
        },
    });
};

export const useDeleteGallery = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteGallery,
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['galleries'] });
        },
    });
};
