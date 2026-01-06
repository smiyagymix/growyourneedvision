import { ServiceOffering, ServiceCategory, ServiceReview, ServiceBooking } from '../professionalService';

export const MOCK_SERVICES: ServiceOffering[] = [
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

export const MOCK_CATEGORIES: ServiceCategory[] = [
    { id: 'cat-1', name: 'Finance', description: 'Financial and accounting services', icon: '💰', services_count: 45 },
    { id: 'cat-2', name: 'Legal', description: 'Legal consultation and representation', icon: '⚖️', services_count: 32 },
    { id: 'cat-3', name: 'Home Services', description: 'Home improvement and maintenance', icon: '🏠', services_count: 78 },
    { id: 'cat-4', name: 'Health & Fitness', description: 'Health and wellness services', icon: '💪', services_count: 56 },
    { id: 'cat-5', name: 'Technology', description: 'Tech and digital services', icon: '💻', services_count: 67 },
    { id: 'cat-6', name: 'Education', description: 'Tutoring and training services', icon: '📚', services_count: 41 }
];

export const MOCK_REVIEWS: ServiceReview[] = [
    { id: 'rev-1', service_id: 'svc-1', user_id: 'user-1', user_name: 'Mike T.', rating: 5, comment: 'Excellent service! Saved me thousands on taxes.', created: '2024-02-01T00:00:00Z' },
    { id: 'rev-2', service_id: 'svc-1', user_id: 'user-2', user_name: 'Lisa R.', rating: 5, comment: 'Very professional and knowledgeable.', created: '2024-02-05T00:00:00Z' },
    { id: 'rev-3', service_id: 'svc-2', user_id: 'user-3', user_name: 'David K.', rating: 4, comment: 'Great legal advice for my startup.', created: '2024-02-03T00:00:00Z' }
];

export const MOCK_BOOKINGS: ServiceBooking[] = [
    { id: 'book-1', service_id: 'svc-1', user_id: 'user-1', provider_id: 'provider-1', date: '2024-03-01', time: '10:00', duration: 60, status: 'Confirmed', price: 150, created: '2024-02-15T00:00:00Z' },
    { id: 'book-2', service_id: 'svc-4', user_id: 'user-1', provider_id: 'provider-4', date: '2024-03-05', time: '14:00', duration: 45, status: 'Pending', price: 75, notes: 'First session', created: '2024-02-18T00:00:00Z' }
];
