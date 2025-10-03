'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase, ReliefPin } from '@/lib/supabase-client';
import { toast } from 'sonner';
import { Upload, MapPin, Loader as Loader2, Search, MapPinIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type PinFormModalProps = {
  open: boolean;
  onClose: () => void;
  pin?: ReliefPin | null;
  defaultLat?: number;
  defaultLng?: number;
  onSuccess?: () => void;
};

export default function PinFormModal({ open, onClose, pin, defaultLat, defaultLng, onSuccess }: PinFormModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [formData, setFormData] = useState({
    latitude: defaultLat || 10.5,
    longitude: defaultLng || 123.9,
    location_name: '',
    relief_type: 'food',
    description: '',
    photo_url: '',
    start_datetime: '',
    end_datetime: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  useEffect(() => {
    if (pin) {
      // Convert ISO datetime strings back to datetime-local format (YYYY-MM-DDTHH:mm)
      const formatDatetimeLocal = (isoString: string | null) => {
        if (!isoString) return '';
        const date = new Date(isoString);
        // Format: YYYY-MM-DDTHH:mm
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setFormData({
        latitude: pin.latitude,
        longitude: pin.longitude,
        location_name: pin.location_name,
        relief_type: pin.relief_type,
        description: pin.description,
        photo_url: pin.photo_url || '',
        start_datetime: formatDatetimeLocal(pin.start_datetime),
        end_datetime: formatDatetimeLocal(pin.end_datetime),
      });
      setPhotoPreview(pin.photo_url || '');
    } else if (defaultLat && defaultLng) {
      setFormData(prev => ({
        ...prev,
        latitude: defaultLat,
        longitude: defaultLng,
      }));
      // Auto-generate location name for new pins
      generateLocationName(defaultLat, defaultLng);
    }
  }, [pin, defaultLat, defaultLng]);

  // Function to search for locations using OpenStreetMap Nominatim API
  const searchLocation = async (query: string) => {
    if (!query.trim()) return;
    
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ph&addressdetails=1`
      );
      const data = await response.json();
      setSearchResults(data);
      setShowSearchResults(true);
    } catch (error) {
      console.error('Error searching location:', error);
      toast.error('Failed to search location');
    } finally {
      setSearching(false);
    }
  };

  // Function to generate location name from coordinates (reverse geocoding)
  const generateLocationName = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      );
      const data = await response.json();
      
      if (data.display_name) {
        // Extract relevant parts of the address
        const address = data.address;
        let locationName = '';
        
        if (address.village || address.town || address.city) {
          locationName = address.village || address.town || address.city;
        } else if (address.county) {
          locationName = address.county;
        } else if (address.state) {
          locationName = address.state;
        } else {
          locationName = data.display_name.split(',')[0];
        }
        
        setFormData(prev => ({
          ...prev,
          location_name: locationName
        }));
      }
    } catch (error) {
      console.error('Error generating location name:', error);
    }
  };

  // Handle search result selection
  const handleLocationSelect = (result: any) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location_name: result.display_name.split(',')[0] || 'Selected Location'
    }));
    
    setSearchQuery(result.display_name);
    setShowSearchResults(false);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be less than 5MB');
        return;
      }
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async (): Promise<string | null> => {
    if (!photoFile || !user) return formData.photo_url || null;

    setUploading(true);
    try {
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `relief-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('relief-photos')
        .upload(filePath, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('relief-photos')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const photoUrl = await uploadPhoto();

      // Convert datetime-local values to ISO format with timezone
      // datetime-local gives us "YYYY-MM-DDTHH:mm" in local time
      // We need to convert it to ISO string for proper storage
      const startDatetime = formData.start_datetime 
        ? new Date(formData.start_datetime).toISOString()
        : null;
      const endDatetime = formData.end_datetime 
        ? new Date(formData.end_datetime).toISOString()
        : null;

      const pinData = {
        ...formData,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        photo_url: photoUrl,
        user_id: user.id,
        status: 'approved', // Auto-approve pins
      };

      if (pin) {
        const { error } = await supabase
          .from('relief_pins')
          .update(pinData)
          .eq('id', pin.id);

        if (error) throw error;
        toast.success('Pin updated successfully!');
      } else {
        const { error } = await supabase
          .from('relief_pins')
          .insert([pinData]);

        if (error) throw error;
        toast.success('Pin created and approved successfully!');
      }

      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error('Error saving pin:', error);
      toast.error(error.message || 'Failed to save pin');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      latitude: defaultLat || 10.5,
      longitude: defaultLng || 123.9,
      location_name: '',
      relief_type: 'food',
      description: '',
      photo_url: '',
      start_datetime: '',
      end_datetime: '',
    });
    setPhotoFile(null);
    setPhotoPreview('');
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto z-[1000]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {pin ? 'Edit Relief Pin' : 'Add New Relief Pin'}
          </DialogTitle>
          <DialogDescription>
            {pin ? 'Update the relief distribution details.' : 'Mark a location where relief has been distributed.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Location Search */}
          <div>
            <Label htmlFor="search">Search Location</Label>
            <div className="relative">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (e.target.value.length > 2) {
                    searchLocation(e.target.value);
                  } else {
                    setShowSearchResults(false);
                  }
                }}
                placeholder="Search for a location in Cebu..."
                className="pr-10"
              />
              <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                      onClick={() => handleLocationSelect(result)}
                    >
                      <div className="font-medium text-sm">{result.display_name.split(',')[0]}</div>
                      <div className="text-xs text-gray-500">{result.display_name}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Search for a location to automatically set coordinates and location name
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => {
                  const lat = parseFloat(e.target.value);
                  setFormData({ ...formData, latitude: lat });
                  if (lat && formData.longitude) {
                    generateLocationName(lat, formData.longitude);
                  }
                }}
                required
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => {
                  const lng = parseFloat(e.target.value);
                  setFormData({ ...formData, longitude: lng });
                  if (formData.latitude && lng) {
                    generateLocationName(formData.latitude, lng);
                  }
                }}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="location_name">Location Name</Label>
            <Input
              id="location_name"
              value={formData.location_name}
              onChange={(e) => setFormData({ ...formData, location_name: e.target.value })}
              placeholder="Auto-generated or enter manually"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Automatically generated from coordinates or search result
            </p>
          </div>

          <div>
            <Label htmlFor="relief_type">Relief Type</Label>
            <Select
              value={formData.relief_type}
              onValueChange={(value) => setFormData({ ...formData, relief_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relief type..." />
              </SelectTrigger>
              <SelectContent className="z-[1002]">
                <SelectItem value="food">🍚 Food</SelectItem>
                <SelectItem value="medical">⚕️ Medical</SelectItem>
                <SelectItem value="shelter">🏠 Shelter</SelectItem>
                <SelectItem value="water">💧 Water</SelectItem>
                <SelectItem value="clothing">👕 Clothing</SelectItem>
                <SelectItem value="other">📦 Other</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Choose the type of relief distributed at this location
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the relief distributed (quantity, beneficiaries, etc.)"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start_datetime">Relief Start Time</Label>
              <Input
                id="start_datetime"
                type="datetime-local"
                value={formData.start_datetime}
                onChange={(e) => setFormData({ ...formData, start_datetime: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                When did the relief distribution begin?
              </p>
            </div>
            <div>
              <Label htmlFor="end_datetime">Relief End Time</Label>
              <Input
                id="end_datetime"
                type="datetime-local"
                value={formData.end_datetime}
                onChange={(e) => setFormData({ ...formData, end_datetime: e.target.value })}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                When will/did the relief distribution end? (Pin will auto-complete)
              </p>
            </div>
          </div>

          <div>
            <Label htmlFor="photo">Photo Proof</Label>
            <div className="mt-2">
              {photoPreview && (
                <div className="mb-4">
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg border-2"
                  />
                </div>
              )}
              <Input
                id="photo"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="cursor-pointer"
              />
              <p className="text-xs text-gray-500 mt-1">
                Upload a photo showing the relief distribution (max 5MB)
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              className="flex-1"
              disabled={loading || uploading}
            >
              {(loading || uploading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploading ? 'Uploading...' : 'Saving...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  {pin ? 'Update Pin' : 'Create Pin'}
                </>
              )}
            </Button>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
