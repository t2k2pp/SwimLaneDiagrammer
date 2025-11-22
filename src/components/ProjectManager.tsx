import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, FolderOpen } from 'lucide-react';
import { useDiagramStore } from '../core/store';
import { listProjects, deleteProject, deleteAllProjects, type ProjectData } from '../core/db';
import './ProjectManager.css';

interface ProjectManagerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({ isOpen, onClose }) => {
    const [projects, setProjects] = useState<ProjectData[]>([]);
    const [newProjectName, setNewProjectName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const { setProjectName, loadDiagram, clearDiagram, currentProjectName, pools, shapes, saveCurrentProject } = useDiagramStore();

    useEffect(() => {
        if (isOpen) {
            refreshProjects();
        }
    }, [isOpen]);

    const refreshProjects = async () => {
        const projectList = await listProjects();
        setProjects(projectList);
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) {
            alert('プロジェクト名を入力してください');
            return;
        }

        // Check if there's existing work
        const hasWork = pools.length > 0 || Object.keys(shapes).length > 0;

        if (hasWork && !currentProjectName) {
            const keepWork = window.confirm('現在の作業をこのプロジェクトとして保存しますか？\n\nはい: 現在の作業を保存\nいいえ: 空のプロジェクトを作成');

            if (keepWork) {
                // Save current work with the new name
                setProjectName(newProjectName);
                await saveCurrentProject();
            } else {
                // Clear diagram and start fresh
                setProjectName(newProjectName);
                clearDiagram();
            }
        } else {
            setProjectName(newProjectName);
            if (!hasWork) {
                clearDiagram();
            }
        }

        setIsCreating(false);
        setNewProjectName('');
        onClose();
    };

    const handleLoadProject = async (projectData: ProjectData) => {
        // Check if there's unsaved work
        const hasWork = pools.length > 0 || Object.keys(shapes).length > 0;

        if (hasWork && !currentProjectName) {
            if (!window.confirm('現在の作業は保存されていません。プロジェクトを読み込むと失われます。\n\n続けますか？')) {
                return;
            }
        }

        setProjectName(projectData.name);
        loadDiagram({
            ...projectData.data,
            selectedIds: [],
            activeTool: 'select' as const,
            connectionSourceId: null,
            clipboardShapeId: null,
            currentProjectName: projectData.name,
            history: [],
            historyIndex: -1
        });
        onClose();
    };

    const handleDeleteProject = async (name: string) => {
        if (!window.confirm(`プロジェクト "${name}" を削除しますか？`)) {
            return;
        }

        await deleteProject(name);
        await refreshProjects();

        if (currentProjectName === name) {
            setProjectName(null);
            clearDiagram();
        }
    };

    const handleDeleteAll = async () => {
        if (!window.confirm('すべてのプロジェクトを削除しますか？この操作は取り消せません。')) {
            return;
        }

        await deleteAllProjects();
        await refreshProjects();
        setProjectName(null);
        clearDiagram();
    };

    if (!isOpen) return null;

    return (
        <div className="project-manager-overlay">
            <div className="project-manager">
                <div className="project-manager-header">
                    <h2>プロジェクト管理</h2>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="project-manager-content">
                    {/* Save Current Work */}
                    {!currentProjectName && (pools.length > 0 || Object.keys(shapes).length > 0) && (
                        <div className="save-current-work-section">
                            <div className="warning-message">
                                ⚠️ 現在のプロジェクトが指定されていません。作業は自動保存されません。
                            </div>
                            <button
                                className="save-current-btn"
                                onClick={() => setIsCreating(true)}
                            >
                                現在の作業にプロジェクト名をつけて保存
                            </button>
                        </div>
                    )}

                    {/* New Project Section */}
                    <div className="new-project-section">
                        {isCreating ? (
                            <div className="new-project-form">
                                <input
                                    type="text"
                                    placeholder="プロジェクト名を入力..."
                                    value={newProjectName}
                                    onChange={(e) => setNewProjectName(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleCreateProject()}
                                    autoFocus
                                />
                                <button onClick={handleCreateProject}>作成</button>
                                <button onClick={() => { setIsCreating(false); setNewProjectName(''); }}>
                                    キャンセル
                                </button>
                            </div>
                        ) : (
                            <button className="new-project-btn" onClick={() => setIsCreating(true)}>
                                <Plus size={20} />
                                新規プロジェクト
                            </button>
                        )}
                    </div>

                    {/* Project List */}
                    <div className="project-list">
                        <div className="project-list-header">
                            <h3>保存済みプロジェクト</h3>
                            {projects.length > 0 && (
                                <button className="delete-all-btn" onClick={handleDeleteAll}>
                                    すべて削除
                                </button>
                            )}
                        </div>

                        {projects.length === 0 ? (
                            <div className="no-projects">
                                <FolderOpen size={48} opacity={0.3} />
                                <p>プロジェクトがありません</p>
                            </div>
                        ) : (
                            <div className="projects">
                                {projects.map((project) => (
                                    <div
                                        key={project.name}
                                        className={`project-item ${currentProjectName === project.name ? 'active' : ''}`}
                                    >
                                        <div className="project-info" onClick={() => handleLoadProject(project)}>
                                            <div className="project-name">{project.name}</div>
                                            <div className="project-meta">
                                                最終更新: {new Date(project.lastModified).toLocaleString('ja-JP')}
                                            </div>
                                        </div>
                                        <button
                                            className="delete-project-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteProject(project.name);
                                            }}
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
