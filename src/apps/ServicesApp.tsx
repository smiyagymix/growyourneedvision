import React, { useState, useEffect } from 'react';
import { Icon, Card, Button, Badge } from '../components/shared/ui/CommonUI';
import { professionalService, ServiceOffering } from '../services/professionalService';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import pb from '../lib/pocketbase';

interface ServicesAppProps {
  activeTab: string;
  activeSubNav: string;
}

const ServicesApp: React.FC<ServicesAppProps> = ({ activeTab, activeSubNav }) => {
  const [services, setServices] = useState<ServiceOffering[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    fetchServices();
  }, [activeSubNav]);

  const fetchServices = async () => {
    setLoading(true);
    try {
      // Use activeSubNav as category filter if needed, or just fetch all
      const result = await professionalService.getServices(); 
      setServices(result.items || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (service: ServiceOffering) => {
      if (confirm(`Book ${service.title} for $${service.price}/hr?`)) {
          alert(`Booking request sent to ${service.provider_name}!`);
      }
  };

  return (
    <div className="max-w-6xl mx-auto animate-fadeIn">
        <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gyn-blue-dark dark:text-white mb-2">Find Local {activeTab} Services</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Book trusted professionals for all your needs.</p>
            <Button 
                variant="outline" 
                onClick={() => setIsAIModalOpen(true)}
                className="mx-auto flex items-center gap-2 text-purple-600 border-purple-200 hover:bg-purple-50"
            >
                <Icon name="Sparkles" className="w-4 h-4" />
                Help Me Find a Pro
            </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
                <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">Loading services...</div>
            ) : services.length === 0 ? (
                <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">No services found.</div>
            ) : (
                services.map(service => (
                <Card key={service.id} className="hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
                    <div className="flex items-start gap-4">
                        <div className="w-16 h-16 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 overflow-hidden">
                            {service.image ? (
                                <img src={pb.files.getUrl(service, service.image)} alt={service.title} className="w-full h-full object-cover" />
                            ) : (
                                <Icon name="BriefcaseIcon" className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                            )}
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{service.title}</h3>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{service.location || 'Remote'}</div>
                            <div className="flex items-center gap-1 text-xs font-bold text-purple-700 dark:text-purple-400">
                                <span>{service.rating || 5.0}</span> ★ <span className="text-gray-400 dark:text-gray-500 font-normal">({service.reviews_count || 0} reviews)</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="neutral">Certified</Badge>
                        <Badge variant="neutral">Background Checked</Badge>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <div className="text-sm">
                            <span className="font-bold text-gray-900 dark:text-white">${service.price}</span>
                            <span className="text-gray-500 dark:text-gray-400">/hr</span>
                        </div>
                        <Button 
                            onClick={() => handleBook(service)}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                            Book Now
                        </Button>
                    </div>
                </Card>
            )))}
        </div>

        <AIContentGeneratorModal
            isOpen={isAIModalOpen}
            onClose={() => setIsAIModalOpen(false)}
            onSuccess={(content) => {
                console.log("Service Request:", content);
                setIsAIModalOpen(false);
                alert("Request Drafted! (Check console)");
            }}
            title="Describe Your Need"
            promptTemplate={`Draft a service request for a [Service Type].
            
            Include:
            - Problem Description
            - Urgency Level
            - Preferred Schedule
            
            Make it clear and concise for potential providers.`}
            contextData={{ serviceType: activeTab || 'General' }}
        />
    </div>
  );
};

export default ServicesApp;
