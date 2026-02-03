import { Project } from '../types';

interface ProjectTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

export function ProjectTable({ projects, onEdit, onDelete }: ProjectTableProps) {
  // Universal data guard with optional chaining and nullish coalescing
  const safeProjects = (projects ?? []) || [];

  if ((safeProjects?.length ?? 0) === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <p className="text-gray-500">No projects found</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Name
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Description
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Created
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {(safeProjects || []).map((project) => (
            <tr key={project?.id ?? ''} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {project?.name ?? 'Untitled'}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {project?.description ?? '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : '-'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      // Fix the Trigger: Ensure full project object is passed with validation
                      if (project && project.id) {
                        onEdit(project);
                      } else {
                        console.error('Cannot edit: Invalid project object', project);
                      }
                    }}
                    className="inline-flex items-center justify-center space-x-2 w-20 py-2 text-sm font-semibold tracking-tight text-white bg-indigo-600 bg-gradient-to-b from-white/10 to-transparent rounded-lg shadow-sm ring-1 ring-inset ring-white/10 hover:bg-indigo-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => {
                      // Defensive check before delete
                      if (project && project.id) {
                        onDelete(project.id);
                      } else {
                        console.error('Cannot delete: Invalid project object', project);
                      }
                    }}
                    className="inline-flex items-center justify-center space-x-2 w-20 py-2 text-sm font-semibold tracking-tight text-white bg-rose-600 bg-gradient-to-b from-white/10 to-transparent rounded-lg shadow-sm ring-1 ring-inset ring-white/10 hover:bg-rose-700 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                  >
                    <span>Delete</span>
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
