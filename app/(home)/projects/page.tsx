'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, FolderOpen } from 'lucide-react';
import { Button } from '@/src/components/ui/Button';
import { Modal } from '@/src/components/ui/Modal';
import { EmptyState } from '@/src/components/composite/EmptyState';
import { ProjectCard } from '@/src/components/features/home/ProjectCard';
import type { Project } from '@/src/lib/mock-data';
import {
  fetchProjects,
  createProject,
  updateProject,
  deleteProject,
} from '@/src/lib/api/projects';

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  const loadProjects = useCallback(async () => {
    try {
      setError(null);
      const data = await fetchProjects();
      setProjects(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : '프로젝트를 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const handleOpenCreateModal = () => {
    setNewProjectName('');
    setCreateModalOpen(true);
  };

  const handleCreate = async () => {
    if (!newProjectName.trim()) return;
    try {
      const newProject = await createProject(newProjectName.trim());
      setProjects((prev) => [newProject, ...prev]);
      setCreateModalOpen(false);
      setNewProjectName('');
    } catch (e) {
      alert(e instanceof Error ? e.message : '프로젝트 생성에 실패했습니다');
    }
  };

  const handleEdit = async (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    const newName = window.prompt('새 이름을 입력하세요', target.name);
    if (!newName?.trim() || newName.trim() === target.name) return;
    try {
      const updated = await updateProject(id, newName.trim());
      setProjects((prev) =>
        prev.map((p) => (p.id === id ? updated : p))
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : '프로젝트 수정에 실패했습니다');
    }
  };

  const handleDelete = async (id: string) => {
    const target = projects.find((p) => p.id === id);
    if (!target) return;
    if (!window.confirm(`"${target.name}" 프로젝트를 삭제하시겠습니까?`)) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      alert(e instanceof Error ? e.message : '프로젝트 삭제에 실패했습니다');
    }
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
          <Button onClick={handleOpenCreateModal} className="gap-1.5">
            <Plus size={16} />새 프로젝트
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-8 py-8">
        <div className="max-w-[1200px] mx-auto">
          {loading ? (
            <div className="flex items-center justify-center h-[400px]">
              <p className="text-[14px] text-muted-foreground">프로젝트를 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-[400px] gap-3">
              <p className="text-[14px] text-destructive">{error}</p>
              <Button variant="outline" onClick={loadProjects}>
                다시 시도
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="h-[400px]">
              <EmptyState
                icon={<FolderOpen size={48} className="text-gray-300" />}
                title="아직 프로젝트가 없습니다"
                description="첫 프로젝트를 생성하고 Claude Code 세션을 연동해보세요."
                primaryAction={{
                  label: '+ 새 프로젝트 만들기',
                  onClick: handleOpenCreateModal,
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

      {/* 새 프로젝트 생성 모달 */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="새 프로젝트"
        width={400}
        actions={[
          {
            label: '취소',
            variant: 'outline',
            onClick: () => setCreateModalOpen(false),
          },
          {
            label: '생성',
            variant: 'primary',
            onClick: handleCreate,
          },
        ]}
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="project-name" className="text-[13px] font-medium text-foreground">
            프로젝트 이름
          </label>
          <input
            id="project-name"
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            placeholder="프로젝트 이름을 입력하세요"
            autoFocus
            className="w-full px-3 py-2.5 text-[14px] border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          />
        </div>
      </Modal>
    </div>
  );
}
