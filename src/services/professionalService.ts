import pb from '../lib/pocketbase';
import { isMockEnv } from '../utils/mockData';
import { ListResult } from 'pocketbase';

export interface ServiceOffering {
  id: string;
  title: string;
  provider_name: string;
  description: string;
  category: string;
  price: number;
  rating: number;
  reviews_count: number;
  location: string;
  image?: string;
  availability?: 'Available' | 'Busy' | 'Unavailable';
  experience_years?: number;
  certifications?: string[];
  created: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  services_count: number;
}

export interface ServiceReview {
  id: string;
  service_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created: string;
}

export interface ServiceBooking {
  id: string;
  service_id: string;
  user_id: string;
  provider_id: string;
  date: string;
  time: string;
  duration: number;
  status: 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';
  notes?: string;
  price: number;
  created: string;
}

// Mock Data
const MOCK_SERVICES: ServiceOffering[] = [
  {
    id: 'svc-1',
    title: 'Tax Consultation',
    provider_name: 'John Smith, CPA',
    description: 'Expert tax planning and filing services for individuals and businesses',
    category: 'Finance',
    price: 150,
    rating: 4.9,
    reviews_count: 127,
    location: 'New York, NY',
    availability: 'Available',
    experience_years: 15,
    certifications: ['CPA', 'CFP'],
    created: '2024-01-01T00:00:00Z'
  },
  {
    id: 'svc-2',
    title: 'Legal Consultation',
    provider_name: 'Sarah Johnson, Esq.',
    description: 'Business and contract law expertise for small to medium enterprises',
    category: 'Legal',
    price: 200,
    rating: 4.8,
    reviews_count: 89,
    location: 'Los Angeles, CA',
    availability: 'Available',
    experience_years: 12,
    certifications: ['JD', 'Bar License'],
    created: '2024-01-02T00:00:00Z'
  },
  {
    id: 'svc-3',
    title: 'Home Renovation',
    provider_name: 'BuildRight Contractors',
    description: 'Complete home renovation and remodeling services',
    category: 'Home Services',
    price: 5000,
    rating: 4.7,
    reviews_count: 234,
    location: 'Chicago, IL',
    availability: 'Busy',
    experience_years: 20,
    created: '2024-01-03T00:00:00Z'
  },
  {
    id: 'svc-4',
    title: 'Personal Training',
    provider_name: 'FitLife Studios',
    description: 'Customized fitness programs and one-on-one coaching',
    category: 'Health & Fitness',
    price: 75,
    rating: 4.9,
    reviews_count: 312,
    location: 'Miami, FL',
    availability: 'Available',
    experience_years: 8,
    certifications: ['NASM', 'ACE'],
    created: '2024-01-04T00:00:00Z'
  },
  {
    id: 'svc-5',
    title: 'Web Development',
    provider_name: 'TechPro Solutions',
    description: 'Full-stack web development and digital solutions',
    category: 'Technology',
    price: 125,
    rating: 4.8,
    reviews_count: 156,
    location: 'San Francisco, CA',
    availability: 'Available',
    experience_years: 10,
    created: '2024-01-05T00:00:00Z'
  }
];

const MOCK_CATEGORIES: ServiceCategory[] = [
  { id: 'cat-1', name: 'Finance', description: 'Financial and accounting services', icon: '💰', services_count: 45 },
  { id: 'cat-2', name: 'Legal', description: 'Legal consultation and representation', icon: '⚖️', services_count: 32 },
  { id: 'cat-3', name: 'Home Services', description: 'Home improvement and maintenance', icon: '🏠', services_count: 78 },
  { id: 'cat-4', name: 'Health & Fitness', description: 'Health and wellness services', icon: '💪', services_count: 56 },
  { id: 'cat-5', name: 'Technology', description: 'Tech and digital services', icon: '💻', services_count: 67 },
  { id: 'cat-6', name: 'Education', description: 'Tutoring and training services', icon: '📚', services_count: 41 }
];

const MOCK_REVIEWS: ServiceReview[] = [
  { id: 'rev-1', service_id: 'svc-1', user_id: 'user-1', user_name: 'Mike T.', rating: 5, comment: 'Excellent service! Saved me thousands on taxes.', created: '2024-02-01T00:00:00Z' },
  { id: 'rev-2', service_id: 'svc-1', user_id: 'user-2', user_name: 'Lisa R.', rating: 5, comment: 'Very professional and knowledgeable.', created: '2024-02-05T00:00:00Z' },
  { id: 'rev-3', service_id: 'svc-2', user_id: 'user-3', user_name: 'David K.', rating: 4, comment: 'Great legal advice for my startup.', created: '2024-02-03T00:00:00Z' }
];

