import React, {
  useState,
  useCallback,
  createContext,
  useContext,
  useReducer,
  Fragment,
} from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCashRegister,
  faChartLine,
  faCloudUploadAlt,
  faPlus,
  faRocket,
  faTasks,
  faUserShield,
} from "@fortawesome/free-solid-svg-icons";
import {
  Col,
  Row,
  Button,
  Dropdown,
  ButtonGroup,
} from "@themesberg/react-bootstrap";

import {
  CounterWidget,
  CircleChartWidget,
  BarChartWidget,
  TeamMembersWidget,
  ProgressTrackWidget,
  RankingWidget,
  SalesValueWidget,
  SalesValueWidgetPhone,
  AcquisitionWidget,
} from "../../components/Widgets";
import { PageVisitsTable } from "../../components/Tables";
import { trafficShares, totalOrders } from "../../data/charts";

import { css } from "@emotion/react";
import {
  EuiIcon,
  EuiToken,
  EuiCode,
  EuiText,
  EuiFilePicker,
  useEuiTheme,
} from "@elastic/eui";
import {
  formatDate,
  EuiBasicTable,
  EuiLink,
  EuiHealth,
  EuiDataGrid,
  EuiFlexGroup,
  EuiFlexItem,
  EuiCodeBlock,
  EuiPanel,
  RIGHT_ALIGNMENT,
  EuiScreenReaderOnly,
  EuiButtonIcon,
  EuiDescriptionList,
  EuiProgress,
  EuiSpacer,
  EuiButton,
  EuiButtonEmpty,
  EuiFieldText,
  EuiForm,
  EuiFormRow,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiRange,
  EuiSwitch,
  EuiSuperSelect,
  EuiComboBox,
  useGeneratedHtmlId,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiFlyoutFooter,
  EuiTitle,
  EuiCard,
  EuiToolTip,
  EuiTabs,
  EuiTab,
  EuiCheckbox,
} from "@elastic/eui";
import Editor from "@monaco-editor/react";
import jsyaml from "js-yaml";
// import yamlTemplate from "./netflow.yaml";

// import { createDataStore } from '../data_store';
import {
  EUI_CHARTS_THEME_DARK,
  EUI_CHARTS_THEME_LIGHT,
} from "@elastic/eui/dist/eui_charts_theme";
import { Theming } from "../../components/Charts";
import {
  Axis,
  BarSeries,
  Chart,
  Position,
  ScaleType,
  Settings,
  useBaseTheme,
} from "@elastic/charts";
import BarChart from "../../components/BarChart";
import DataGrid from "../../components/DataGrid";
import { GridActions } from "./components/gridActions";

const apiUrl = "http://localhost:5000/api";
var intervalStatusPooling;

