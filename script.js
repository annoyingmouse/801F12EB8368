const sqlPromise = initSqlJs({
  locateFile: file => `./${file}`
});
const dataPromise = fetch("801F12EB8368-ELANCITY_RADAR__.db").then(res => res.arrayBuffer())
const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
const db = new SQL.Database(new Uint8Array(buf));
const chartData = []

$(document).ready(function(){
  const primaryTable = $('#campaign').DataTable({
    columns: [
      {
        title: 'Started',
        render: (data, type, row, meta) => {
          return moment(data).format('DD/MM/YYYY')
        },
        data: 'camp_date_begin'
      },
      {
        title: 'Ended',
        render: (data, type, row, meta) => {
          return moment(data).format('DD/MM/YYYY')
        },
        data: 'camp_date_end'
      },
      {
        title: 'Location',
        data: 'camp_title'
      },
      {
        title: 'Action',
        orderable: false,
        render: (data, type, row, meta) => {
          return `
            <div class="btn-group"
                 role="group" aria-label="Choose a direction">
              <button class="btn btn-primary"
                      type="button"
                      data-start="${moment(row.camp_date_begin).unix() - 1}"
                      data-end="${moment(row.camp_date_end).unix() + 1}"
                      data-campaign="${row.camp_title}"
                      data-direction="1">
                Facing
              </button>
              <button class="btn btn-primary"
                      type="button"
                      data-start="${moment(row.camp_date_begin).unix() - 1}"
                      data-end="${moment(row.camp_date_end).unix() + 1}"
                      data-campaign="${row.camp_title}"
                      data-direction="0">
                Away
              </button>
            </div>
          `
        }
      }
    ]
  });
  const detail = $('#detail').DataTable({
    columns: [
      {
        title: 'Date',
        render: (data, type, row, meta) => {
          return moment.unix(data).format('DD/MM/YYYY HH:mm:ss')
        },
        data: 'meas_date'
      },
      {
        title: 'Speed (mph)',
        data: 'meas_speed'
      }
    ]
  });
  $('#campaign tbody').on('click', 'button', function(e){
    const chartHolder = document.getElementById('chart_holder')
    const start = Number(e.target.dataset.start)
    const end = Number(e.target.dataset.end)
    const direction = Number(e.target.dataset.direction)
    const campaign = e.target.dataset.campaign
    $('#direction').text(`${campaign} (${direction ? "Facing" : "Away"})`)
    const stmt = db.prepare("SELECT * FROM measure WHERE meas_date>:start AND meas_date<:end AND meas_direction=:direction");
    stmt.getAsObject({
      ':start' : start,
      ':end' : end,
      ':direction' : direction
    });
    detail.clear()
    chartData.length = 0

    while(stmt.step()) {
      detail.row.add(stmt.getAsObject())
      chartData.push(stmt.getAsObject())
    }
    detail.draw()
    drawChart(chartHolder, chartData)


  });
  const drawChart = (target, data) => {
    const margin = {
        top: 40,
        right: 150,
        bottom: 60,
        left: 30
      },
      width = 1170 - margin.left - margin.right,
      height = 600 - margin.top - margin.bottom;
    target.innerHTML = ''
    const div = document.createElement('div')
    div.setAttribute('id', 'chart')
    target.appendChild(div)
    const svg = d3.select("#chart")
      .append("div")
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const legend_x = 'meas_date'
    const legend_y = 'meas_speed'
    data.forEach(d => {d.meas_date = new Date(d.meas_date * 1000)})


    const min_x = d3.min(data, d => d[legend_x])
    const max_x = d3.max(data, d => d[legend_x])
    const min_y = d3.min(data, d => d[legend_y])
    const max_y = d3.max(data, d => d[legend_y])

    const x = d3.scaleTime()
      .domain([min_x, max_x])
      .range([ 0, width ])


    svg.append('g')
      .classed('x axis', true)
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%d-%m-%Y")).ticks(Math.floor(( Date.parse(max_x) - Date.parse(min_x) ) / 86400000)))
    ;

    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height+50 )
      .text(legend_x)

    const y = d3.scaleLinear()
      .domain([min_y, max_y])
      .range([ height, 0]);
    svg.append("g")
      .call(d3.axisLeft(y));

    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", 0)
      .attr("y", -20 )
      .text(legend_y)
      .attr("text-anchor", "start")

    const tooltip = d3.select("#chart")
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "black")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("color", "white")
      .style("position", "absolute")

    const showTooltip = (event, d) => {
      tooltip
        .transition()
        .duration(200)
      tooltip
        .style("opacity", 1)
        .html(`Date/time: ${d[legend_x].toLocaleString()}. Speed: ${d[legend_y]}`)
        .style("left", (event.x)/2 + "px")
        .style("top", (event.y)/2-50 + "px")
    }
    const moveTooltip = (event, d) => {
      tooltip
        .style("left", (event.x)/2 + "px")
        .style("top", (event.y)/2-50 + "px")
    }
    const hideTooltip = (event, d) => {
      tooltip
        .transition()
        .duration(200)
        .style("opacity", 0)
    }

    svg.append('g')
      .selectAll("dot")
      .data(data)
      .join("circle")
      .attr("class", 'bubble')
      .attr("cx", d => x(d[legend_x]))
      .attr("cy", d => y(Number(d[legend_y])))
      .attr("r", 2)
      .style("fill", d => d[legend_y] > 30 ? `#F00` : `#0F0`)
      .on("mouseover", showTooltip )
      .on("mousemove", moveTooltip )
      .on("mouseleave", hideTooltip )
  }

  const stmt = db.prepare("SELECT * FROM campaign");
  stmt.getAsObject();
  stmt.bind();
  while(stmt.step()) {
    primaryTable.row.add(stmt.getAsObject())
  }
  primaryTable.draw()
});