const MOCK_BOOKINGS: ServiceBooking[] = [
  { id: 'book-1', service_id: 'svc-1', user_id: 'user-1', provider_id: 'provider-1', date: '2024-03-01', time: '10:00', duration: 60, status: 'Confirmed', price: 150, created: '2024-02-15T00:00:00Z' },
  { id: 'book-2', service_id: 'svc-4', user_id: 'user-1', provider_id: 'provider-4', date: '2024-03-05', time: '14:00', duration: 45, status: 'Pending', price: 75, notes: 'First session', created: '2024-02-18T00:00:00Z' }
];

export const professionalService = {
  async getServices(category?: string): Promise<ListResult<ServiceOffering>> {
    if (isMockEnv()) {
      let items = [...MOCK_SERVICES];
      if (category) {
        items = items.filter(s => s.category === category);
      }
      return {
        page: 1,
        perPage: 50,
        totalItems: items.length,
        totalPages: 1,
        items
      };
    }

    try {
      let filter = '';
      if (category) {
        filter = `category = "${category}"`;
      }
      const records = await pb.collection('services').getList<ServiceOffering>(1, 50, {
        sort: '-created',
        filter,
      });
      return records;
    } catch (error) {
      console.error('Error fetching services:', error);
      
      return { 
          page: 1,
          perPage: 50,
          totalItems: 0,
          totalPages: 0,
          items: [] 
      };
    }
  },

  async getServiceById(id: string): Promise<ServiceOffering | null> {
    if (isMockEnv()) {
      return MOCK_SERVICES.find(s => s.id === id) || null;
    }

    try {
      return await pb.collection('services').getOne<ServiceOffering>(id);
    } catch (error) {
      console.error('Error fetching service:', error);
      return null;
    }
  },

  async searchServices(query: string): Promise<ServiceOffering[]> {
    if (isMockEnv()) {
      const lowerQuery = query.toLowerCase();
      return MOCK_SERVICES.filter(s =>
        s.title.toLowerCase().includes(lowerQuery) ||
        s.description.toLowerCase().includes(lowerQuery) ||
        s.provider_name.toLowerCase().includes(lowerQuery)
      );
    }

    try {
      const records = await pb.collection('services').getFullList<ServiceOffering>({
        filter: `title ~ "${query}" || description ~ "${query}" || provider_name ~ "${query}"`,
        sort: '-rating'
      });
      return records;
    } catch (error) {
      console.error('Error searching services:', error);
      return [];
    }
  },

  async getFeaturedServices(): Promise<ServiceOffering[]> {
    if (isMockEnv()) {
      return MOCK_SERVICES.sort((a, b) => b.rating - a.rating).slice(0, 5);
    }

    try {
      const records = await pb.collection('services').getFullList<ServiceOffering>({
        filter: 'rating >= 4.5',
        sort: '-rating,-reviews_count',
        limit: 10
      });
      return records;
    } catch (error) {
      console.error('Error fetching featured services:', error);
      return [];
    }
  },

  async createService(data: Partial<ServiceOffering>): Promise<ServiceOffering | null> {
    if (isMockEnv()) {
      const newService: ServiceOffering = {
        id: `svc-${Date.now()}`,
        title: data.title || 'New Service',
        provider_name: data.provider_name || 'Provider',
        description: data.description || '',
        category: data.category || 'Other',
        price: data.price || 0,
        rating: 0,
        reviews_count: 0,
        location: data.location || 'Unknown',
        image: data.image,
        availability: 'Available',
        experience_years: data.experience_years,
        certifications: data.certifications,
        created: new Date().toISOString()
      };
      MOCK_SERVICES.push(newService);
      return newService;
    }

    try {
      return await pb.collection('services').create<ServiceOffering>(data);
    } catch (error) {
      console.error('Error creating service:', error);
      return null;
    }
  },

  async updateService(id: string, data: Partial<ServiceOffering>): Promise<ServiceOffering | null> {
    if (isMockEnv()) {
      const service = MOCK_SERVICES.find(s => s.id === id);
      if (service) {
        Object.assign(service, data);
      }
      return service || null;
    }

    try {
      return await pb.collection('services').update<ServiceOffering>(id, data);
    } catch (error) {
      console.error('Error updating service:', error);
      return null;
    }
  },

  async deleteService(id: string): Promise<boolean> {
    if (isMockEnv()) {
      const index = MOCK_SERVICES.findIndex(s => s.id === id);
      if (index !== -1) {
        MOCK_SERVICES.splice(index, 1);
      }
      return true;
    }

    try {
      await pb.collection('services').delete(id);
      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      return false;
    }
  },

  // Categories
  async getCategories(): Promise<ServiceCategory[]> {
    if (isMockEnv()) {
      return [...MOCK_CATEGORIES];
    }

    try {
      return await pb.collection('service_categories').getFullList<ServiceCategory>({
        sort: 'name'
      });
    } catch (error) {
      console.error('Error fetching categories:', error);
      return MOCK_CATEGORIES; // Fallback to mock
    }
  },

  // Reviews
  async getServiceReviews(serviceId: string): Promise<ServiceReview[]> {
    if (isMockEnv()) {
      return MOCK_REVIEWS.filter(r => r.service_id === serviceId);
    }

    try {
      return await pb.collection('service_reviews').getFullList<ServiceReview>({
        filter: `service_id = "${serviceId}"`,
        sort: '-created'
      });
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  },

  async addReview(data: Partial<ServiceReview>): Promise<ServiceReview | null> {
    if (isMockEnv()) {
      const newReview: ServiceReview = {
        id: `rev-${Date.now()}`,
        service_id: data.service_id || '',
        user_id: data.user_id || '',
        user_name: data.user_name || 'Anonymous',
        rating: data.rating || 5,
        comment: data.comment || '',
        created: new Date().toISOString()
      };
      MOCK_REVIEWS.push(newReview);
      
      // Update service rating
      const service = MOCK_SERVICES.find(s => s.id === data.service_id);
      if (service) {
        const serviceReviews = MOCK_REVIEWS.filter(r => r.service_id === data.service_id);
        service.reviews_count = serviceReviews.length;
        service.rating = serviceReviews.reduce((sum, r) => sum + r.rating, 0) / serviceReviews.length;
      }
      
      return newReview;
    }

    try {
      return await pb.collection('service_reviews').create<ServiceReview>(data);
    } catch (error) {
      console.error('Error adding review:', error);
      return null;
    }
  },

  // Bookings
  async getUserBookings(userId: string): Promise<ServiceBooking[]> {
    if (isMockEnv()) {
      return MOCK_BOOKINGS.filter(b => b.user_id === userId);
    }

    try {
      return await pb.collection('service_bookings').getFullList<ServiceBooking>({
        filter: `user_id = "${userId}"`,
        sort: '-created',
        expand: 'service_id'
      });
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return [];
    }
  },

  async createBooking(data: Partial<ServiceBooking>): Promise<ServiceBooking | null> {
    if (isMockEnv()) {
      const newBooking: ServiceBooking = {
        id: `book-${Date.now()}`,
        service_id: data.service_id || '',
        user_id: data.user_id || '',
        provider_id: data.provider_id || '',
        date: data.date || new Date().toISOString().split('T')[0],
        time: data.time || '10:00',
        duration: data.duration || 60,
        status: 'Pending',
        notes: data.notes,
        price: data.price || 0,
        created: new Date().toISOString()
      };
      MOCK_BOOKINGS.push(newBooking);
      return newBooking;
    }

    try {
      return await pb.collection('service_bookings').create<ServiceBooking>({
        ...data,
        status: 'Pending'
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      return null;
    }
  },

  async updateBookingStatus(id: string, status: ServiceBooking['status']): Promise<ServiceBooking | null> {
    if (isMockEnv()) {
      const booking = MOCK_BOOKINGS.find(b => b.id === id);
      if (booking) {
        booking.status = status;
      }
      return booking || null;
    }

    try {
      return await pb.collection('service_bookings').update<ServiceBooking>(id, { status });
    } catch (error) {
      console.error('Error updating booking status:', error);
      return null;
    }
  },

  async cancelBooking(id: string): Promise<boolean> {
    if (isMockEnv()) {
      const booking = MOCK_BOOKINGS.find(b => b.id === id);
      if (booking) {
        booking.status = 'Cancelled';
      }
      return true;
    }

    try {
      await pb.collection('service_bookings').update(id, { status: 'Cancelled' });
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return false;
    }
  },

  // Statistics
  async getServiceStats() {
    if (isMockEnv()) {
      return {
        total_services: MOCK_SERVICES.length,
        total_categories: MOCK_CATEGORIES.length,
        total_reviews: MOCK_REVIEWS.length,
        average_rating: MOCK_SERVICES.reduce((sum, s) => sum + s.rating, 0) / MOCK_SERVICES.length,
        top_category: MOCK_CATEGORIES.sort((a, b) => b.services_count - a.services_count)[0]?.name || 'None'
      };
    }

    try {
      const [services, categories, reviews] = await Promise.all([
        pb.collection('services').getFullList<ServiceOffering>(),
        pb.collection('service_categories').getFullList<ServiceCategory>(),
        pb.collection('service_reviews').getFullList<ServiceReview>()
      ]);

      return {
        total_services: services.length,
        total_categories: categories.length,
        total_reviews: reviews.length,
        average_rating: services.length > 0
          ? services.reduce((sum, s) => sum + s.rating, 0) / services.length
          : 0,
        top_category: categories.sort((a, b) => b.services_count - a.services_count)[0]?.name || 'None'
      };
    } catch (error) {
      console.error('Error fetching service stats:', error);
      return {
        total_services: 0,
        total_categories: 0,
        total_reviews: 0,
        average_rating: 0,
        top_category: 'None'
      };
    }
  }
};
