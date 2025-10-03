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
import { Upload, MapPin, Loader as Loader2 } from 'lucide-react';
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
  const [formData, setFormData] = useState({
    latitude: defaultLat || 10.5,
    longitude: defaultLng || 123.9,
    location_name: '',
    relief_type: 'food',
    description: '',
    photo_url: '',
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');

  useEffect(() => {
    if (pin) {
      setFormData({
        latitude: pin.latitude,
        longitude: pin.longitude,
        location_name: pin.location_name,
        relief_type: pin.relief_type,
        description: pin.description,
        photo_url: pin.photo_url || '',
      });
      setPhotoPreview(pin.photo_url || '');
    } else if (defaultLat && defaultLng) {
      setFormData(prev => ({
        ...prev,
        latitude: defaultLat,
        longitude: defaultLng,
      }));
    }
  }, [pin, defaultLat, defaultLng]);

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

      const pinData = {
        ...formData,
        photo_url: photoUrl,
        user_id: user.id,
        status: 'pending',
      };

      if (pin) {
        const { error } = await supabase
          .from('relief_pins')
          .update(pinData)
          .eq('id', pin.id);

        if (error) throw error;
        toast.success('Pin updated successfully! Awaiting admin approval.');
      } else {
        const { error } = await supabase
          .from('relief_pins')
          .insert([pinData]);

        if (error) throw error;
        toast.success('Pin created successfully! Awaiting admin approval.');
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
    });
    setPhotoFile(null);
    setPhotoPreview('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
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
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
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
              placeholder="e.g., Barangay Poblacion"
              required
            />
          </div>

          <div>
            <Label htmlFor="relief_type">Relief Type</Label>
            <Select
              value={formData.relief_type}
              onValueChange={(value) => setFormData({ ...formData, relief_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">🍚 Food</SelectItem>
                <SelectItem value="medical">⚕️ Medical</SelectItem>
                <SelectItem value="shelter">🏠 Shelter</SelectItem>
                <SelectItem value="water">💧 Water</SelectItem>
                <SelectItem value="clothing">👕 Clothing</SelectItem>
                <SelectItem value="other">📦 Other</SelectItem>
              </SelectContent>
            </Select>
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
