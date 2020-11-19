# JS-Gantt-Chart
A Gantt Chart built using pure JS with CSS Grid and Flexbox

### At the moment the chart works best with items that are all on the same day.

The chart's constructor expects two parameters:

1. The id for the element that will hold the chart. A string
2. An object holding a number of parameters for the chart:
```
noDataFoundMessage:   If the chart refreshes and does not receive any data, this message is displayed. A string or HTML
startTimeAlias:       The name of the property within the objects of the array that holds the event's start time. A string
endTimeAlias:         The name of the property within the objects of the array that holds the event's end time. A string
idAlias:              The name of the property within the objects of the array that holds the id of the record. 
                      Objects with the same id will be placed in the same row. An int
rowAlias:             The name of the property within the objects of the array that holds the header that should be given to this object's row. A string
linkAlias:            The name of the property within the objects of the array that holds the link that should be followed when the object's entry is clicked. 
                      Passing in null will keep the chart from rendering links. A string
tooltipAlias:         The name of the property within the objects of the array that holds the html content that should be displayed when the user hovers over the chart entry. A string
groupBy:              This parameter functions like a SQL group by. Providing it to the chart will result in rows being grouped underneath collapsible headers.
                      The values should be in order of decreasing importance.
                      Each of the values in the string should be a property within the objects being provided to the chart.
                      ex. 'state, county, city'
groupByAlias:         A comma delimited list of the properties in the given data that hold the names of each group. Should have the same number of entries as the groupBy parameter and will only be used if that parameter has also been provided. This is an optional parameter. If left null, the group names will be derived from the groupBy parameter instead.
refreshFunction:      The function that the chart should call when its refreshData() function is invoked. This function should return an array of objects.
```


The [sample-chart](sample-chart) has a barebones example of how the chart could be created.
