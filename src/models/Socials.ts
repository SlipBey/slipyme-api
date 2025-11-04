export type SocialSnapshot = {
    instagram?: IgStats;
    youtube?: { subs: number; views: number };
    updatedAt: string;
    errors?: { instagram?: string; youtube?: string };
};

export type MediaItem = {
    id: string;
    media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
    media_url: string;
    thumbnail_url?: string;
    permalink: string;
    caption?: string;
    timestamp?: string;
};

export type IgStats = { followers: number; mediaCount: number; };