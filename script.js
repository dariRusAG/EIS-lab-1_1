const data = parsedData;
displayData(data);

fillNationalityFilter("nationalitySelect", "Nationality");
fillSortOptions();

let svg = d3.select("#graph_svg")
    .attr("width", 0)
    .attr("height", 0);

const sortForm = document.getElementById('sortForm')
sortForm.addEventListener('submit', sortData)

// Function to display data
function displayData(data) {

    // Select the container element
    let container = d3.select("#data_display");

    // Create a table element
    let table = container.append("table");

    // Create table header
    let thead = table.append("thead").append("tr");
    thead.selectAll("th")
        .data(Object.keys(data[0]))
        // .data(composers_column)
        .enter()
        .append("th")
        .text(function (d) {
            return d;
        });

    // Create table body and rows
    let tbody = table.append("tbody");
    let rows = tbody.selectAll("tr")
        .data(data)
        .enter()
        .append("tr");

    // Create cells with data
    rows.each(function (d) {
        let row = d3.select(this);
        Object.values(d).forEach(function (value) {
            row.append("td").text(value);
        });
    });
}

function clearTable() {
    window.location.reload();
}

// Function to filter data
function filterData() {

    const nationality = document.getElementById("nationalitySelect").value;
    const minYear = parseInt(document.getElementById("minYearInput").value);
    const maxYear = parseInt(document.getElementById("maxYearInput").value);
    const searchTerm = document.getElementById("composers").value.toLowerCase();

    // var filteredData = data.filter(function(d) {
    //     // Проверяем, содержит ли наименование композитора введенный поисковый запрос
    //     return d.Composer.toLowerCase().includes(searchTerm);
    // });


    const filteredData = data.filter(function (d) {
        return (nationality === "" || d.Nationality === nationality) &&
            (isNaN(minYear) || d.Born >= minYear) &&
            (isNaN(maxYear) || d.Died <= maxYear) &&
            (d.Composer.toLowerCase().includes(searchTerm));
    });

    displayFilteredData(filteredData);
}

// Function to display filtered data
function displayFilteredData(filteredData) {

    const container = d3.select("#data_display");
    container.html(""); // Clear previous content

    const table = container.append("table");

    const thead = table.append("thead").append("tr");
    thead.selectAll("th")
        .data(Object.keys(filteredData[0]))
        .enter()
        .append("th")
        .text(function (d) {
            return d;
        });

    const tbody = table.append("tbody");
    const rows = tbody.selectAll("tr")
        .data(filteredData)
        .enter()
        .append("tr");

    rows.each(function (d) {
        let row = d3.select(this);
        Object.values(d).forEach(function (value) {
            row.append("td").text(value);
        });
    });
}

function fillNationalityFilter(filterId, key) {
    const groupObj = d3.group(data, d => d[key]);
    const options = [""].concat([...groupObj.keys()]);

    d3.select(`#${filterId}`)
        .selectAll('option')
        .data(options)
        .enter()
        .append('option')
        .text(d => d);
}

function fillSortOptions() {
    const keys = [""].concat(Object.keys(data[0]));
    d3.selectAll('.sortSelect')
        .selectAll('option')
        .data(keys)
        .enter()
        .append('option')
        .text(d => d);
}

function sortData(event) {
    event.preventDefault();
    const formData = Array.from(serializeForm(this).entries());
    let sortKeys = [];
    let i = 0;

    while (i < formData.length) {
        let isAscending = false;

        if (i + 1 !== formData.length && formData[i + 1][1] === 'on') {
            isAscending = true;
            i++;
        }

        sortKeys.push([formData[i][1], isAscending]);
        i++;
    }

    sortTable(sortKeys);
}

function sortTable(sortKeys) {
    const table = d3.select("#data_display")
        .select('table')
        .select("tbody");
    for (let [sortKey, isDescending] of sortKeys) {
        table.selectAll("tr")
            .sort((a, b) => {
                return isDescending ? dataSort(b[sortKey], a[sortKey]) : dataSort(a[sortKey], b[sortKey]);
            });
    }
}

function dataSort(a, b) {
    if (typeof a == "string") {
        return a.localeCompare(b);
    } else if (typeof a == "number") {
        return a > b ? 1 : a === b ? 0 : -1;
    } else if (typeof a == "boolean") {
        return b ? 1 : a ? -1 : 0;
    }
}

function serializeForm(formNode) {
    return new FormData(formNode)
}

