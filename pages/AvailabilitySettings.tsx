import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  Clock,
  Calendar,
  Plus,
  Trash2,
  MapPin,
  Home,
  Check,
  Info
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useToast } from '../context/ToastContext';
import {
  DayOfWeek,
  TimeSlot,
  DayAvailability,
  UserAvailability,
  DEFAULT_AVAILABILITY
} from '../types';
import {
  formatTimeSlotDisplay,
  SAFE_MEETUP_LOCATIONS,
  createDefaultAvailability
} from '../utils/schedulingHelpers';

const DAYS: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' }
];

const TIME_OPTIONS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
];

const formatTimeOption = (time: string): string => {
  const [hours] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${displayHour}:00 ${period}`;
};

const AvailabilitySettings = () => {
  const navigate = useNavigate();
  const { currentUser, updateUser } = useStore();
  const { showToast } = useToast();

  const [availability, setAvailability] = useState<UserAvailability | null>(null);
  const [porchPickupEnabled, setPorchPickupEnabled] = useState(false);
  const [porchAddress, setPorchAddress] = useState('');
  const [preferredLocations, setPreferredLocations] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedDay, setExpandedDay] = useState<DayOfWeek | null>(null);

  useEffect(() => {
    if (currentUser) {
      // Load existing availability or create default
      const stored = localStorage.getItem(`availability_${currentUser.id}`);
      if (stored) {
        setAvailability(JSON.parse(stored));
      } else {
        setAvailability(createDefaultAvailability(currentUser.id));
      }

      setPorchPickupEnabled(currentUser.porchPickupEnabled || false);
      setPorchAddress(currentUser.porchPickupAddress || '');
      setPreferredLocations(currentUser.preferredMeetupLocationIds || []);
    }
  }, [currentUser]);

  if (!currentUser || !availability) {
    return null;
  }

  const toggleDay = (day: DayOfWeek) => {
    setAvailability(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        weeklySchedule: {
          ...prev.weeklySchedule,
          [day]: {
            ...prev.weeklySchedule[day],
            enabled: !prev.weeklySchedule[day].enabled,
            slots: prev.weeklySchedule[day].enabled
              ? []
              : [{ start: '09:00', end: '17:00' }]
          }
        },
        updatedAt: new Date().toISOString()
      };
    });
  };

  const updateSlot = (day: DayOfWeek, index: number, field: 'start' | 'end', value: string) => {
    setAvailability(prev => {
      if (!prev) return prev;
      const newSlots = [...prev.weeklySchedule[day].slots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return {
        ...prev,
        weeklySchedule: {
          ...prev.weeklySchedule,
          [day]: {
            ...prev.weeklySchedule[day],
            slots: newSlots
          }
        },
        updatedAt: new Date().toISOString()
      };
    });
  };

  const addSlot = (day: DayOfWeek) => {
    setAvailability(prev => {
      if (!prev) return prev;
      const lastSlot = prev.weeklySchedule[day].slots[prev.weeklySchedule[day].slots.length - 1];
      const newStart = lastSlot ? lastSlot.end : '09:00';
      const newEnd = newStart === '20:00' ? '21:00' :
                     TIME_OPTIONS[TIME_OPTIONS.indexOf(newStart) + 2] || '21:00';
      return {
        ...prev,
        weeklySchedule: {
          ...prev.weeklySchedule,
          [day]: {
            ...prev.weeklySchedule[day],
            slots: [...prev.weeklySchedule[day].slots, { start: newStart, end: newEnd }]
          }
        },
        updatedAt: new Date().toISOString()
      };
    });
  };

  const removeSlot = (day: DayOfWeek, index: number) => {
    setAvailability(prev => {
      if (!prev) return prev;
      const newSlots = prev.weeklySchedule[day].slots.filter((_, i) => i !== index);
      return {
        ...prev,
        weeklySchedule: {
          ...prev.weeklySchedule,
          [day]: {
            ...prev.weeklySchedule[day],
            slots: newSlots,
            enabled: newSlots.length > 0
          }
        },
        updatedAt: new Date().toISOString()
      };
    });
  };

  const togglePreferredLocation = (locationId: string) => {
    setPreferredLocations(prev =>
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save availability to localStorage
      localStorage.setItem(`availability_${currentUser.id}`, JSON.stringify(availability));

      // Update user preferences
      await updateUser({
        ...currentUser,
        availabilityEnabled: true,
        porchPickupEnabled,
        porchPickupAddress: porchAddress,
        preferredMeetupLocationIds: preferredLocations
      });

      showToast('Availability settings saved! 📅', 'success');
      navigate(-1);
    } catch (error) {
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-full pb-24 bg-[#FFFCF9]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-[#E8DDD4] px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-[#F5EDE6] transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-[#4A3F37]" />
          </button>
          <h1 className="font-serif text-xl font-semibold text-[#4A3F37]">
            Availability & Meetups 📅
          </h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Intro Card */}
        <div className="bg-gradient-to-br from-[#E8F5F3] to-[#D4EDE9] rounded-2xl p-4 border border-[#2D9B8C]/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-[#2D9B8C]/20 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-[#2D9B8C]" />
            </div>
            <div>
              <h3 className="font-serif font-semibold text-[#2D9B8C]">Smart Scheduling</h3>
              <p className="text-sm text-[#4A3F37] mt-1">
                Set your weekly availability and buyers will only see times that work for both of you.
                No more back-and-forth messaging!
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Schedule */}
        <section className="bg-white rounded-2xl shadow-warm-sm border border-[#E8DDD4] overflow-hidden">
          <div className="p-4 border-b border-[#E8DDD4]">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#2D9B8C]" />
              <h2 className="font-serif text-lg font-semibold text-[#4A3F37]">Weekly Availability</h2>
            </div>
            <p className="text-sm text-[#6B5D52] mt-1">
              Set the times you're typically available for meetups
            </p>
          </div>

          <div className="divide-y divide-[#E8DDD4]">
            {DAYS.map(({ key, label, short }) => {
              const daySchedule = availability.weeklySchedule[key];
              const isExpanded = expandedDay === key;

              return (
                <div key={key} className="p-4">
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => setExpandedDay(isExpanded ? null : key)}
                      className="flex items-center gap-3 flex-1"
                    >
                      <div
                        className={`w-12 h-7 rounded-full transition-colors flex items-center ${
                          daySchedule.enabled ? 'bg-[#2D9B8C]' : 'bg-[#E8DDD4]'
                        }`}
                        onClick={(e) => { e.stopPropagation(); toggleDay(key); }}
                      >
                        <div
                          className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mx-1 ${
                            daySchedule.enabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </div>
                      <span className="font-medium text-[#4A3F37]">{label}</span>
                    </button>

                    {daySchedule.enabled && daySchedule.slots.length > 0 && (
                      <span className="text-sm text-[#6B5D52]">
                        {daySchedule.slots.map(slot => formatTimeSlotDisplay(slot)).join(', ')}
                      </span>
                    )}
                  </div>

                  {daySchedule.enabled && (isExpanded || daySchedule.slots.length === 0) && (
                    <div className="mt-4 pl-[60px] space-y-3">
                      {daySchedule.slots.map((slot, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <select
                            value={slot.start}
                            onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                            className="px-3 py-2 rounded-xl bg-[#F5EDE6] border border-[#E8DDD4] text-[#4A3F37] text-sm focus:outline-none focus:ring-1 focus:ring-[#2D9B8C]"
                          >
                            {TIME_OPTIONS.map(time => (
                              <option key={time} value={time}>{formatTimeOption(time)}</option>
                            ))}
                          </select>
                          <span className="text-[#6B5D52]">to</span>
                          <select
                            value={slot.end}
                            onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                            className="px-3 py-2 rounded-xl bg-[#F5EDE6] border border-[#E8DDD4] text-[#4A3F37] text-sm focus:outline-none focus:ring-1 focus:ring-[#2D9B8C]"
                          >
                            {TIME_OPTIONS.filter(t => t > slot.start).map(time => (
                              <option key={time} value={time}>{formatTimeOption(time)}</option>
                            ))}
                          </select>
                          <button
                            onClick={() => removeSlot(key, index)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}

                      {daySchedule.slots.length < 3 && (
                        <button
                          onClick={() => addSlot(key)}
                          className="flex items-center gap-2 text-sm text-[#2D9B8C] hover:text-[#247A6F] transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          Add time slot
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Preferred Meetup Locations */}
        <section className="bg-white rounded-2xl shadow-warm-sm border border-[#E8DDD4] overflow-hidden">
          <div className="p-4 border-b border-[#E8DDD4]">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#2D9B8C]" />
              <h2 className="font-serif text-lg font-semibold text-[#4A3F37]">Safe Meetup Spots</h2>
            </div>
            <p className="text-sm text-[#6B5D52] mt-1">
              Select your preferred locations for exchanges
            </p>
          </div>

          <div className="p-4 space-y-3">
            {SAFE_MEETUP_LOCATIONS.map(location => (
              <button
                key={location.id}
                onClick={() => togglePreferredLocation(location.id)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  preferredLocations.includes(location.id)
                    ? 'border-[#2D9B8C] bg-[#E8F5F3]'
                    : 'border-[#E8DDD4] bg-white hover:border-[#2D9B8C]/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                    preferredLocations.includes(location.id)
                      ? 'bg-[#2D9B8C] text-white'
                      : 'bg-[#E8DDD4]'
                  }`}>
                    {preferredLocations.includes(location.id) && <Check className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#4A3F37]">{location.name}</span>
                      {location.type === 'police_station' && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                          🛡️ Safe Zone
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-[#6B5D52] truncate">
                      {location.address}, {location.city}
                    </p>
                    {location.openHours && (
                      <p className="text-xs text-[#B8A395] mt-1">
                        {location.openHours}
                      </p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Porch Pickup */}
        <section className="bg-white rounded-2xl shadow-warm-sm border border-[#E8DDD4] overflow-hidden">
          <div className="p-4 border-b border-[#E8DDD4]">
            <div className="flex items-center gap-2">
              <Home className="w-5 h-5 text-[#2D9B8C]" />
              <h2 className="font-serif text-lg font-semibold text-[#4A3F37]">Porch Pickup</h2>
            </div>
            <p className="text-sm text-[#6B5D52] mt-1">
              Let buyers pick up from your porch without meeting face-to-face
            </p>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium text-[#4A3F37]">Enable Porch Pickup</span>
                <p className="text-sm text-[#6B5D52]">
                  Offer contactless exchanges for trusted buyers
                </p>
              </div>
              <button
                onClick={() => setPorchPickupEnabled(!porchPickupEnabled)}
                className={`w-12 h-7 rounded-full transition-colors flex items-center ${
                  porchPickupEnabled ? 'bg-[#2D9B8C]' : 'bg-[#E8DDD4]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform mx-1 ${
                    porchPickupEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {porchPickupEnabled && (
              <>
                <div className="p-3 bg-[#FEF9E7] rounded-xl border border-[#F59E0B]/20">
                  <div className="flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#F59E0B] mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-[#92400E]">
                      Your exact address is only shared with the buyer after they pay.
                      Funds stay in escrow until they confirm pickup.
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#6B5D52] mb-2">
                    Pickup Address
                  </label>
                  <input
                    type="text"
                    value={porchAddress}
                    onChange={(e) => setPorchAddress(e.target.value)}
                    placeholder="Enter your porch pickup address"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-[#E8DDD4] text-[#4A3F37] placeholder-[#B8A395] focus:outline-none focus:ring-1 focus:ring-[#2D9B8C]"
                  />
                  <p className="text-xs text-[#B8A395] mt-1">
                    This address will be used for all porch pickup transactions
                  </p>
                </div>
              </>
            )}
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E8DDD4]">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full py-4 rounded-full bg-[#2D9B8C] text-white font-semibold text-lg hover:bg-[#247A6F] disabled:opacity-50 transition-colors shadow-lg"
          >
            {isSaving ? 'Saving...' : 'Save Availability Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySettings;
