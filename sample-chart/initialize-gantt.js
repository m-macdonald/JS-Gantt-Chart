let data =  [
        {
            recordID: 1,
            row: "Row for ID #1",
            tooltip: "Tooltips here! Get your tooltips!",
            start: "Wed Jun 03 2020 14:21:55",
            end: "Wed Jun 03 2020 20:21:55"
        },
        {
            recordID: 2,
            row: "Row for ID #2",
            tooltip: "Tooltip for row 2",
            start: "Jun 03 2020 11:00:00",
            end: "Jun 03 2020 15:23:43"
        },
        {
            recordID: 1,
            row: "Row for ID #1",
            tooltip: "Tooltip unique to this item",
            start: "Wed Jun 03 2020 06:00:00",
            end: "Wed Jun 03 2020 10:00:00"
        }
    ];



function refreshFunction() {
    return data;
}

let params = {
    sidebarHeader: "unused right now",
    noDataFoundMessage: "No data found",
    startTimeAlias: "start",
    endTimeAlias: "end",
    idAlias: "recordID",
    rowAlias: "row",
    linkAlias: null,
    tooltipAlias: "tooltip",
    groupBy: null,
    refreshFunction: refreshFunction
}

let ganttChart = new Gantt("chart", params);