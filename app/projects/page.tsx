'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/src/lib/supabase/client';
import type { Database } from '@/src/lib/supabase/types';

type Project = Database['public']['Tables']['projects']['Row'];

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchProjects = async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });
    setProjects(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchProjects(); }, []);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    const { error } = await supabase
      .from('projects')
      .insert({ user_id: (await supabase.auth.getUser()).data.user!.id, name: newName.trim() });
    if (!error) {
      setNewName('');
      fetchProjects();
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) return;
    const { error } = await supabase
      .from('projects')
      .update({ name: editName.trim() })
      .eq('id', id);
    if (!error) {
      setEditingId(null);
      setEditName('');
      fetchProjects();
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`"${name}" 프로젝트를 삭제하시겠습니까?`)) return;
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id);
    if (!error) fetchProjects();
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground text-[14px]">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[720px] mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[24px] font-bold text-foreground">모든 프로젝트</h1>
          <span className="text-[13px] text-muted-foreground">{projects.length}개</span>
        </div>

        {/* Create */}
        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="새 프로젝트 이름"
            className="flex-1 px-4 py-2.5 border border-border rounded-lg text-[14px] text-foreground placeholder:text-gray-300 focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={handleCreate}
            className="px-5 py-2.5 bg-primary text-white text-[14px] font-semibold rounded-lg hover:bg-primary-hover transition-colors cursor-pointer"
          >
            생성
          </button>
        </div>

        {/* List */}
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-[16px] text-muted-foreground">아직 프로젝트가 없습니다</p>
            <p className="text-[13px] text-gray-400 mt-1">위에서 새 프로젝트를 생성해보세요.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {projects.map((project) => (
              <div
                key={project.id}
                className="flex items-center justify-between bg-card border border-border rounded-xl px-5 py-4 shadow-card hover:shadow-card-hover transition-shadow"
              >
                {editingId === project.id ? (
                  /* 수정 모드 */
                  <div className="flex items-center gap-3 flex-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUpdate(project.id)}
                      className="flex-1 px-3 py-1.5 border border-border rounded-lg text-[14px] text-foreground focus:border-primary focus:outline-none"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleUpdate(project.id)}
                      className="px-3 py-1.5 bg-gray-700 text-white text-[13px] font-semibold rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => { setEditingId(null); setEditName(''); }}
                      className="px-3 py-1.5 text-[13px] text-muted-foreground hover:bg-muted rounded-lg transition-colors cursor-pointer"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  /* 표시 모드 */
                  <>
                    <div className="flex flex-col">
                      <span className="text-[14px] font-semibold text-foreground">{project.name}</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                          <span className={`w-2 h-2 rounded-full ${project.agent_status === 'connected' ? 'bg-success' : 'bg-destructive'}`} />
                          {project.agent_status === 'connected' ? '연결됨' : '미연결'}
                        </span>
                        <span className="text-[12px] text-gray-400">
                          {new Date(project.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => { setEditingId(project.id); setEditName(project.name); }}
                        className="px-3 py-1.5 text-[13px] text-muted-foreground border border-border rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(project.id, project.name)}
                        className="px-3 py-1.5 text-[13px] text-destructive border border-red-300 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                      >
                        삭제
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
