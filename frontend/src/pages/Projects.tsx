import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useProjects } from '../hooks/useProjects';
import { Project } from '../types';
import { Layout } from '../components/Layout';
import { ProjectTable } from '../components/ProjectTable';
import { ProjectForm } from '../components/ProjectForm';
import { MOCK_PROJECTS } from '../data/mockData';
import { useAuth } from '../contexts/AuthContext';

export function Projects() {
  const { user } = useAuth();
  const { projects: apiProjects, isLoading, loadProjects, createProject, updateProject, deleteProject } = useProjects();
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if we're in showcase mode
  const isShowcaseMode = user?.id === 'guest' || user?.email === 'guest@smartops.com';
  
  // Initialize proper state: Use useState with mock data (not static import)
  // This ensures UI doesn't reset on re-renders and changes persist
  const [projects, setProjects] = useState<Project[]>(() => {
    return isShowcaseMode ? [...MOCK_PROJECTS] : [];
  });
  const [hasSyncedWithAPI, setHasSyncedWithAPI] = useState(false);

  useEffect(() => {
    loadProjects();
    // Navigation fix: Reset form state when component mounts (e.g., clicking 'Projects' in nav)
    setIsCreating(false);
    setEditingProject(null);
  }, [loadProjects]);

  // Sync with API projects on initial load only
  useEffect(() => {
    if (!hasSyncedWithAPI && apiProjects && apiProjects.length > 0) {
      // Clean up State: Filter out any null/undefined values
      const cleanProjects = apiProjects.filter(p => p != null && p.id != null);
      setProjects(cleanProjects);
      setHasSyncedWithAPI(true);
    }
  }, [apiProjects, hasSyncedWithAPI]);

  const onCreateClick = () => {
    setIsCreating(true);
    setEditingProject(null);
  };

  const onEditClick = (project: Project) => {
    // Correct Edit Trigger: Ensure the entire project object is set into state
    if (!project || !project.id) {
      console.error('Invalid project passed to edit:', project);
      toast.error('Cannot edit: Invalid project data');
      return;
    }
    
    // Set the entire project object (not just partial data) into editing state
    setEditingProject({ ...project }); // Create a copy to avoid reference issues
    setIsCreating(false);
  };

  const handleFormSubmit = async (formData: {
    name: string;
    description: string;
  }) => {
    // Validation Guard: Add a check at the very top of the handleSave function
    if (!formData.name || formData.name.trim() === '') {
      console.error('Cannot save: Name is empty');
      toast.error('Project name is required');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isCreating) {
        // Fix handleSave (Create Mode): Generate unique ID
        const uniqueId = `project-${Date.now()}`;
        
        let newProject: Project;
        try {
          newProject = await createProject({
            name: formData.name.trim(),
            description: formData.description?.trim() || undefined,
          });
          
          // Ensure ID exists (for showcase mode)
          if (!newProject.id || newProject.id === '') {
            newProject = {
              ...newProject,
              id: uniqueId,
              createdAt: newProject.createdAt || new Date().toISOString(),
            };
          }
        } catch (error) {
          // In showcase mode, create project locally if API fails
          if (isShowcaseMode) {
            newProject = {
              id: uniqueId,
              name: formData.name.trim(),
              description: formData.description?.trim(),
              createdAt: new Date().toISOString(),
            };
          } else {
            throw error;
          }
        }
        
        // Fix handleSave (Create Mode): Use setProjects([...projects, newProject])
        // Clean up State: Ensure we don't add null or undefined values
        if (!newProject || !newProject.id) {
          console.error('Invalid project created:', newProject);
          toast.error('Failed to create project: Invalid project data');
          return;
        }
        
        setProjects(prev => {
          // Filter out any null/undefined values first
          const cleanPrev = prev.filter(p => p != null && p.id != null);
          
          // Check if project already exists
          if (cleanPrev.some(p => p.id === newProject.id)) {
            return cleanPrev;
          }
          // Add to top of list
          return [newProject, ...cleanPrev];
        });
        
        toast.success('Project created successfully');
        
        // UI Cleanup: Set isCreating to false to return to clean list view
        setIsCreating(false);
        setEditingProject(null);
      } else if (editingProject) {
        // Fix handleSaveProject Logic: Verify ID exists before saving
        if (!editingProject?.id) {
          console.error('Missing ID in editing project:', editingProject);
          toast.error('Cannot save: Project ID is missing');
          setIsSubmitting(false);
          return;
        }
        
        // The Save Hand-off: Construct the object using current formData and editingProject.id
        // This ensures updatedProject is NEVER undefined
        const projectToSave: Project = {
          ...editingProject,
          ...formData,
          name: formData.name.trim(),
          description: formData.description?.trim() || undefined,
        };
        
        // Fix handleSave (Edit Mode): Use .map() to find existing project by ID and replace it
        let updatedProject: Project;
        
        try {
          // Call API with the constructed object
          updatedProject = await updateProject(editingProject.id, {
            name: projectToSave.name,
            description: projectToSave.description,
          });
          
          // Ensure the API response has all required fields
          if (!updatedProject || !updatedProject.id) {
            // Fallback to our constructed object if API response is incomplete
            updatedProject = projectToSave;
          } else {
            // Merge API response with our constructed object to ensure all fields are present
            updatedProject = { ...projectToSave, ...updatedProject };
          }
        } catch (error) {
          // In showcase mode, update project locally if API fails
          if (isShowcaseMode) {
            // Use the constructed object as fallback
            updatedProject = projectToSave;
          } else {
            throw error;
          }
        }
        
        // Fix handleSaveProject Logic: Verify the ID exists (should always pass now)
        if (!updatedProject?.id) {
          console.error('Missing ID in updated project:', updatedProject);
          toast.error('Failed to update: Project ID is missing');
          setIsSubmitting(false);
          return;
        }
        
        // Clear Validation Errors: Log success before state update
        console.log('Saving project:', updatedProject);
        
        // Fix handleSaveProject Logic: Use setProjects to find and replace with spread operator
        setProjects(prev => {
          // Clean the Array: Remove null/undefined items first
          const cleanProjects = prev.filter(p => p !== null && p !== undefined && p.id != null);
          
          // Use spread operator to merge existing project with updated data
          return cleanProjects.map(p => {
            if (p && p.id === updatedProject.id) {
              // Merge existing project properties with updated data
              return { ...p, ...updatedProject };
            }
            return p;
          });
        });
        
        // Activity Log Integration: Log project update (backend activity log would be added here)
        console.log('Project updated:', {
          projectId: updatedProject.id,
          projectName: updatedProject.name,
          timestamp: new Date().toISOString(),
        });
        
        // Clear Validation Errors: Success toast replaces any error messages
        toast.success('Project updated successfully');
        
        // UI Transition: Immediately set isEditing(false) and setEditingProject(null) to clear workspace
        setIsCreating(false);
        setEditingProject(null);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || `Failed to ${isCreating ? 'create' : 'update'} project`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setIsCreating(false);
    setEditingProject(null);
  };

  const onDeleteClick = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      await deleteProject(projectId);
      
      // Remove from state immediately with defensive filtering
      setProjects(prev => prev.filter(p => p != null && p.id != null && p.id !== projectId));
      
      toast.success('Project deleted successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to delete project');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-8 text-center text-gray-500">Loading showcase data...</div>
      </Layout>
    );
  }

  // Use projects state (initialized with useState)
  const safeProjects = projects;

  return (
    <Layout>
      <div className="px-4 py-6 sm:px-0">
        {/* Back to List Button - shown when editing/creating */}
        {(editingProject || isCreating) && (
          <div className="mb-6">
            <Link
              to="/projects"
              onClick={() => {
                setIsCreating(false);
                setEditingProject(null);
              }}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 font-medium transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Link>
          </div>
        )}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Project Management</h1>
          {!isCreating && !editingProject && (
            <button
              onClick={onCreateClick}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Create Project
            </button>
          )}
        </div>

        {(editingProject || isCreating) && (
          <ProjectForm
            initialData={editingProject}
            isCreating={isCreating}
            isLoading={isSubmitting}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            onBackToList={handleFormCancel}
          />
        )}

        {!isCreating && !editingProject && (
          <ProjectTable
            projects={safeProjects}
            onEdit={onEditClick}
            onDelete={onDeleteClick}
          />
        )}
      </div>
    </Layout>
  );
}
