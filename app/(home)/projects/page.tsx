'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { EmptyState } from '@/src/components/composite/EmptyState';
import { ProjectCard } from '@/src/components/features/home/ProjectCard';
import { mockProjects, type Project } from '@/src/lib/mock-data';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>(mockProjects);

  const handleCreate = () => {
    const name = window.prompt('새 프로젝트 이름을 입력하세요');
    if (!name?.trim()) return;
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      agentStatus: 'disconnected',
      issueCount: { critical: 0, warning: 0, info: 0 },
      implementationRate: 0,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setProjects((prev) => [newProject, ...prev]);
  };

  const handleEdit = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const newName = window.prompt('새 이름을 입력하세요', target.name);
    if (!newName?.trim()) return;
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: newName.trim() } : p))
    );
  };

  const handleDelete = (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    if (!window.confirm(`"${target.name}" 프로젝트를 삭제하시겠습니까?`)) return;
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleClick = (id: string) => {
    router.push(`/projects/${id}/status`);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-border bg-background sticky top-0 z-10">
        <div className="max-w-[1200px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-[24px] font-bold text-foreground">모든 프로젝트</h1>
            <p className="text-[13px] text-muted-foreground mt-1">
              총 {projects.length}개의 프로젝트
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-1.5">
            <Plus size={16} />새 프로젝트
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        <div className="max-w-[1200px] mx-auto">
          {projects.length === 0 ? (
            <div className="h-[400px]">
              <EmptyState
                icon={<FolderOpen size={48} className="text-gray-300" />}
                title="아직 프로젝트가 없습니다"
                description="첫 프로젝트를 생성하고 Claude Code 세션을 연동해보세요."
                primaryAction={{
                  label: '+ 새 프로젝트 만들기',
                  onClick: handleCreate,
                }}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onClick={() => handleClick(project.id)}
                  onEdit={() => handleEdit(project.id)}
                  onDelete={() => handleDelete(project.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
