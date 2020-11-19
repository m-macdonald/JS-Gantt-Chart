class Gantt {
    constructor(staticID, params) {
        this.staticID = staticID;
        this.sidebarHeader = params.sidebarHeader || 'Unused parameter right now';
        this.noDataFoundMessage = params.noDataFoundMessage || 'No data found.';
        this.startTimeAlias = params.startTimeAlias || 'startTime';
        this.endTimeAlias = params.endTimeAlias || 'endTime';
        this.idAlias = params.idAlias || 'id';
        this.rowAlias = params.rowAlias || 'rowTitle';
        this.linkAlias = params.linkAlias;
        this.tooltipAlias = params.tooltipAlias || 'tooltip';
        this.groupBy = params.groupBy ? params.groupBy.split(',').map(group => group.trim()) : [];
        this.groupByAlias = this.groupBy ? (params.groupByAlias ? params.groupByAlias.split(',').map(group => group.trim()) : this.groupBy) : [];
        this.data = {};
        this.rawData = [];
        this.divisionCount = 0;
        this.maxTime;
        this.minTime;
        this.refreshFunction = params.refreshFunction;

        this.wrapper = document.createElement('div');
        this.wrapper.classList.add('gfb-gantt-wrapper');
        document.getElementById(this.staticID).appendChild(this.wrapper);
        this.refreshData();
    }

    refreshData() {
        this.rawData = this.refreshFunction();
        this.empty();
        if(this.rawData.length < 1){
            this.noDataFound();
            return;
        }
        this.processData();
        this.render();
    }

    processData() {
        //Have to reset the divisionCount here. Otherwise it keeps incrementing on the divisionCount of the previous data set.
        this.divisionCount = 0;

        //Sorts the data by the start time ascending before anything else is done
        //This ensures that the data is rendered in the proper location when we generate the chart.
        let sortedData = this.rawData.sort((a, b) => new Date(a[this.startTimeAlias]) - new Date(b[this.startTimeAlias])),
            groupedData = {};
        for (let dataRow of sortedData) {
            this.groupArray(groupedData, dataRow);
            //console.log(groupedData);
        }

        this.data = groupedData;

        //Get the max and min datetimes in the dataset
        //Used to determine the first and last times that are shown in the chart
        let maxTime = this.rawData.reduce((max, curr) => !!curr[this.endTimeAlias] ? max > new Date(curr[this.endTimeAlias]) ? max : new Date(curr[this.endTimeAlias]) : max, new Date(0));
        let minTime = this.rawData.reduce((min, curr) => !!curr[this.startTimeAlias] ? min > new Date(curr[this.startTimeAlias]) ? new Date(curr[this.startTimeAlias]) : min : min, new Date(maxTime.getTime()));
        this.maxTime = roundHourUp(maxTime);
        this.minTime = roundHourDown(minTime);

        if(this.minTime === this.maxTime)
            return;
            
        //Determines the number of columns(times) that will be shown in the chart.
        //Mostly used for iteration later in the render process
        for (let i = new Date(this.minTime.getTime()); i <= this.maxTime; i.setTime(i.getTime() + (60 * 60 * 1000))) {
            this.divisionCount++;
        }

    }
    //Takes advantage of the fact that javascript is kind of pass-by-reference for object data types
    //So every change to result here is actually a change to our groupedData variable
    groupArray(result, entry, iter = 0) {
        let nextResult;
        if (iter === this.groupBy.length + 1) {
            result.push(entry);
            return;
        }


        let groupingProperty = result[entry[this.groupBy[iter]]];
        let chartEntry = result[entry[this.idAlias]];

        //If we can't find a property within result for the groupBy parameter at this level we create a new one.
        if (!result[entry[this.groupBy[iter]]] && iter < this.groupBy.length) {
            result[entry[this.groupBy[iter]]] = {groupName: entry[this.groupByAlias[iter]]};
            nextResult = result[entry[this.groupBy[iter]]];
        }
        else if (!result[entry[this.idAlias]] && iter === this.groupBy.length) {
            result[entry[this.idAlias]] = [];
            nextResult = result[entry[this.idAlias]];
        }
        else if (result[entry[this.groupBy[iter]]]) {
            nextResult = result[entry[this.groupBy[iter]]];
        }
        else if (result[entry[this.idAlias]]) {
            nextResult = result[entry[this.idAlias]];
        }
        iter++;
        this.groupArray(nextResult, entry, iter);
    }

    //Creates the header for the Gantt chart
    buildHeader() {
        let headerDivs = `<div class="gfb-gantt-header-spacer"></div>`;
        if(this.divisionCount > 1){
            for (let i = 0; i < this.divisionCount; i++) {
                let date = new Date(this.minTime.getTime() + ((60 * 60 * 1000) * i)),
                    hour = date.getHours() > 12 ? date.getHours() - 12 : date.getHours(),
                    amPm = date.getHours() > 12 ? 'PM' : 'AM',
                    minutes = date.getMinutes().toString().length === 1 ? '0' + date.getMinutes() : date.getMinutes();
                headerDivs += `<div class="gfb-gantt-header">${hour}:${minutes} ${amPm}</div>`;
            }
        }
        return `<div class="gfb-gantt-headers" style="grid-template-columns: 100px repeat(${this.divisionCount}, 1fr)">${headerDivs}</div>`;
    }

    buildLines() {
        let lines = '<div class="gfb-gantt-sidebar-template"></div>';
        for (let i = 0; i < this.divisionCount; i++) {
            lines += `<div class="gfb-gantt-line"></div>`;
        }
        return `<div class="gfb-gantt-lines-container" style="grid-template-columns: 100px repeat(${this.divisionCount}, 1fr)">${lines}</div>`;
    }

    buildRow(rowArr, dataIndex) {
        let totalTime = this.maxTime - this.minTime,
            compositeRows = `<div style="grid-column: 2/${this.divisionCount + 1};grid-row:1;display:flex;align-items:center"><div class="gfb-gantt-sub-row-wrapper">`;
        for (let i = 0; i < rowArr.length; i++) {
            //Check to see if the current entry has a start and end time. If not we break
            if (!rowArr[i][this.startTimeAlias] || !rowArr[i][this.startTimeAlias])
                break;
            let currElStart = new Date(rowArr[i][this.startTimeAlias]),
                currElEnd = new Date(rowArr[i][this.endTimeAlias]),
                currElRunPercent = ((currElEnd - currElStart) / totalTime) * 100;
            if (i === 0 || (rowArr[i - 1] && new Date(rowArr[i - 1][this.endTimeAlias]) !== currElStart)) {
                let baseTime = (i === 0 ? this.minTime : new Date(rowArr[i - 1][this.endTimeAlias])),
                    difference = ((currElStart - baseTime) / totalTime) * 100;
                compositeRows += `<div style="width:${difference}%;"></div>`;
            }
            //If we don't have a linkAlias we assume the entries are not meant to link anywhere, so we just render them as divs instead.
            if (this.linkAlias)
                compositeRows += `<a class="gfb-gantt-row-entry" style="width:${currElRunPercent}%;" href="${rowArr[i][this.linkAlias]}" data-index="${dataIndex.join('-')}-${i}"></a>`;
            else
                compositeRows += `<div class="gfb-gantt-row-entry" style="width:${currElRunPercent}%;" data-index="${dataIndex.join('-')}-${i}"></div>`;
        }
        return compositeRows + '</div></div>';
    }

    buildContent() {
        let body = ['<div class="gfb-gantt-row-container">'],
            header = this.buildHeader(),
            this1 = this;

        buildContent(this.data, body);
        body.push('</div>');

        return `<div class="gfb-gantt-content">${header}${body.join('')}</div>`;

        function buildContent(data, result, depth = 0, dataIndex = []) {
            for (let prop in data) {
                if (data[prop]) {
                    if(prop !== 'groupName')
                        dataIndex.push(prop);
                    
                    if (typeof data[prop] === "object" && !Array.isArray(data[prop])) {
                        result.push(`<div class="gfb-gantt-grouping-header" style="padding-left: ${5 + (depth * 20)}px">${data[prop].groupName}</div><div>`);
                        depth += 1;
                        buildContent(data[prop], result, depth, dataIndex);
                        depth -= 1;
                    }
                    else if (Array.isArray(data[prop])) {
                        result.push(`<div class="gfb-gantt-row" style="grid-template-columns: 100px repeat(${this1.divisionCount}, 1fr)"><div class="gfb-gantt-sidebar-header">${data[prop][0][this1.rowAlias]}</div>${this1.buildRow(data[prop], dataIndex)}</div>`);
                    }
                    dataIndex.pop();
                }
            }
            result.push('</div>');
        }

    }

    buildChart() {
        let content = this.buildContent();
        let lines = this.buildLines();
        return `${lines}${content}`;
    }

    bindHover() {
        let bindElements = document.querySelectorAll(`#${this.staticID} .gfb-gantt-row-entry`);

        bindElements.forEach(bindElement => {
            let toolTipElement,
                timeout;
            bindElement.addEventListener('mouseover', e => {
                let target = e.target,
                    indexArray = target.getAttribute('data-index').split('-'),
                    position = getElOffset(target),
                    targetHeight = getBoundingRect(target).height,
                    this1 = this;
                indexArray.push(this.tooltipAlias);
                position.top += (targetHeight + 5);
                target.classList.add('hovering');
                //Set a delay on the tooltip appearing so that it doesn't immediately appear if the user happens to swipe their mouse across the screen.
                //At the end of the delay we check to see if the mouse is still hovering, at which point we will show the tooltip
                timeout = setTimeout(() => {
                    if (!target.classList.contains('hovering'))
                        return;
                    toolTipElement = document.createElement(`div`);
                    toolTipElement.classList.add('gfb-gantt-row-entry-tooltip');
                    toolTipElement.innerHTML = getToolTipData();
                    toolTipElement.style.top = `${position.top}px`;
                    toolTipElement.style.left = `${position.left}px`;
                    document.body.appendChild(toolTipElement);
                    fadeIn(toolTipElement, 300);
                }, 300);

                function getToolTipData() {
                    let dataArray = this1.data;
                    for (let i = 0; i < indexArray.length; i++) {
                        if (i === indexArray.length - 1)
                            return dataArray[indexArray[i]]
                        else
                            dataArray = dataArray[indexArray[i]];
                    }
                }
            })

            bindElement.addEventListener('mouseout', e => {
                let target = e.target;

                clearTimeout(timeout);
                target.classList.remove('hovering');
                if (toolTipElement)
                    fadeOut(toolTipElement, 300, () => toolTipElement.remove());
            })
        });
    }

    bindCollapse(){
        let bindElements = document.querySelectorAll(`#${this.staticID} .gfb-gantt-grouping-header`);

        bindElements.forEach(bindElement => {
            bindElement.addEventListener('click', e => {
                let group = e.target.nextSibling,
                    duration = 300;
                if(!group.classList.contains('gfb-gantt-group--collapsed')){
                    slideUp(group, duration);
                    group.classList.add('gfb-gantt-group--collapsed');
                }
                else{
                    slideDown(group, duration);
                    group.classList.remove('gfb-gantt-group--collapsed');
                }
            })
        })
    }

    render() {
        this.wrapper.innerHTML = this.buildChart();

        this.bindCollapse();

        if (this.tooltipAlias)
            this.bindHover();
    }

    noDataFound() {
        this.wrapper.innerHTML = this.noDataFoundMessage;
    }

    empty() {
        this.wrapper.innerHTML = '';
    }

}

