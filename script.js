import {CreateCharts} from './js/CreateCharts.js'

const sqlPromise = initSqlJs({
  locateFile: file => `./${file}`
});
const dataPromise = fetch("801F12EB8368-ELANCITY_RADAR__.db").then(res => res.arrayBuffer())
const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
const db = new SQL.Database(new Uint8Array(buf));
const chartData = []


jQuery.extend( jQuery.fn.dataTableExt.oSort, {
  "date-uk-pre": function (a){
    return parseInt(moment(a, "DD/MM/YYYY").format("X"), 10);
  },
  "date-uk-asc": function (a, b) {
    return a - b;
  },
  "date-uk-desc": function (a, b) {
    return b - a;
  }
} );

jQuery.extend( jQuery.fn.dataTableExt.oSort, {
  "datetime-uk-pre": function (a){
    return parseInt(moment(a, 'DD/MM/YYYY HH:mm:ss').format("X"), 10);
  },
  "datetime-uk-asc": function (a, b) {
    return a - b;
  },
  "datetime-uk-desc": function (a, b) {
    return b - a;
  }
} );

$(document).ready(function(){
  const primaryTable = $('#campaign').DataTable({
    columns: [
      {
        title: 'Started',
        render: (data, type, row, meta) => {
          return moment(data).format('DD/MM/YYYY')
        },
        data: 'camp_date_begin',
        type: 'date-uk'
      },
      {
        title: 'Ended',
        render: (data, type, row, meta) => {
          return moment(data).format('DD/MM/YYYY')
        },
        data: 'camp_date_end',
        type: 'date-uk'
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
              <button class="btn btn-secondary"
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
        data: 'meas_date',
        type: 'datetime-uk'
      },
      {
        title: 'Speed (mph)',
        data: 'meas_speed'
      }
    ]
  });
  $('#campaign tbody').on('click', 'button', function(e){
    $.blockUI();
    setTimeout(() => {
      const table = document.getElementById('campaign')
      table.querySelectorAll('button').forEach(btn => {
        if(btn === e.target){
          btn.classList.add('active')
        }else{
          btn.classList.remove('active')
        }
      })
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
      new CreateCharts(chartHolder, chartData)
    }, 100)
  });


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



