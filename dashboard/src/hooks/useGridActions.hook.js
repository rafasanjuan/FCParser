import { useContext } from "react";
export const useGridActions = (
  variables,
  features,
  selectionContext,
  setVariables,
  setFeatures
) => {
  const [selectedRows, updateSelectedRows] = useContext(selectionContext);
  const deleteSelectedRows = () => {
    setFeatures(
      features.filter((elem, idx) => !selectedRows.has(idx + variables.length))
    );
    setVariables(
      variables.filter((elem) => !selectedRows.has(elem.where))
    );

    updateSelectedRows({ action: 'clear' });
  };

  return { deleteSelectedRows };
};
