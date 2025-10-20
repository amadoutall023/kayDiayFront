export interface Category {
  id: number;
  name: string;
  createdAt: string;
}

export interface Ad {
  id: number;
  title: string;
  description: string;
  price: number;
  phone?: string;
  address?: string;
  images: string[]; // Array of image URLs
  status: string;
  verificationStatus: string;
  verificationReason?: string;
  publishedAt?: string;
  expiresAt?: string;
  categoryId: number;
  userId: number;
  category: Category;
  user: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdRequest {
  title: string;
  description: string;
  price: number;
  phone?: string;
  address?: string;
  categoryId: number;
  images: string[];
}

export interface AdsResponse {
  ads: Ad[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ExtendAdRequest {
  adId: number;
}