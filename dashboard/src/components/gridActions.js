import {
  EuiButton,
  EuiFilePicker,
  EuiFlexGroup,
  EuiFlexItem,
} from "@elastic/eui";
import { css } from "@emotion/react";
import { useGridActions } from "../hooks/useGridActions.hook";

export const GridActions = (props) => {
  const {
    showModal,
    openFreeEdit,
    uploadYamlTemplate,
    loadingYamlUpload,
    setVariables,
    setFeatures,
    features,
    variables,
    selectionContext,
  } = props;

  const { deleteSelectedRows } = useGridActions(
    variables,
    features,
    selectionContext,
    setVariables,
    setFeatures
  );

  return <div css={css` width: 400px; max-width: 400px; margin: auto; `}>
    <br></br>
    <EuiFlexGroup justifyContent="flexEnd" alignItems="flexEnd" gutterSize="s">
      <EuiFlexItem grow={false} style={{ width: "180px" }}>
        <EuiButton onClick={() => showModal()}>Create counter</EuiButton>
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ width: "180px" }}>
        <EuiButton
          color="danger"
          onClick={() => {
            deleteSelectedRows();
          }}
        >
          Delete counters
        </EuiButton>
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ width: "180px" }}>
        <EuiButton onClick={() => openFreeEdit()}>Edit YAML</EuiButton>
      </EuiFlexItem>
      <EuiFlexItem grow={false} style={{ width: "180px" }}>
        <EuiFilePicker
          id="file-picker-yaml"
          initialPromptText="Upload template"
          onChange={(res) => { uploadYamlTemplate(res); }}
          display="default"
          aria-label="Use aria labels when no actual label is in use"
          isLoading={loadingYamlUpload}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  </div>;
};