function roundHourUp(date) {
    let m = 60 * 60 * 1000
    return new Date(Math.ceil(date.getTime() / m) * m);
}
function roundHourDown(date) {
    let m = 60 * 60 * 1000;
    return new Date(Math.floor(date.getTime() / m) * m);
}

function fadeIn(element, ms, callback = null) {
    let duration = ms,
        interval = 50,
        gap = interval / duration,
        opacity = 0;

    element.style.display = 'block';
    element.style.opacity = opacity;

    let fading = window.setInterval(fade, interval);

    function fade() {
        opacity = opacity + gap;
        element.style.opacity = opacity;

        if (opacity <= 0)
            element.style.display = 'none';
        if (opacity >= 1) {
            window.clearInterval(fading);
            if (callback)
                callback();
        }
    }
}
function fadeOut(element, ms, callback = null) {
    let duration = ms,
        interval = 50,
        gap = interval / duration,
        opacity = 1;

    let fading = window.setInterval(fade, interval);

    function fade() {
        opacity = opacity - gap;
        element.style.opacity = opacity;

        if (opacity <= 0)
            element.style.display = 'none';
        if (opacity <= 0) {
            window.clearInterval(fading);
            if (callback)
                callback();
        }
    }
}

function getElOffset(element) {
    let boundingRect = getBoundingRect(element);
    return { top: boundingRect.top + window.scrollY, left: boundingRect.left + window.scrollX };
}
function getBoundingRect(element) {
    return element.getBoundingClientRect();
}

