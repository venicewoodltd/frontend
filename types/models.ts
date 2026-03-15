export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  longDescription?: string;
  category: string;
  image?: string;
  galleryImages?: string[];
  featured: boolean;
  status?: "draft" | "published";
  wood_type?: string;
  material?: string;
  finish?: string;
  joinery?: string;
  delivery?: string;
  dimensions?: Record<string, string | number>;
  specifications?: ProductSpecification[];
  features?: string[];
  seoTags?: string;
  views?: number;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductSpecification {
  key: string;
  value: string;
}

export interface ProductInput {
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
  specifications?: ProductSpecification[];
  features?: string[];
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  title: string;
  description?: string;
  longDescription?: string;
  category: string;
  image?: string;
  gallery?: ProjectImage[];
  featured: boolean;
  primaryWood?: string;
  client?: string;
  location?: string;
  completionDate?: string;
  dimensions?: Record<string, string | number>;
  materials?: string[];
  techniques?: string[];
  specifications?: Record<string, string | number>;
  timeline?: Record<string, string | Record<string, string>>;
  testimonial?: Record<string, string>;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectImage {
  id: string;
  type: string;
  url: string;
  fileName: string;
}

export interface Blog {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content: string;
  category: string;
  image?: string;
  author?: string;
  status: "draft" | "published";
  featured?: boolean;
  seoTags?: string;
  readingTime?: number;
  views?: number;
  publishedAt?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone?: string;
  projectType: string;
  budget?: string;
  timeline?: string;
  message: string;
  status: "new" | "read" | "responded" | "closed";
  createdAt?: string;
  updatedAt?: string;
}

export interface Testimonial {
  id: string;
  author: string;
  content: string;
  rating?: number;
  image?: string;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  role: "admin" | "editor";
  permissions?: string[];
  photoFileId?: string;
  isActive?: boolean;
  lastLogin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ContactSettings {
  studioLocation: string;
  email: string;
  phone: string;
  responseTime: string;
  facebookUrl?: string;
  whatsappNumber?: string;
  socialLinks?: SocialLinks;
}

export interface SocialLinks {
  instagram?: string;
  facebook?: string;
  twitter?: string;
  linkedin?: string;
}

export interface HeroImage {
  _id: string;
  filename: string;
  uploadDate: string;
}

export interface HeroSettings {
  images: HeroImage[];
  interval: number;
  transitionType: "fade" | "slide";
}

export interface MasteryContent {
  heroTitle: string;
  heroSubtitle: string;
  heroImage?: string;
  section1Title: string;
  section1Content: string;
  section1Image?: string;
  section2Title: string;
  section2Content: string;
  section2Image?: string;
  section3Title: string;
  section3Content: string;
  section3Image?: string;
  craftSkills: CraftSkill[];
  yearsExperience: number;
  projectsCompleted: number;
  satisfiedClients: number;
}

export interface CraftSkill {
  name: string;
  percentage: number;
}
