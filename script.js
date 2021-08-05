const sqlPromise = initSqlJs({
  locateFile: file => `./${file}`
});
const dataPromise = fetch("801F12EB8368-ELANCITY_RADAR__.db").then(res => res.arrayBuffer())
const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
const db = new SQL.Database(new Uint8Array(buf));

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
    while(stmt.step()) {
      detail.row.add(stmt.getAsObject())
    }
    detail.draw()
  });
  const stmt = db.prepare("SELECT * FROM campaign");
  stmt.getAsObject();
  stmt.bind();
  while(stmt.step()) {
    primaryTable.row.add(stmt.getAsObject())
  }
  primaryTable.draw()
});