function slideUp(element, ms){

    setProperty(element, 'height', `${element.offsetHeight}px`);
    setProperty(element, 'transition-property', 'height, margin, padding');
    setProperty(element, 'transition-duration', `${ms}ms`);
    setProperty(element, 'box-sizing', 'border-box');

    zeroMultiProperty(element, ['margin-bottom', 'margin-top', 'padding-top', 'padding-bottom']);
    setProperty(element, 'overflow', 'hidden');

    //Need a timeout otherwise the slide up animation is not performed
    setTimeout(() => setProperty(element, 'height'), 0);

    setTimeout(() => {
        setProperty(element, 'display', 'none');
        removeMultiProperty(element, ['height', 'padding-top', 'padding-bottom', 'margin-top', 'margin-bottom', 'overflow', 'transition-duration', 'transition-property']) 
    }, ms);
}
function slideDown(element, ms){

    element.style.display = 'block';

    let height = element.offsetHeight;
    
    setProperty(element, 'height');
    setProperty(element, 'transition-property', 'height, margin, padding');
    setProperty(element, 'transition-duration', `${ms}ms`);
    setProperty(element, 'box-sizing', 'border-box');
    setProperty(element, 'overflow', 'hidden');

    //Need a timeout otherwise the slide up animation is not performed
    setTimeout(() => setProperty(element, 'height', `${height}px`), 0);

    setTimeout(() => {
        removeMultiProperty(element, ['height', 'overflow', 'transition-duration', 'transition-property']);
    }, ms);
}

//Sets the inline property of the given element to the value provided.
//If not provided, the value is set to 0
function setProperty(element, property, value = 0) {
    element.style.setProperty(property, value);
}

//Iteratively calls setProperty
function zeroMultiProperty(element, properties) {
    for (property of properties) {
        setProperty(element, property);
    }
}

//Iteratively calls removeProperty
function removeMultiProperty(element, properties){
    for(property of properties)
        removeProperty(element, property);
}
//Removes the given property from the given element's inline styling
function removeProperty(element, property){
    element.style.removeProperty(property);
};