import { http } from './http';

export type GalleryBatch = {
    uid: string;
    batch_name: string;
    course_name: string;
    is_active: boolean;
    start_date?: string;
    end_date?: string;
};

export type Video = {
    uid: string;
    title: string;
    description: string;
    video_source: string;
    video_url: string;
    video_file: string | null;
    thumbnail_url: string | null;
    thumbnail: string | null;
    duration: string | null;
    file_size: string | null;
    display_order: number;
    gallery: string;
    folder: string | null;
    uploaded_by: number;
    uploaded_by_name: string;
    is_active: boolean;
    location_path: string;
    video_link: string;
    thumbnail_link: string | null;
    embed_code: string;
    created_at: string;
    updated_at: string;
};

export type Folder = {
    uid: string;
    name: string;
    description: string;
    icon: string;
    gallery: string;
    parent_folder: string | null;
    display_order: number;
    videos_count: number;
    subfolders_count: number;
    created_by: number;
    created_by_name: string;
    created_at: string;
    updated_at: string;
    videos?: Video[];
    subfolders?: Folder[];
};

export type Gallery = {
    uid: string;
    name: string;
    description: string;
    thumbnail: string | null;
    is_common: boolean;
    is_active: boolean;
    videos_count: number;
    folders_count: number;
    created_by: number;
    created_by_name: string;
    assigned_batches: GalleryBatch[];
    batches_assigned?: GalleryBatch[]; // From detail API
    folders?: Folder[]; // From detail API
    videos_without_folder?: Video[]; // From detail API
    created_at: string;
    updated_at: string;
};

export type GallerySummary = {
    total_galleries: number;
    common_galleries: number;
    active_galleries: number;
    total_videos: number;
    total_folders: number;
};

export type GalleriesResponse = {
    status: string;
    count: number;
    next: string | null;
    previous: string | null;
    page_size: number;
    current_page: number;
    total_pages: number;
    galleries: Gallery[];
    summary: GallerySummary;
};

export type GalleryDetailResponse = {
    status: string;
    gallery: Gallery;
};

export type VideosResponse = {
    status: string;
    videos: Video[];
    summary: {
        total_videos: number;
        active_videos: number;
        total_duration: number;
        total_size: number;
    };
    pagination: {
        count: number;
        next: string | null;
        previous: string | null;
        current_page: number;
        total_pages: number;
        page_size: number;
    };
};

export type FoldersResponse = {
    status: string;
    folders: Folder[];
    summary: {
        total_folders: number;
        total_videos: number;
    };
};

export type FolderDetailResponse = {
    status: string;
    folder: Folder;
};

export type CreateGalleryPayload = {
    name: string;
    description: string;
    is_active: boolean;
    is_common: boolean;
    batch_uids: string[];
};

export const fetchGalleries = async (
    page: number = 1, 
    pageSize: number = 10, 
    search: string = '',
    batchUid?: string
): Promise<GalleriesResponse> => {
    console.log('➡️ GET galleries:', { page, page_size: pageSize, search, batch_uid: batchUid });
    const res = await http.get('/galleries/', {
        params: {
            page,
            page_size: pageSize,
            search: search || undefined,
            batch_uid: batchUid || undefined,
        },
    });
    return res.data;
};

export const fetchGalleryByUid = async (uid: string): Promise<Gallery> => {
    console.log('➡️ GET gallery detail:', uid);
    const res = await http.get<GalleryDetailResponse>(`/galleries/${uid}/`);
    return res.data.gallery;
};

export const fetchVideos = async (params: {
    gallery_uid: string;
    page?: number;
    page_size?: number;
    folder_uid?: string;
    without_folder?: boolean;
    ordering?: string;
}): Promise<VideosResponse> => {
    console.log('➡️ GET videos:', params);
    const res = await http.get<VideosResponse>('/videos/', {
        params: {
            ...params,
            page: params.page || 1,
            page_size: params.page_size || 10,
            without_folder: params.without_folder !== undefined ? params.without_folder : undefined,
            ordering: params.ordering || 'display_order',
        },
    });
    return res.data;
};

export const fetchFolders = async (params: {
    gallery_uid: string;
    parent_folder_uid?: string;
}): Promise<Folder[]> => {
    console.log('➡️ GET folders:', params);
    const res = await http.get<FoldersResponse>('/folders/', {
        params: {
            gallery_uid: params.gallery_uid,
            parent_folder: params.parent_folder_uid || undefined,
        },
    });
    return res.data.folders;
};

export const fetchFolderByUid = async (uid: string): Promise<Folder> => {
    console.log('➡️ GET folder detail:', uid);
    const res = await http.get<FolderDetailResponse>(`/folders/${uid}/`);
    return res.data.folder;
};

export type CreateFolderPayload = {
    name: string;
    description: string;
    gallery: string;
    parent_folder?: string | null;
};

export type AddVideoPayload = {
    title: string;
    description: string;
    video_url: string;
    video_source: 'url' | 'file';
    is_active: boolean;
    gallery: string;
    folder?: string | null;
};

export const createGallery = async (payload: CreateGalleryPayload): Promise<{ status: string; message?: string }> => {
    console.log('➡️ POST create gallery:', payload);
    const res = await http.post('/galleries/create/', payload);
    return res.data;
};

export const createFolder = async (payload: CreateFolderPayload): Promise<{ status: string; message?: string }> => {
    console.log('➡️ POST create folder:', payload);
    const res = await http.post('/folders/create/', payload);
    return res.data;
};

export const updateFolder = async (uid: string, payload: Partial<CreateFolderPayload>): Promise<{ status: string; message?: string }> => {
    console.log('➡️ PUT update folder:', uid, payload);
    const res = await http.put(`/folders/${uid}/`, payload);
    return res.data;
};

export const deleteFolder = async (uid: string): Promise<{ status: string; message?: string }> => {
    console.log('➡️ DELETE folder:', uid);
    const res = await http.delete(`/folders/${uid}/`);
    return res.data;
};

export const addVideo = async (payload: AddVideoPayload): Promise<{ status: string; message?: string }> => {
    console.log('➡️ POST add video:', payload);
    const res = await http.post('/videos/create/', payload);
    return res.data;
};

export const updateVideo = async (uid: string, payload: Partial<AddVideoPayload>): Promise<{ status: string; message?: string }> => {
    console.log('➡️ PUT update video:', uid, payload);
    const res = await http.put(`/videos/${uid}/`, payload);
    return res.data;
};

export const deleteVideo = async (uid: string): Promise<{ status: string; message?: string }> => {
    console.log('➡️ DELETE video:', uid);
    const res = await http.delete(`/videos/${uid}/`);
    return res.data;
};

export const updateGallery = async (uid: string, payload: CreateGalleryPayload): Promise<{ status: string; message?: string }> => {
    console.log('➡️ PUT update gallery:', uid, payload);
    const res = await http.put(`/galleries/${uid}/`, payload);
    return res.data;
};

export const deleteGallery = async (uid: string): Promise<{ status: string; message?: string }> => {
    console.log('➡️ DELETE gallery:', uid);
    const res = await http.delete(`/galleries/${uid}/`);
    return res.data;
};
