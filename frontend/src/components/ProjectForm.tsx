import { useState, useEffect, useRef } from 'react';
import { Project } from '../types';
import { Button } from './Button';

interface ProjectFormProps {
  initialData: Project | null;
  isCreating: boolean;
  isLoading?: boolean;
  onSubmit: (data: {
    name: string;
    description: string;
  }) => void;
  onCancel: () => void;
}

export function ProjectForm({ initialData, isCreating, isLoading = false, onSubmit, onCancel }: ProjectFormProps) {
  // Initialize form data from initialData or empty values
  const [formData, setFormData] = useState(() => ({
    name: initialData?.name || '',
    description: initialData?.description || '',
  }));

  // Track the previous initialData ID to avoid unnecessary updates
  const prevInitialDataId = useRef<string | undefined>(initialData?.id);

  // Update form data when initialData changes
  // Note: Using setState in effect is necessary here to sync form with prop changes
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    const currentId = initialData?.id;
    
    // Only update if the ID actually changed
    if (prevInitialDataId.current !== currentId) {
      prevInitialDataId.current = currentId;
      
      if (initialData) {
        setFormData({
          name: initialData.name,
          description: initialData.description || '',
        });
      } else if (isCreating) {
        setFormData({
          name: '',
          description: '',
        });
      }
    }
  }, [initialData, isCreating]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation: Ensure Project Name is not empty
    if (!formData.name || formData.name.trim() === '') {
      return; // Let the parent component handle the error toast
    }
    
    onSubmit(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      description: '',
    });
    onCancel();
  };

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">
        {isCreating ? 'Create New Project' : 'Edit Project'}
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border border-gray-300 rounded-md px-3 py-2"
            rows={4}
          />
        </div>
        <div className="flex gap-4">
          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
          >
            Save
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleCancel}
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