export default () => {
  const { euiTheme } = useEuiTheme();

  const uploadFile = (e) => {
    if (e.length == 0) return;
    setLoadingFileUpload(true);
    // e.preventDefault();
    let file = e;
    const formData = new FormData();

    // formData.append("file", e[1]);
    for (var i = 0; i < e.length; i++) {
      formData.append("files[]", e[i]);
    }

    axios
      .post("http://localhost:5000/api/upload", formData)
      .then((res) => {
        let analysis = JSON.parse(res.data.analysis);
        console.log(res);
        console.log(analysis);
        console.log(res.data.columns);
        let newRows = [];
        let newVariables = [];
        // let count = 0;
        // Object.keys(res.data.columns).forEach(key => {
        //   newRows.push({
        //     id: String(count),
        //     columnName: key,
        //     type: res.data.columns[key] === 'object' ? 'categorical' : res.data.columns[key]
        //   })
        //   count++;
        // })
        let columnNames = [];
        Object.keys(analysis.variables).forEach((columnKey, idx) => {
          let row = analysis.variables[columnKey];
          row.id = idx;
          row.columnName = columnKey;
          row.mainStats = {
            type: row.type,
            categories: row.n_distinct,
            min: row.min,
            max: row.max,
            mean: (Math.round(row.mean * 100) / 100).toFixed(0),
          };
          newRows.push(row);
          columnNames.push({ label: columnKey });

          let variable = {
            type: (
              <EuiToken
                size="m"
                iconType="tag"
                shape="square"
                color="#eef7f5"
              />
            ),
            where: idx + 1,
            name: columnKey,
            matchtype: analysisVariablesToYamlFormat(
              analysis.variables[columnKey].type
            ),
          };
          newVariables.push(variable);
        });
        setItems([...items, ...newRows]);
        setPageOfItems(
          [...items, ...newRows].slice(
            pageIndexEda * pageSizeEda,
            pageIndexEda * pageSizeEda + pageSizeEda
          )
        );
        setAllDatasetVariables([...allDatasetVariables, ...newVariables]);
        setAnalysis(analysis);
        setIsFileUploaded(true);
        setFileHead(res.data.head);
        setDataSample(analysis.sample[0].data);
        setcolumnsDataset(columnNames); // JSON.parse(JSON.stringify(columnNames))
        console.log(items);
      })
      .catch((err) => console.error(err))
      .finally(() => {
        setLoadingFileUpload(false);
      });
  };

  const [isParserRunning, setIsParserRunning] = useState(false);
  const [parserExecutionLog, setParserExecutionLog] = useState("");
  const runParser = () => {
    const formData = new FormData();
    formData.append("session_id", "1661858000");
    axios
      .post(`${apiUrl}/parser`, formData)
      .then((res) => {
        setIsParserRunning(true);
        intervalStatusPooling = setInterval(() => {
          checkIsParserRunning();
        }, 1000);
      })
      .catch((error) => console.log("Error running parser", error));
    // .finally(() => {
    // setIsParserRunning(false);
    // })
  };

  const checkIsParserRunning = () => {
    axios
      .get(`${apiUrl}/status/1661858000`)
      .then((res) => {
        if (res.status === 202) {
          console.log("FCParser execution still in progress...");
          setParserExecutionLog(res.data.message);
        } else {
          clearInterval(intervalStatusPooling);
          setIsParserRunning(false);
          console.log("parser finished execution");
        }
      })
      .catch((error) => {
        // if (error.status == '302') {
        //   setParserExecutionLog(error.data)
        //   console.log('FCParser execution still in progress...')
        // } else {
        console.log("Error fetching results", error);
        // }
      });
  };

  const downloadResults = () => {
    window.open(`${apiUrl}/results/1661858000`);
    // axios
    //   .get(`${apiUrl}/results/1661858000`)
    //   .catch(error => console.log('Error fetching results', error))
  };

  const analysisVariablesToYamlFormat = (type) => {
    let result = "string";
    switch (type) {
      case "Numeric":
        result = "number";
        break;
      case "Categorical":
        result = "string";
        break;
    }
    return result;
  };

  /**
   * Generates text with icon for highlightning variable types.
   */
  const generateVariableTag = (type) => {
    let icon, color;
    switch (type) {
      case "Numeric":
        icon = "tokenNumber";
        color = "#f8f6f3";
        break;
      case "Categorical":
        icon = "tokenString";
        color = "#f8f6f3";
        break;
      case "Datetime":
        icon = "tokenDate";
        color = "#f8f6f3";
        break;
      case "Boolean":
        icon = "tokenBoolean";
        color = "#f8f6f3";
        break;
      default:
        icon = "questionInCircle";
    }
    return (
      <EuiToolTip content={type} position="right">
        <EuiFlexGroup direction="row" alignItems="center" gutterSize="s">
          <EuiFlexItem grow={false}>
            <EuiToken iconType={icon} size="s" shape="square"></EuiToken>
          </EuiFlexItem>
          <EuiFlexItem>{type}</EuiFlexItem>
        </EuiFlexGroup>
      </EuiToolTip>
    );
  };

  const uploadYamlTemplate = (e) => {
    if (e.length == 0) return;

    setLoadingYamlUpload(true);
    // e.preventDefault();
    let file = e[0];
    const formData = new FormData();

    const reader = new FileReader();

    reader.addEventListener(
      "load",
      () => {
        setTemplateYaml(reader.result);
        setLoadingYamlUpload(false);
      },
      false
    );

    if (file) {
      reader.readAsText(file);
    }
  };

  // const store = createDataStore();

  // const [items, setItems] = useState([
  //   {
  //     id: '1',
  //     firstName: 'john',
  //     lastName: 'doe',
  //     github: 'johndoe',
  //     dateOfBirth: Date.now(),
  //     nationality: 'NL',
  //     online: true
  //   }
  // ]);
  const [items, setItems] = useState([
    // {
    //   id: 0,
    //   columnName: 'test column',
    //   type: 'boolean'
    // }
  ]);
  const [pageOfItems, setPageOfItems] = useState([]);
  const [analysisResults, setAnalysis] = useState({});
  const [isFileUploaded, setIsFileUploaded] = useState(false);
  const [loadingFileUpload, setLoadingFileUpload] = useState(false);
  const [loadingYamlUpload, setLoadingYamlUpload] = useState(false);
  const [fileHead, setFileHead] = useState();

  // General config
  const [generalConfig, setGeneralConfig] = useState({
    tag: "netflow",
    structured: true,
    timestamp_format: "%Y-%m-%d %H:%M:%S",
    timearg: "timestamp",
  });
  const [variables, setVariables] = useState([]);
  const [allDatasetVariables, setAllDatasetVariables] = useState([]);
  const [features, setFeatures] = useState([
    // Example feature structure:
    // {
    //   type: <EuiToken size="m" iconType="logstashIf" shape="square" color="#eff4f9"/>,
    //   name: 'src_ip_private',
    //   variable: 'flg',
    //   matchtype: 'single',
    //   value: 'private'
    // }
  ]);

  const [dataFormCreateCounter, setDataFormCreateCounter] = useState({
    variable: "pr",
    name: "",
    matchtype: "single",
    value: "",
  });

  const onClickSaveSelected = () => {
    if (selectedItems.length === 0) {
      return;
    }
    let selectedNames = selectedItems.map((item) => item.columnName);
    let selectedVariables = allDatasetVariables.filter(
      (elem) => selectedNames.findIndex((y) => y === elem.name) !== -1
    );
    setVariables(selectedVariables);
  };

  const [selectedItems, setSelectedItems] = useState([]);

  const onSelectionChange = (selectedItems) => {
    setSelectedItems(selectedItems);
  };

  const selection = {
    selectable: () => {
      return true;
    },
    // initialSelected: () => {return true;},
    onSelectionChange: onSelectionChange,
  };

  const columns = [
    {
      field: "type",
      name: "Type",
      render: (type) => {
        return generateVariableTag(type);
      },
    },
    {
      field: "columnName",
      name: "Column",
    },
    {
      field: "n_missing",
      name: "Missing Values",
    },
    {
      field: "n_unique",
      name: "Unique values",
    },
    {
      field: "mainStats",
      name: "Stats",
      render: (mainStats) => (
        <div>
          {mainStats.type !== "Categorical" && (
            <EuiFlexGroup
              justifyContent="spaceAround"
              gutterSize="s"
              css={css`
                min-width: 180px;
              `}
            >
              <EuiFlexItem>
                {" "}
                <EuiText>
                  <b
                    css={css`
                      word-break: normal;
                    `}
                  >
                    min
                  </b>
                  <br></br>
                  <span
                    css={css`
                      word-break: normal;
                    `}
                  >
                    {mainStats.min}
                  </span>{" "}
                </EuiText>{" "}
              </EuiFlexItem>
              <EuiFlexItem>
                {" "}
                <EuiText>
                  <b
                    css={css`
                      word-break: normal;
                    `}
                  >
                    mean
                  </b>
                  <br></br>
                  <span
                    css={css`
                      word-break: normal;
                    `}
                  >
                    {mainStats.mean}
                  </span>{" "}
                </EuiText>{" "}
              </EuiFlexItem>
              <EuiFlexItem>
                {" "}
                <EuiText>
                  <b
                    css={css`
                      word-break: normal;
                    `}
                  >
                    max
                  </b>
                  <br></br>
                  <span
                    css={css`
                      word-break: normal;
                    `}
                  >
                    {mainStats.max}
                  </span>
                </EuiText>{" "}
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
          {mainStats.type === "Categorical" && (
            <EuiFlexGroup justifyContent="spaceAround">
              {/* <EuiFlexItem gutterSize="s"> <EuiText><i>{mainStats.categories} categories</i> </EuiText> </EuiFlexItem> */}
            </EuiFlexGroup>
          )}
        </div>
      ),
    },
    {
      align: RIGHT_ALIGNMENT,
      width: "40px",
      isExpander: true,
      name: (
        <EuiScreenReaderOnly>
          <span>Expand rows</span>
        </EuiScreenReaderOnly>
      ),
      render: (item) => (
        <EuiButtonIcon
          onClick={() => toggleDetails(item)}
          aria-label={itemIdToExpandedRowMap[item.id] ? "Collapse" : "Expand"}
          iconType={itemIdToExpandedRowMap[item.id] ? "arrowUp" : "arrowDown"}
        />
      ),
    },
  ];

  // const items = store.users.filter((user, index) => index < 10);

  const getRowProps = (item) => {
    const { id } = item;
    return {
      "data-test-subj": `row-${id}`,
      className: "customRowClass",
      onClick: () => {},
    };
  };

  const getCellProps = (item, column) => {
    const { id } = item;
    const { field } = column;
    return {
      className: "customCellClass",
      "data-test-subj": `cell-${id}-${field}`,
      textOnly: true,
    };
  };

  const [itemIdToExpandedRowMap, setItemIdToExpandedRowMap] = useState({});
  const toggleDetails = (item) => {
    console.log(item);
    const itemIdToExpandedRowMapValues = { ...itemIdToExpandedRowMap };
    if (itemIdToExpandedRowMapValues[item.id]) {
      delete itemIdToExpandedRowMapValues[item.id];
    } else {
      const listItems = [
        {
          title: "Nationality",
          description: "test1", //`${country.flag} ${country.name}`,
        },
        {
          title: "Online",
          description: "test", //<EuiHealth color={color}>{label}</EuiHealth>,
        },
      ];

      const generateTopValues = (value_counts_without_nan) => {
        let result = [];
        let keys = Object.keys(value_counts_without_nan);

        for (let i = 0; i < keys.length && i < 10; i++) {
          let key = keys[i];
          result.push(
            <p>
              {key}: {value_counts_without_nan[key]}
            </p>
          );
        }
        return <div>{result}</div>;
      };
      const generateTopValuesArray = (value_counts_without_nan) => {
        let result = [];
        let keys = Object.keys(value_counts_without_nan);

        for (let i = 0; i < keys.length && i < 10; i++) {
          let key = keys[i];
          // result.push(<p>{key}: {value_counts_without_nan[key]}</p>);
          let value = String(
            (value_counts_without_nan[key] * 100) / analysisResults.table.n
          );
          result.push({
            label: key,
            value: value,
            valueText: (
              <span>
                {value_counts_without_nan[key]} ({parseFloat(value).toFixed(2)}{" "}
                %)
              </span>
            ),
          });
        }
        return result;
      };
      let topValues = generateTopValues(item.value_counts_without_nan);
      let topValuesArray = generateTopValuesArray(
        item.value_counts_without_nan
      );
      itemIdToExpandedRowMapValues[item.id] = (
        <>
          <EuiFlexGroup>
            <EuiFlexItem>
              <h3>Quantile statistics</h3>
              <table className="table table-condensed stats">
                <tbody>
                  <tr>
                    <th>Distinct</th>
                    <td>{item.n_distinct}</td>
                  </tr>
                  <tr>
                    <th>Distinct (%)</th>
                    <td>{item.p_distinct}</td>
                  </tr>
                  <tr>
                    <th>Missing</th>
                    <td>{item.n_missing}</td>
                  </tr>
                  <tr>
                    <th>Missing (%)</th>
                    <td>{item.p_distinct}</td>
                  </tr>
                  <tr>
                    <th>Infinite</th>
                    <td>{item.n_infinite}</td>
                  </tr>
                  <tr>
                    <th>Infinite (%)</th>
                    <td>{item.p_infinite}</td>
                  </tr>
                  <tr>
                    <th>Mean</th>
                    <td>{item.mean}</td>
                  </tr>
                </tbody>
              </table>
            </EuiFlexItem>
            {item.type === "Categorical" && (
              <EuiFlexItem>
                <h3>
                  <b>Top values</b>
                </h3>
                {/* {topValues} */}
                <div style={{ maxWidth: 260 }}>
                  {topValuesArray.map((item) => (
                    <React.Fragment key={item.value}>
                      <EuiProgress
                        valueText={true}
                        max={100}
                        color="success"
                        size="s"
                        {...item}
                      />
                      <EuiSpacer size="s" />
                    </React.Fragment>
                  ))}
                </div>
              </EuiFlexItem>
            )}
            {item.type === "Numeric" && (
              <>
                <EuiFlexItem>
                  <h3>Descriptive statistics</h3>
                  <table className="table table-condensed stats">
                    <tbody>
                      <tr>
                        <th>Minimum</th>
                        <td>{item["5%"]}</td>
                      </tr>
                      <tr>
                        <th>5-th percentile</th>
                        <td>{item["5%"]}</td>
                      </tr>
                      <tr>
                        <th>Q1</th>
                        <td>{item["25%"]}</td>
                      </tr>
                      <tr>
                        <th>Median</th>
                        <td>{item["50%"]}</td>
                      </tr>
                      <tr>
                        <th>Q3</th>
                        <td>{item["75%"]}</td>
                      </tr>
                      <tr>
                        <th>95-th perentile</th>
                        <td>{item["95%"]}</td>
                      </tr>
                      <tr>
                        <th>Maximum</th>
                        <td>{item.mean}</td>
                      </tr>
                      <tr>
                        <th>Interquartile range (IQR)</th>
                        <td>{item.iqr}</td>
                      </tr>
                    </tbody>
                  </table>
                </EuiFlexItem>
                <EuiFlexItem>
                  <div
                    css={css`
                      min-width: 600px;
                    `}
                  >
                    {/* <p>Is numeric</p> */}
                    <BarChart
                      x={item.histogram.bin_edges}
                      y={item.histogram.counts}
                    />
                  </div>
                </EuiFlexItem>
              </>
            )}
          </EuiFlexGroup>
        </>
      );
    }
    setItemIdToExpandedRowMap(itemIdToExpandedRowMapValues);
  };

  const [pageIndexEda, setPageIndexEda] = useState(0);
  const [pageSizeEda, setPageSizeEda] = useState(10);

  const onTableChangeEda = ({ page = {} }) => {
    const { index: pageIndex, size: pageSize } = page;

    setPageIndexEda(pageIndex);
    setPageSizeEda(pageSize);
    setPageOfItems(
      items.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize)
    );
  };

  const paginationEda = {
    pageIndex: pageIndexEda,
    pageSize: pageSizeEda,
    totalItemCount: 50, // TODO
    pageSizeOptions: [10, 25, 30],
  };

  const customColumn = [
    {
      label: "Create counter",
      onClick: (test) => {
        showModal();
      },
      iconType: "cheer",
      size: "xs",
      color: "text",
    },
  ];
  const [columnsDatag, setColumnsDatag] = useState([
    { id: "ts", actions: { additional: customColumn } },
    { id: "te", actions: { additional: customColumn } },
    { id: "td", actions: { additional: customColumn } },
    { id: "sa", actions: { additional: customColumn } },
    { id: "da", actions: { additional: customColumn } },
    { id: "sp", actions: { additional: customColumn } },
    { id: "dp", actions: { additional: customColumn } },
    { id: "pr", actions: { additional: customColumn } },
    { id: "flg", actions: { additional: customColumn } },
  ]);

  const [columnsYaml, setcolumnsYaml] = useState([
    { id: "type", displayAsText: " ", initialWidth: 40, isResizable: false },
    { id: "where", displayAsText: "Where", initialWidth: 80 },
    { id: "name", displayAsText: "Name" },
    { id: "variable", displayAsText: "Variable" },
    { id: "matchtype", displayAsText: "Matchtype" },
    { id: "value", displayAsText: "Value" },
  ]);
  const [visibleColumns, setVisibleColumns] = useState([
    "ts",
    "te",
    "td",
    "sa",
    "da",
    "sp",
    "dp",
    "pr",
    "flg",
  ]);
  const [visibleColumnsYaml, setVisibleColumnsYaml] = useState([
    "type",
    "where",
    "name",
    "variable",
    "matchtype",
    "value",
  ]);

  const [columnsDataset, setcolumnsDataset] = useState([
    { label: "ts" },
    { label: "te" },
    { label: "td" },
    { label: "sa" },
    { label: "da" },
    { label: "sp" },
    { label: "dp" },
    { label: "pr" },
    { label: "flg" },
  ]);

  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 15 });

  const setPageIndex = useCallback(
    (pageIndex) => setPagination({ ...pagination, pageIndex }),
    [pagination, setPagination]
  );
  const setPageSize = useCallback(
    (pageSize) => setPagination({ ...pagination, pageSize, pageIndex: 0 }),
    [pagination, setPagination]
  );

  const [dataSample, setDataSample] = useState([]);
  const RenderCellValue = ({ rowIndex, columnId, setCellProps }) => {
    return (
      Array.isArray(dataSample) &&
      dataSample.length > rowIndex &&
      dataSample[rowIndex].hasOwnProperty(columnId) &&
      dataSample[rowIndex][columnId]
    );
  };
  const RenderCellValueYaml = ({ rowIndex, columnId, setCellProps }) => {
    // Combinar datasets:
    // let result = '';
    // if (variables.length > rowIndex) {
    //   result = Array.isArray(variables) && variables[rowIndex].hasOwnProperty(columnId)
    //     ? variables[rowIndex][columnId] : ''
    // } else if (variables.length + features.length > rowIndex) {
    //   let idx = Number(rowIndex - variables.length);
    //   result = Array.isArray(features) && features[idx].hasOwnProperty(columnId)
    //     ? features[idx][columnId] : ''
    // }
    // return result;

    // Solo uno
    // return Array.isArray(features) && features.length > rowIndex && features[rowIndex].hasOwnProperty(columnId)
    //   ? features[rowIndex][columnId] : '';

    // Usando returns:
    // if (variables.length > rowIndex) {
    //   return Array.isArray(variables) && variables[rowIndex].hasOwnProperty(columnId)
    //     ? variables[rowIndex][columnId] : ''
    // } else if (variables.length + features.length > rowIndex) {
    //   let idx = Number(rowIndex - variables.length);
    //   return Array.isArray(features) && features[idx].hasOwnProperty(columnId)
    //     ? features[idx][columnId] : ''
    // }

    // Usando operador ternario:
    return variables.length > rowIndex
      ? Array.isArray(variables) && variables[rowIndex].hasOwnProperty(columnId)
        ? variables[rowIndex][columnId]
        : ""
      : variables.length + features.length > rowIndex
      ? Array.isArray(features) &&
        features[Number(rowIndex - variables.length)].hasOwnProperty(columnId)
        ? features[Number(rowIndex - variables.length)][columnId]
        : ""
      : "";
  };

  const SelectionContext = createContext();
  const SelectionHeaderCell = () => {
    const [selectedRows, updateSelectedRows] = useContext(SelectionContext);
    const isIndeterminate =
      selectedRows.size > 0 &&
      selectedRows.size < variables.length + features.length;
    return (
      <EuiCheckbox
        id="selection-toggle"
        aria-label="Select all rows"
        indeterminate={isIndeterminate}
        checked={selectedRows.size > 0}
        onChange={(e) => {
          if (isIndeterminate) {
            // clear selection
            updateSelectedRows({ action: "clear" });
          } else {
            if (e.target.checked) {
              // select everything
              updateSelectedRows({ action: "selectAll" });
            } else {
              // clear selection
              updateSelectedRows({ action: "clear" });
            }
          }
        }}
      />
    );
  };

  const SelectionRowCell = ({ rowIndex }) => {
    const [selectedRows, updateSelectedRows] = useContext(SelectionContext);
    const isChecked = selectedRows.has(rowIndex);

    return (
      <div>
        <EuiCheckbox
          id={`${rowIndex}`}
          aria-label={"Select row"}
          checked={isChecked}
          onChange={(e) => {
            if (e.target.checked) {
              updateSelectedRows({ action: "add", rowIndex });
            } else {
              updateSelectedRows({ action: "delete", rowIndex });
            }
          }}
        />
      </div>
    );
  };

  const DatagridDeleteSelectedRows = () => {
    const selectedRows = JSON.parse(datagridRowSelection);

    let varCopy = JSON.parse(JSON.stringify(variables));
    let featCopy = JSON.parse(JSON.stringify(features));
    setVariables(varCopy.filter((elem) => selectedRows.findIndex(elem) !== -1));
    setFeatures(featCopy.filter((elem) => selectedRows.findIndex(elem) !== -1));

    // updateSelectedRows({ action: 'clear' });
  };

  const datagridYamlLeadingControlColumns = [
    {
      id: "selection",
      width: 32,
      headerCellRender: SelectionHeaderCell,
      rowCellRender: SelectionRowCell,
    },
  ];

  const [datagridRowSelection, setDatagridRowSelection] = useState([]);
  const rowSelection = useReducer((rowSelection, { action, rowIndex }) => {
    if (action === "add") {
      const nextRowSelection = new Set(rowSelection);
      nextRowSelection.add(rowIndex);
      return nextRowSelection;
    } else if (action === "delete") {
      const nextRowSelection = new Set(rowSelection);
      nextRowSelection.delete(rowIndex);
      return nextRowSelection;
    } else if (action === "clear") {
      return new Set();
    } else if (action === "selectAll") {
      return new Set(variables.concat(features).map((_, index) => index));
    }
    setDatagridRowSelection(JSON.stringify(rowSelection));
    return rowSelection;
  }, new Set());

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSwitchChecked, setIsSwitchChecked] = useState(true);
  const [superSelectvalue, setSuperSelectValue] = useState("pr");
  const [superSelectvalueMatchtype, setSuperSelectValueMatchtype] =
    useState("single");

  const modalFormCreateCounterId = useGeneratedHtmlId({ prefix: "modalForm" });
  const modalFormSwitchId = useGeneratedHtmlId({ prefix: "modalFormSwitch" });

  const onSwitchChange = () =>
    setIsSwitchChecked((isSwitchChecked) => !isSwitchChecked);

  const closeModal = () => {
    setIsModalVisible(false);
    console.log("*** form create counter: ", dataFormCreateCounter);
  };

  /**
   * Updates react state to store a new counter feature.
   */
  const createCounter = () => {
    console.log("*** form create counter: ", dataFormCreateCounter);
    setFeatures([
      ...features,
      {
        ...dataFormCreateCounter,
        type: (
          <EuiToken
            size="m"
            iconType="logstashIf"
            shape="square"
            color="#eff4f9"
          />
        ),
      },
    ]);
    closeModal();
    console.log("*** features: ", features);
    // TODO: toast
  };

  const showModal = () => setIsModalVisible(true);

  const superSelectOptionsVariable = [
    { value: "ts", inputDisplay: "ts" },
    { value: "te", inputDisplay: "te" },
    { value: "td", inputDisplay: "td" },
    { value: "sa", inputDisplay: "sa" },
    { value: "da", inputDisplay: "da" },
    { value: "sp", inputDisplay: "sp" },
    { value: "dp", inputDisplay: "dp" },
    { value: "pr", inputDisplay: "pr" },
    { value: "flg", inputDisplay: "flg" },
  ];

  const optionsMatchtype = [
    { label: "single" },
    { label: "multiple" },
    { label: "range" },
    { label: "default" },
    { label: "regexp" },
  ];

  const [selectedOptions, setSelected] = useState([columnsDataset[0]]);
  const [selectedOptionsMatchtype, setSelectedMatchtype] = useState([
    optionsMatchtype[0],
  ]);

  const formCreateCounter = (
    <EuiForm id={modalFormCreateCounterId} component="form">
      <EuiFormRow label="Variable">
        <EuiComboBox
          placeholder=""
          singleSelection={{ asPlainText: true }}
          options={columnsDataset}
          selectedOptions={selectedOptions}
          onChange={(value) => {
            setDataFormCreateCounter({
              ...dataFormCreateCounter,
              variable: value[0].label,
            });
            setSelected(value);
          }}
        />
      </EuiFormRow>
      <EuiFormRow label="Name">
        <EuiFieldText
          name="cc-name"
          value={dataFormCreateCounter.name}
          onChange={(e) =>
            setDataFormCreateCounter({
              ...dataFormCreateCounter,
              name: e.target.value,
            })
          }
        />
      </EuiFormRow>
      <EuiFormRow label="Matchtype">
        <EuiComboBox
          placeholder=""
          singleSelection={{ asPlainText: true }}
          options={optionsMatchtype}
          selectedOptions={selectedOptionsMatchtype}
          onChange={(value) => {
            setDataFormCreateCounter({
              ...dataFormCreateCounter,
              matchtype: value[0].label,
            });
            setSelectedMatchtype(value);
          }}
        />
      </EuiFormRow>
      <EuiFormRow label="Value">
        <EuiFieldText
          name="cc-value"
          value={dataFormCreateCounter.value}
          onChange={(e) =>
            setDataFormCreateCounter({
              ...dataFormCreateCounter,
              value: e.target.value,
            })
          }
        />
      </EuiFormRow>
    </EuiForm>
  );

  const onSuperSelectChange = (value) => {
    setSuperSelectValue(value);
  };

  const onSuperSelectChangeMatchtype = (value) => {
    setSuperSelectValueMatchtype(value);
  };

  let flyout;

  const htmlCode = jsyaml.dump({
    Hello: "world",
    Object: "to yaml",
    test: null,
  });
  const [templateYaml, setTemplateYaml] = useState("");
  console.log("parsed yaml example", templateYaml);

  const openFreeEdit = () => {
    const cleanVars = variables.map((elem) => {
      return { ...elem, type: undefined };
    });
    const cleanFeatures = features.map((elem) => {
      return { ...elem, type: undefined };
    });
    // const test1 = jsyaml.dump({'VARIABLES': cleanVars})
    const yamlGenerated = jsyaml.dump({
      ...generalConfig,
      VARIABLES: cleanVars,
      FEATURES: cleanFeatures,
    });
    setTemplateYaml(yamlGenerated);
    setIsFlyoutVisible(true);
  };

  const handleCodeEditorChange = React.useCallback((value) => {
    console.log(value);
    try {
    } catch (e) {
      // setError somewhere
      console.error(e);
    }
  }, []);

  const [isFlyoutVisible, setIsFlyoutVisible] = useState(false);
  const simpleFlyoutTitleId = useGeneratedHtmlId({
    prefix: "simpleFlyoutTitle",
  });
  if (isFlyoutVisible) {
    flyout = (
      <EuiFlyout
        ownFocus
        onClose={() => setIsFlyoutVisible(false)}
        aria-labelledby={simpleFlyoutTitleId}
      >
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size="m">
            <h2 id={simpleFlyoutTitleId}>Yaml free editor</h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          <div style={{ width: "100vw", height: "100vh" }}>
            <Editor
              height="100%"
              width="100%"
              defaultLanguage="yaml"
              defaultValue={templateYaml}
              onChange={handleCodeEditorChange}
              theme="vs-light"
            />
          </div>
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          <EuiFlexGroup justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                iconType="cross"
                onClick={() => setIsFlyoutVisible(false)}
                flush="left"
              >
                Close
              </EuiButtonEmpty>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton onClick={() => setIsFlyoutVisible(false)} fill>
                Save
              </EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlyoutFooter>
      </EuiFlyout>
    );
  }

  return (
    <>
      <Row className="justify-content-md-center">
        <Col xs={12} className="mb-4 d-none d-sm-block">
          {!isFileUploaded && (
            <EuiFlexGroup justifyContent="spaceAround" gutterSize="xl">
              <EuiFlexItem grow={false}>
                <EuiFilePicker
                  id="file-picker-main"
                  multiple
                  initialPromptText="Select or drag and drop your dataset"
                  onChange={(res) => {
                    uploadFile(res);
                  }}
                  display="large"
                  aria-label="Use aria labels when no actual label is in use"
                  isLoading={loadingFileUpload}
                />
              </EuiFlexItem>
            </EuiFlexGroup>
          )}

          {/* <Theming/> */}
          {/* <div css={css` min-height: 300px; min-width: 400px; `}>
              <p>pre-chart</p>
          <Chart>
            <Settings
              xDomain={{
                min: NaN,
                max: 100,
              }}
              baseTheme={EUI_CHARTS_THEME_LIGHT.theme}
            />
            <Axis id="bottom" position={Position.Bottom} title="Bottom axis" showOverlappingTicks />
            <Axis id="left2" title="Left axis" position={Position.Left} tickFormat={(d) => Number(d).toFixed(2)} />

            <BarSeries
              id="bars"
              xScaleType={ScaleType.Linear}
              yScaleType={ScaleType.Linear}
              xAccessor="x"
              yAccessors={['y']}
              data={[
                { x: 0, y: 2 },
                { x: 10, y: 7 },
                { x: 11.5, y: 9 },
                { x: 13.5, y: 3 },
                { x: 50, y: 6 },
                { x: 66, y: 13 },
                { x: 90, y: 4 },
              ]}
            />
          </Chart>
              <p>post-chart</p>
          </div> */}

          {isFileUploaded && (
            // <EuiFlexGroup>
            //   <EuiFlexItem grow={false} gutterSize="xl">
            //     {/*  css={css` min-width: 240px`} */}
            //     <EuiPanel>
            //       <p><strong>Records:</strong> <span>{analysisResults.table.n}</span></p>
            //       <p><strong>Variables:</strong> <span>{analysisResults.table.n_var}</span></p>
            //       <p><strong>File size:</strong> <span>{analysisResults.table.memory_size}</span></p>
            //     </EuiPanel>
            //   </EuiFlexItem>
            //   <EuiFlexItem grow={false}>
            //     <EuiPanel>
            //     </EuiPanel>
            //   </EuiFlexItem>
            //   <EuiSpacer/>
            // </EuiFlexGroup>
            <Row>
              <div className="col-9">
                <EuiCard textAlign="left" title="File Preview" titleSize="xs">
                  <EuiTabs>
                    <EuiTab
                      key="1"
                      onClick={() => console.log("tab click")}
                      isSelected={true}
                    >
                      {" "}
                      Raw{" "}
                    </EuiTab>
                    {/* <EuiTab
                    key="2"
                    onClick={() => console.log('tab click')}
                  > Table preview </EuiTab> */}
                  </EuiTabs>
                  <EuiCodeBlock
                    language="json"
                    fontSize="m"
                    paddingSize="m"
                    lineNumbers
                    whiteSpace="pre"
                    overflowHeight={300}
                  >
                    {fileHead}
                  </EuiCodeBlock>
                </EuiCard>
                <EuiSpacer />
              </div>
              <div className="col-3">
                <EuiCard textAlign="left" title="Summary" titleSize="xs">
                  <p>
                    <strong>Records:</strong>{" "}
                    <span>{analysisResults.table.n}</span>
                  </p>
                  <p>
                    <strong>Variables:</strong>{" "}
                    <span>{analysisResults.table.n_var}</span>
                  </p>
                  <p>
                    <strong>File size:</strong>{" "}
                    <span>
                      {Math.round(
                        analysisResults.table.memory_size / 1024 / 1024
                      )}{" "}
                      MB
                    </span>
                  </p>
                </EuiCard>
              </div>
            </Row>
          )}
          {isFileUploaded && (
            <EuiFlexGroup
              gutterSize="l"
              css={css`
                margin-bottom: 24px;
              `}
            >
              <EuiFlexItem>
                <EuiCard
                  textAlign="left"
                  title="Variable analysis"
                  icon={<EuiIcon size="m" type={"visualizeApp"} />}
                  description={
                    <span>
                      Select variables for parsing and as candidates for feature
                      generation.
                    </span>
                  }
                >
                  <EuiFlexGroup
                    justifyContent="flexEnd"
                    alignItems="flexEnd"
                    gutterSize="s"
                  >
                    <EuiFlexItem grow={false} style={{ width: "180px" }}>
                      <EuiButton
                        onClick={() => {
                          onClickSaveSelected();
                        }}
                      >
                        Save selected features
                      </EuiButton>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiSpacer />
                  <EuiBasicTable
                    tableCaption=""
                    items={pageOfItems}
                    itemId="id"
                    itemIdToExpandedRowMap={itemIdToExpandedRowMap}
                    isExpandable={true}
                    hasActions={true}
                    rowHeader="columnName"
                    columns={columns}
                    pagination={paginationEda}
                    rowProps={getRowProps}
                    cellProps={getCellProps}
                    isSelectable={true}
                    selection={selection}
                    onChange={onTableChangeEda}
                  />
                </EuiCard>
              </EuiFlexItem>
              <EuiSpacer />
            </EuiFlexGroup>
          )}
        </Col>
        {/* 
          <EuiFlexItem grow={false}>
            <EuiPanel>
              <strong>EuiPanel</strong>
            </EuiPanel>
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiCodeBlock language="json" fontSize="m" paddingSize="m" lineNumbers>
              Test iris.
            </EuiCodeBlock>
          </EuiFlexItem>*/}
      </Row>

      {/* <Row>
          { isFileUploaded &&
          <EuiDataGrid
            columns={columnsDatag}
            columnVisibility={{ visibleColumns, setVisibleColumns }}
            rowCount={10}
            renderCellValue={RenderCellValue}
          />
          }
        <EuiSpacer />
        </Row> */}
      <Row>
        {isFileUploaded && (
          <EuiFlexGroup gutterSize="l">
            <EuiFlexItem>
              <EuiCard
                textAlign="left"
                title="Feature Generator"
                icon={<EuiIcon size="m" type={"lensApp"} />}
                description={
                  <span>
                    For more information about the config. parameters, check
                    user manual.
                  </span>
                }
              >
                <EuiFlexGroup alignItems="flexEnd" gutterSize="s">
                  <EuiFlexItem grow={false} style={{ width: "180px" }}>
                    <EuiFormRow label="Tag">
                      <EuiFieldText
                        value={generalConfig.tag}
                        onChange={(e) => {
                          var copy = generalConfig;
                          copy.tag = e.target.value;
                          setGeneralConfig(JSON.parse(JSON.stringify(copy)));
                        }}
                        compressed
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false} style={{ width: "180px" }}>
                    <EuiFormRow label="Structured">
                      <EuiFieldText
                        value={generalConfig.structured}
                        disabled
                        compressed
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false} style={{ width: "180px" }}>
                    <EuiFormRow label="Timestamp format">
                      <EuiFieldText
                        value={generalConfig.timestamp_format}
                        onChange={(e) => {
                          var copy = generalConfig;
                          copy.timestamp_format = e.target.value;
                          setGeneralConfig(copy);
                        }}
                        compressed
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false} style={{ width: "180px" }}>
                    <EuiFormRow label="Timearg">
                      <EuiFieldText
                        value={generalConfig.timearg}
                        onChange={(e) => {
                          var copy = generalConfig;
                          copy.timearg = e.target.value;
                          setGeneralConfig(copy);
                        }}
                        compressed
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer />

                <SelectionContext.Provider value={rowSelection}>
                  <EuiDataGrid
                    columns={columnsYaml}
                    columnVisibility={{
                      visibleColumns: visibleColumnsYaml,
                      setVisibleColumns: setVisibleColumnsYaml,
                    }}
                    rowCount={variables.length + features.length}
                    renderCellValue={RenderCellValueYaml}
                    leadingControlColumns={datagridYamlLeadingControlColumns}
                    pagination={{
                      ...pagination,
                      pageSizeOptions: [5, 10, 15, 25, 50],
                      onChangeItemsPerPage: setPageSize,
                      onChangePage: setPageIndex,
                    }}
                  />
                  <GridActions
                    setVariables={setVariables}
                    setFeatures={setFeatures}
                    showModal={showModal}
                    openFreeEdit={openFreeEdit}
                    uploadYamlTemplate={uploadYamlTemplate}
                    loadingYamlUpload={loadingYamlUpload}
                    datagridRowSelection={datagridRowSelection}
                    features={features}
                    variables={variables}
                  />
                </SelectionContext.Provider>
              </EuiCard>
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </Row>
      <EuiSpacer />
      <Row>
        {isFileUploaded && (
          <EuiFlexGroup gutterSize="l">
            <EuiFlexItem>
              <EuiCard
                textAlign="left"
                title="Launch FC Parser"
                icon={<EuiIcon size="m" type={"savedObjectsApp"} />}
                description={
                  <span>Launch the parser to get the derived data set.</span>
                }
              >
                <EuiFlexGroup
                  justifyContent="flexEnd"
                  alignItems="flexEnd"
                  gutterSize="s"
                >
                  <EuiFlexItem grow={false} style={{ width: "180px" }}>
                    <EuiButton
                      iconType="download"
                      onClick={() => {
                        downloadResults();
                      }}
                    >
                      Download results
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false} style={{ width: "180px" }}>
                    <EuiButton
                      iconType="playFilled"
                      disabled={isParserRunning}
                      isLoading={isParserRunning}
                      onClick={() => {
                        runParser();
                      }}
                    >
                      Launch {isParserRunning ? "(running)" : ""}
                    </EuiButton>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer />
                {isParserRunning && <EuiProgress size="xd" color="primary" />}
                <EuiCodeBlock language="sql" overflowHeight={400}>
                  {parserExecutionLog}
                </EuiCodeBlock>
              </EuiCard>
            </EuiFlexItem>
          </EuiFlexGroup>
        )}
      </Row>
      {isModalVisible && (
        <EuiModal onClose={closeModal} initialFocus="[name=popswitch]">
          <EuiModalHeader>
            <EuiModalHeaderTitle>
              <h3>Create counter</h3>
            </EuiModalHeaderTitle>
          </EuiModalHeader>

          <EuiModalBody>{formCreateCounter}</EuiModalBody>

          <EuiModalFooter>
            <EuiButtonEmpty onClick={closeModal}>Cancel</EuiButtonEmpty>

            <EuiButton
              type="submit"
              form={modalFormCreateCounterId}
              onClick={createCounter}
              fill
            >
              Save
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      )}
      {flyout}
    </>
  );
};
