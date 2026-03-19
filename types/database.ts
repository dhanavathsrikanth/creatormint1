export type Role = 'creator' | 'buyer' | 'admin';
export type KycStatus = 'pending' | 'submitted' | 'verified' | 'rejected';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FeatureStatus = 'under_review' | 'planned' | 'in_progress' | 'done' | 'declined';
export type FeatureCategory = 'feature' | 'improvement' | 'bug' | 'integration' | 'general';

export interface FeatureRequest {
  id: string;
  title: string;
  description: string | null;
  author_id: string | null;
  author_name: string;
  author_role: string;
  status: FeatureStatus;
  category: FeatureCategory;
  vote_count: number;
  downvote_count: number;
  admin_response: string | null;
  admin_response_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface FeatureRequestVote {
  request_id: string;
  user_id: string;
  vote_type: 'up' | 'down';
  created_at: string;
}

export interface FeatureRequestComment {
  id: string;
  request_id: string;
  author_id: string | null;
  author_name: string;
  author_role: string;
  content: string;
  is_admin_response: boolean;
  created_at: string;
}


export interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  role: Role;
  onboarding_complete: boolean;
  onboarding_step: number;
  store_slug: string | null;
  store_name: string | null;
  store_description: string | null;
  store_accent_color: string;
  kyc_status: KycStatus;
  upi_id: string | null;
  cashfree_vendor_id: string | null;
  monthly_revenue_paise: number;
  total_revenue_paise: number;
  total_sales: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  summary: string | null;
  description: string | null;
  cta_text: string | null;
  max_reviews_displayed: number; // how many reviews to show on product page
  price_paise: number; // always integer paise
  cover_image_url: string | null;
  file_key: string | null;
  file_name: string | null;
  file_size_bytes: number | null;
  is_published: boolean;
  total_sales: number;
  total_revenue_paise: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  product_id: string;
  creator_id: string;
  buyer_id: string | null;
  buyer_email: string;
  buyer_name: string | null;
  amount_paise: number;
  platform_fee_paise: number;
  creator_payout_paise: number;
  currency: string;
  payment_status: PaymentStatus;
  cashfree_order_id: string | null;
  cashfree_payment_id: string | null;
  download_token: string | null;
  download_token_expires_at: string | null;
  download_count: number;
  gst_invoice_url: string | null;
  created_at: string;
  updated_at: string;
}

export type TicketCategory = 'payment' | 'technical' | 'account' | 'billing' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketStatus = 'open' | 'in_progress' | 'waiting_creator' | 'resolved' | 'closed';

export interface ProductReview {
  id: string;
  product_id: string;
  buyer_name: string;
  rating: number; // 1-5
  review_text: string | null;
  review_video_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportTicket {
  id: string;
  creator_id: string;
  subject: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  first_response_at: string | null;
  resolved_at: string | null;
  sla_deadline: string;
  sla_breached: boolean;
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'creator' | 'agent';
  sender_name: string;
  message: string;
  created_at: string;
}

/** Utility: convert paise to rupees display string */
export function paiseToRupees(paise: number): string {
  return `₹${(paise / 100).toFixed(2)}`;
}

/** Utility: convert rupees number to paise integer */
export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}
