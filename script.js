import { PeriodChart } from "./js/PeriodChart.js"
import { DayChart } from "./js/DayChart.js"

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
    drawCharts(chartHolder, chartData)


  });
  const drawCharts = (target, data) => {
    new PeriodChart(target, data);


    const classicTabs = document.querySelector('.classic-tabs')
    classicTabs.style.display = ''
    const ul = document.getElementById('myClassicTab')
    const panel = document.getElementById('myClassicTabContent')
    classicTabs.querySelectorAll('.added').forEach(el => el.remove())

    const days = data.reduce((acc, cur) => {
      const date = cur.meas_date.ddmmyyyy()
      if(acc.hasOwnProperty(date)){
        acc[date].push(cur)
      }else{
        acc[date] = [cur]
      }
      return acc
    }, {})


    for(const day in days){
      const li = document.createElement('template')
      li.innerHTML = `
        <li class="nav-item added">
          <a class="nav-link waves-light"
             id="${day.replace(/\//g, "_")}_tab"
             data-toggle="tab"
             href="#${day.replace(/\//g, "_")}"
             role="tab"
             aria-controls="${day.replace(/\//g, "_")}"
             aria-selected="false">
            ${moment(day, 'DD/MM/YYYY').format('dddd')}
            </br>
            ${day}
          </a>
        </li>
      `
      document.getElementById('myClassicTab').appendChild(li.content.cloneNode(true))
      const div = document.createElement('template')
      div.innerHTML = `
        <div class="tab-pane fade added"
             id="${day.replace(/\//g, "_")}"
             role="tabpanel"
             aria-labelledby="${day.replace(/\//g, "_")}_tab">
            <div id="${day.replace(/\//g, "_")}_chart"></div>
          </div>
      `
      document.getElementById('myClassicTabContent').appendChild(div.content.cloneNode(true))
      new DayChart(
        document.getElementById(`${day.replace(/\//g, "_")}_chart`),
        days[day],
        `chart_${day.replace(/\//g, "_")}`
      )
    }
  }

  const drawDayChart = (target, data, name) => {

    data.forEach(d => {
      d.date = moment.unix(d.meas_date)
    })

    const margin = {
        top: 40,
        right: 150,
        bottom: 60,
        left: 30
    };
    const width = 1170 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;
    target.innerHTML = ''
    const div = document.createElement('div')
    div.setAttribute('id', name)
    target.appendChild(div)
    const svg = d3.select(`#${name}`)
      .append("div")
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`)

    const legend_x = {
      display: "Date",
      data: 'meas_date'
    }
    const legend_y = {
      display: "Speed",
      data: 'meas_speed'
    }

    const min_x = d3.min(data, d => d[legend_x.data])
    const max_x = d3.max(data, d => d[legend_x.data])
    const min_y = d3.min(data, d => d[legend_y.data])
    const max_y = d3.max(data, d => d[legend_y.data])

    let x = d3.scaleTime()
      .domain([min_x, max_x])
      .range([ 0, width ])

    svg.append('g')
      .classed('x axis', true)
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x)
        .tickFormat(d3.timeFormat("%H:%M"))
        .ticks(24)
      )

    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", width)
      .attr("y", height+50 )
      .text(legend_x.display)

    const y = d3.scaleLinear()
      .domain([min_y, max_y])
      .range([ height, 0]);

    svg.append("g").call(d3.axisLeft(y));

    svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", 0)
      .attr("y", -20 )
      .text(legend_y.display)
      .attr("text-anchor", "start")

    const tooltip = d3.select(`#${name}`)
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
        .html(`Time: ${d3.timeFormat("%H:%M")}<br/>Speed: ${d[legend_y.data]}`
        )
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
      .attr("cx", d => x(d[legend_x.data]))
      .attr("cy", d => y(Number(d[legend_y.data])))
      .attr("r", 2)
      .style("fill", d => d[legend_y.data] > 30 ? `#F00` : `#0F0`)
      .on("mouseover", showTooltip )
      .on("mousemove", moveTooltip )
      .on("mouseleave", hideTooltip )
  }

  const classicTabs = document.querySelector('.classic-tabs')
  classicTabs.style.display = 'none'
  const stmt = db.prepare("SELECT * FROM campaign");
  stmt.getAsObject();
  stmt.bind();
  while(stmt.step()) {
    primaryTable.row.add(stmt.getAsObject())
  }
  primaryTable.draw()
  document.addEventListener('click',function(e){
    if(e.target.classList.contains('nav-link')){
      const target = e.target.getAttribute('href').substring(1)
      const container = document.getElementById('myClassicTabContent')
      container.querySelectorAll('.tab-pane').forEach(el => {
        if(el.getAttribute('id') === target){
          el.classList.add('active', 'show')
        }else{
          el.classList.remove('active', 'show')
        }
      })
    }
  })
})

Date.prototype.ddmmyyyy = function() {
  const mm = this.getMonth() + 1; // getMonth() is zero-based
  const dd = this.getDate();
  return [(dd>9 ? '' : '0') + dd, (mm>9 ? '' : '0') + mm, this.getFullYear()].join('/');
};



