import { useEffect, useRef } from 'react';
import { useDiagramStore } from '../core/store';

export const AutoSave = () => {
    const { currentProjectName, saveCurrentProject, pools, shapes, connections } = useDiagramStore();
    const timeoutRef = useRef<number | null>(null);

    useEffect(() => {
        // Only auto-save if there's a project name
        if (!currentProjectName) {
            return;
        }

        // Clear existing timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Set new timeout for 3 seconds
        timeoutRef.current = setTimeout(() => {
            saveCurrentProject();
        }, 3000);

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, [pools, shapes, connections, currentProjectName, saveCurrentProject]);

    return null; // This component doesn't render anything
};
