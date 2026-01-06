import React, { useEffect, useMemo, useState } from 'react';
import { Icon, Card, Button } from '../components/shared/ui/CommonUI';
import { Input } from '../components/shared/ui/Input';
import { Select } from '../components/shared/ui/Select';
import { Badge } from '../components/shared/ui/Badge';
import { Table, Thead, Tr, Th, Td } from '../components/shared/ui/Table';
import { AIContentGeneratorModal } from '../components/shared/modals/AIContentGeneratorModal';
import { eventService, EventActivity } from '../services/eventService';

interface ActivitiesAppProps {
  activeTab: string;
  activeSubNav: string;
}

const defaultFilters = {
  search: '',
  location: '',
  categories: [] as string[],
  from: '',
  to: '',
  sort: '-created' as '-created' | 'name' | '-capacity' | 'created',
};

const ActivitiesApp: React.FC<ActivitiesAppProps> = () => {
  const [activities, setActivities] = useState<EventActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState(defaultFilters);
  const [view, setView] = useState<'list' | 'table'>('list');

  useEffect(() => {
    loadActivities(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadActivities = async (nextPage = 1, nextFilters = filters) => {
    setLoading(true);
    setError(null);
    try {
      const result = await eventService.getActivities({
        page: nextPage,
        perPage: 12,
        search: nextFilters.search || undefined,
        location: nextFilters.location || undefined,
        categories: nextFilters.categories.length ? nextFilters.categories : undefined,
        from: nextFilters.from || undefined,
        to: nextFilters.to || undefined,
        sort: nextFilters.sort || '-created',
      });
      setActivities(result.items);
      setPage(result.page || nextPage);
      setTotalPages(result.totalPages || 1);
    } catch (e) {
      console.error('Error fetching activities:', e);
      setError('Unable to load activities right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const uniqueCategories = useMemo(() => {
    const setCat = new Set<string>();
    activities.forEach((a) => a.type && setCat.add(a.type));
    return Array.from(setCat).sort();
  }, [activities]);

  const handleApply = () => loadActivities(1, filters);

  const handleReset = () => {
    setFilters(defaultFilters);
    loadActivities(1, defaultFilters);
  };

  const renderList = () => {
    if (loading) return <div className="col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">Loading activities...</div>;
    if (error) return <div className="col-span-2 text-center py-12 text-red-500 dark:text-red-400">{error}</div>;
    if (activities.length === 0) return <div className="col-span-2 text-center py-12 text-gray-500 dark:text-gray-400">No activities found.</div>;

    return activities.map((activity) => {
      const dateObj = new Date(activity.created);
      const month = dateObj.toLocaleString('default', { month: 'short' });
      const day = dateObj.getDate();
      const scheduleText = activity.schedule?.day && activity.schedule?.time
        ? `${activity.schedule.day} @ ${activity.schedule.time}`
        : 'TBD';

      return (
        <Card key={activity.id} className="p-4 hover:border-orange-300 dark:hover:border-orange-500 transition-colors flex flex-col h-full">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex flex-col items-center justify-center text-orange-800 dark:text-orange-300 shrink-0">
                <span className="text-xs font-bold uppercase">{month}</span>
                <span className="text-lg font-black">{day}</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white leading-tight">{activity.name}</h3>
                  {activity.type && <Badge size="sm" variant="info">{activity.type}</Badge>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{activity.location || 'TBD'} • {scheduleText}</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400" title="Share">
              <Icon name="ShareIcon" className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 flex-1">
            {activity.description}
          </p>

          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Icon name="UsersIcon" className="w-4 h-4" />
              <span>{activity.capacity ? `${activity.capacity} spots` : 'Open'}</span>
            </div>
            <Button size="sm" variant="outline">RSVP</Button>
          </div>
        </Card>
      );
    });
  };

  const renderTable = () => {
    if (loading) return <div className="text-center py-8 text-gray-500">Loading activities...</div>;
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
    if (activities.length === 0) return <div className="text-center py-8 text-gray-500">No activities found.</div>;

    return (
      <Table>
        <Thead>
          <Tr>
            <Th>Name</Th>
            <Th>Type</Th>
            <Th>Location</Th>
            <Th>Schedule</Th>
            <Th>Capacity</Th>
          </Tr>
        </Thead>
        <tbody>
          {activities.map((act) => {
            const scheduleText = act.schedule?.day && act.schedule?.time
              ? `${act.schedule.day} @ ${act.schedule.time}`
              : 'TBD';
            return (
              <Tr key={act.id}>
                <Td className="font-semibold text-gray-900 dark:text-white">{act.name}</Td>
                <Td>{act.type || '-'}</Td>
                <Td>{act.location || '-'}</Td>
                <Td>{scheduleText}</Td>
                <Td>{act.capacity ?? '—'}</Td>
              </Tr>
            );
          })}
        </tbody>
      </Table>
    );
  };

  const promptActivities = activities.slice(0, 5).map((a) => `- ${a.name}${a.location ? ` @ ${a.location}` : ''}`).join('\n');

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex justify-between items-end border-b border-gray-200 dark:border-gray-700 pb-4">
        <div>
          <h1 className="text-3xl font-black text-gyn-blue-dark dark:text-white">Local Activities</h1>
          <p className="text-gray-500 dark:text-gray-400">Discover what's happening in your community.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-2 text-orange-600 border-orange-200 hover:bg-orange-50"
          >
            <Icon name="Sparkles" className="w-4 h-4" />
            Plan My Weekend
          </Button>
          <Button variant={view === 'list' ? 'primary' : 'outline'} size="sm" onClick={() => setView('list')}>Cards</Button>
          <Button variant={view === 'table' ? 'primary' : 'outline'} size="sm" onClick={() => setView('table')}>Table</Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Filters */}
        <div className="w-full md:w-72 shrink-0 space-y-6">
          <Card className="p-4 space-y-3">
            <h3 className="font-bold text-sm text-gray-900 dark:text-white uppercase">Search & Filters</h3>
            <Input
              label="Search"
              placeholder="Search activities"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
            <Input
              label="Location"
              placeholder="City or venue"
              value={filters.location}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="From"
                type="date"
                value={filters.from}
                onChange={(e) => setFilters({ ...filters, from: e.target.value })}
              />
              <Input
                label="To"
                type="date"
                value={filters.to}
                onChange={(e) => setFilters({ ...filters, to: e.target.value })}
              />
            </div>
            <Select
              label="Sort"
              value={filters.sort}
              onChange={(e) => setFilters({ ...filters, sort: e.target.value as any })}
            >
              <option value="-created">Newest</option>
              <option value="created">Oldest</option>
              <option value="name">Name (A-Z)</option>
              <option value="-capacity">Capacity (High)</option>
            </Select>
            <div>
              <h3 className="font-bold text-xs mb-2 text-gray-900 dark:text-white uppercase tracking-wide">Categories</h3>
              <div className="space-y-2 max-h-48 overflow-auto pr-1">
                {(uniqueCategories.length ? uniqueCategories : ['Outdoor', 'Music', 'Food', 'Learning', 'Sports']).map((cat) => {
                  const checked = filters.categories.includes(cat);
                  return (
                    <label key={cat} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                      <input
                        type="checkbox"
                        className="rounded text-blue-600 focus:ring-blue-500 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? filters.categories.filter((c) => c !== cat)
                            : [...filters.categories, cat];
                          setFilters({ ...filters, categories: next });
                        }}
                      />
                      {cat}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="primary" size="sm" className="flex-1" onClick={handleApply}>Apply</Button>
              <Button variant="ghost" size="sm" className="flex-1" onClick={handleReset}>Reset</Button>
            </div>
          </Card>
        </div>

        {/* Feed */}
        {view === 'list' ? (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
            {renderList()}
          </div>
        ) : (
          <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            {renderTable()}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <span>Page {page} of {totalPages}</span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" disabled={page <= 1 || loading} onClick={() => { const next = Math.max(1, page - 1); setPage(next); loadActivities(next, filters); }}>Prev</Button>
          <Button size="sm" variant="ghost" disabled={page >= totalPages || loading} onClick={() => { const next = Math.min(totalPages, page + 1); setPage(next); loadActivities(next, filters); }}>Next</Button>
        </div>
      </div>

      <AIContentGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={(content) => {
          console.log('Weekend Plan:', content);
          setIsAIModalOpen(false);
          alert('Weekend Plan Generated! (Check console)');
        }}
        title="AI Weekend Planner"
        promptTemplate={`Create a fun weekend itinerary for a [User Type (e.g., Family, Couple, Solo)].

Include:
- Saturday Morning Activity
- Saturday Evening Event
- Sunday Brunch Spot

Based on available activities:
${promptActivities}`}
        contextData={{ userType: 'Family' }}
      />
    </div>
  );
};

export default ActivitiesApp;