function groupData() {
    const groupKey = "Nationality";
    const groupValue = document.getElementById("groupSelect").value;

    const groupObj = d3.group(data, d => d[groupKey]);
    // console.log(groupObj);
    let groupData = [];

    groupObj.forEach((value, key) => {
        const minMax = d3.extent(value.map(d => d[groupValue]));
        const sum = d3.sum(value.map(d => d[groupValue]));

        const amount = value.length;
        const [min, max] = minMax;
        const mean = sum / value.length;
        groupData.push({[`${groupKey} | ${groupValue}`]: key, amount: amount, min: min, max: max, mean: mean});
    });

    // console.log(arrGraph);
    const container = d3.select("#data_display");
    container.html(""); // Clear previous content
    displayData(groupData);

    drawGraph("graph_svg", data, groupKey, groupValue);
}

function drawGraph(graphId, data, groupKey, groupValue,
                   width = 800, height = 400,
                   marginX = 70, marginY = 70) {
    svg = d3.select(`#${graphId}`);
    svg.attr("width", width)
        .attr("height", height)
        .selectAll('*').remove();

    // создаем массив для построения графика
    const graphData = createArrGraph(data, groupKey, groupValue);
    // console.log(graphData);

    // создаем шкалы преобразования и выводим оси
    const [scaleX, scaleY] = createAxis(graphData, width, height, marginX, marginY);

    // рисуем графики

    firstStep(graphData, createPath(marginX, marginY, scaleX, scaleY, "green", 2));

    createChart(graphData, marginX, marginY, scaleX, scaleY, "blue", 0);
    createChart(graphData, marginX, marginY, scaleX, scaleY, "red", 1);
    createChart(graphData, marginX, marginY, scaleX, scaleY, "green", 2);
}

function createArrGraph(data, groupKey, groupValue) {
    let groupObj = d3.group(data, d => d[groupKey]);
    let arrGraph = [];

    groupObj.forEach((value, key) => {
        const minMax = d3.extent(value.map(d => d[groupValue]));
        const sum = d3.sum(value.map(d => d[groupValue]));
        const values = [minMax[0], minMax[1], sum / value.length]
        arrGraph.push({labelX: key, values: values});
    });

    // console.log(arrGraph);
    return arrGraph;
}

function createAxis(graphData, width, height, marginX, marginY) {

    // в зависимости от выбранных пользователем данных по OY
    // находим интервал значений по оси OY
    let firstRange = d3.extent(graphData.map(d => d.values[0]));
    let secondRange = d3.extent(graphData.map(d => d.values[1]));

    let min = firstRange[0];
    let max = secondRange[1];

    // функция интерполяции значений на оси
    let scaleX = d3.scaleBand()
        .domain(graphData.map(d => d.labelX))
        .range([0, width - 2 * marginX]);
    let scaleY = d3.scaleLinear()
        .domain([min * 0.85, max * 1.1])
        .range([height - 2 * marginY, 0]);

    // создание горизонтальной и вертикальной оси
    let axisX = d3.axisBottom(scaleX);
    let axisY = d3.axisLeft(scaleY);

    // отрисовка осей в SVG-элементе
    svg.append("g")
        .attr("transform", `translate(${marginX}, ${height - marginY})`)
        .call(axisX)
        .selectAll("text") // подписи на оси — наклонные
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");

    svg.append("g")
        .attr("transform", `translate(${marginX}, ${marginY})`)
        .call(axisY);

    return [scaleX, scaleY]
}

function createChart(data, marginX, marginY, scaleX, scaleY, color, index) {

    svg.selectAll(".dot")
        .data(data).enter()
        .append("circle")
        .attr("r", 4)
        .attr("cx", d => scaleX(d.labelX) + scaleX.bandwidth() / 2)
        .attr("cy", d => scaleY(d.values[index]))
        .attr("transform", `translate(${marginX}, ${marginY})`)
        .style("fill", color);
}

// Создаёт линию для вывода точек массива на график и добавляет путь для его отображения
function createPath(marginX, marginY, scaleX, scaleY, color, index) {

    let lineXY = d3.line()
        .x(d => scaleX(d.labelX))
        .y(d => scaleY(d.values[index]));

    svg.append("path") // добавляем путь
        .attr("id", "graph")
        .attr("transform", `translate(${marginX * 1.3}, ${marginY})`)
        .style("stroke-width", "4")
        .style("stroke", color);

    return lineXY;
}

// Выводит динамический график
function firstStep(data, line) {

    const firstPath = svg.select("path#graph")
        .datum(data)
        .attr("d", line);

    const pathLength = firstPath.node().getTotalLength();

    firstPath.attr("stroke-dashoffset", pathLength)
        .attr("stroke-dasharray", pathLength)
        .transition()
        .ease(d3.easeLinear)
        .duration(5000)
        .attr("stroke-dashoffset", 0);
}

