// Load sqj.js module and database
const sqlPromise = initSqlJs({
  locateFile: file => `./${file}`
});
const dataPromise = fetch("801F12EB8368-ELANCITY_RADAR__.db")
  .then(res => res.arrayBuffer())
const [SQL, buf] = await Promise.all([sqlPromise, dataPromise])
const db = new SQL.Database(new Uint8Array(buf));

$(document).ready(function(){
    const primaryTable = $('#campaign').DataTable({
      columns: [
        {
          title: 'ID',
          orderable: false,
          data: 'camp_id'
        },
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
              <button class="btn btn-primary"
                             data-start="${moment(row.camp_date_begin).unix() - 1}"
                             data-end="${moment(row.camp_date_begin).unix() + 1}">
                View
              </button>
            `
          }
        }
      ]
    });
    


    var stmt = db.prepare("SELECT * FROM campaign");
    stmt.getAsObject();
    stmt.bind();
    while(stmt.step()) {
      primaryTable.row.add(stmt.getAsObject())
    }
    primaryTable.draw()
});



