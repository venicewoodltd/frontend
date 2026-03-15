export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  admin: {
    id: string;
    name: string;
    username: string;
    role: "admin" | "editor";
    permissions: string[] | null;
    photoFileId: string | null;
  };
}

export interface GraphQLResponse<T> {
  data?: T;
  errors?: GraphQLError[];
}
export interface GraphQLError {
  message: string;
  locations?: { line: number; column: number }[];
  path?: string[];
  extensions?: Record<string, unknown>;
}

export interface CreateProductRequest {
  name: string;
  slug: string;
  description?: string;
  longDescription?: string;
  category?: string;
  mainImage?: string;
  galleryImages?: string[];
  featured?: boolean;
  wood_type?: string;
  material?: string;
  finish?: string;
  joinery?: string;
  delivery?: string;
  specifications?: { key: string; value: string }[];
  features?: string[];
}
export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface CreateProjectRequest {
  name: string;
  slug: string;
  title: string;
  description?: string;
  longDescription?: string;
  category: string;
  image?: string;
  featured?: boolean;
  primaryWood?: string;
  client?: string;
  location?: string;
}
export type UpdateProjectRequest = Partial<CreateProjectRequest>;

export interface CreateBlogRequest {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  category: string;
  image?: string;
  author?: string;
  status?: "draft" | "published";
}
export type UpdateBlogRequest = Partial<CreateBlogRequest>;

export interface CreateInquiryRequest {
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  budget?: string;
  timeline?: string;
  message: string;
}
export interface UpdateInquiryRequest {
  status?: "new" | "read" | "responded" | "closed";
  notes?: string;
}

export interface CreateTestimonialRequest {
  author: string;
  content: string;
  rating?: number;
  image?: string;
  featured?: boolean;
}
export type UpdateTestimonialRequest = Partial<CreateTestimonialRequest>;

export interface ImageUploadResponse {
  success: boolean;
  fileId: string;
  filename: string;
}
export interface ImageValidationResult {
  valid: boolean;
  errors: string[];
  fileSize?: string;
}

export interface DashboardStats {
  totalProducts: number;
  totalProjects: number;
  totalBlogs: number;
  totalInquiries: number;
  newInquiries: number;
  totalTestimonials: number;
  avgRating: number;
}

export interface SearchResults {
  products: SearchResultItem[];
  projects: SearchResultItem[];
  blogs: SearchResultItem[];
}
export interface SearchResultItem {
  id: string;
  name?: string;
  title?: string;
  slug: string;
  description?: string;
  content?: string;
  category?: string;
}
