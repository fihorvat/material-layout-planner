import { useCallback } from 'react';
import { useProjectStore } from '@/state';
import { generateLayoutsForProject } from '@/domain/materialLayout/generateLayoutsForProject';
import { dispatchCommand, setMaterialLayoutsCommand } from '@/domain/commands';

export const useGenerateLayout = () => {
  const generateAndPersist = useCallback(() => {
    const project = useProjectStore.getState().project;
    const layouts = generateLayoutsForProject(project);
    dispatchCommand(setMaterialLayoutsCommand({ layouts }));
  }, []);
  return { generateAndPersist };
};
