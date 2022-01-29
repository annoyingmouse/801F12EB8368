import { PeriodChart } from "./PeriodChart.js"

export class CreateCharts{
  constructor(target, data) {
    this.target = target
    this.data = data
    this.days = data.reduce((acc, cur) => {
      const date = new Date(cur.meas_date * 1000).toLocaleDateString('en-gb')
      if(acc.hasOwnProperty(date)){
        acc[date].push(cur)
      }else{
        acc[date] = [cur]
      }
      return acc
    }, {})
    this.periodChart = null
    this.createPeriodChart()
  }
  emptyTabs() {
    this.classicTabs = document.querySelector('.classic-tabs')
    this.classicTabs.style.display = ''
    this.classicTabs.querySelectorAll('.added').forEach(el => el.remove())
  }
  prepTabs(){
    this.ul = document.getElementById('myClassicTab')
    this.panel = document.getElementById('myClassicTabContent')
  }
  populateTab(day){
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
          ${day}
        </a>
      </li>
    `
    this.ul.appendChild(li.content.cloneNode(true))
  }
  populatePanel(day){
    const div = document.createElement('template')
    div.innerHTML = `
      <div class="tab-pane fade added"
           id="${day.replace(/\//g, "_")}"
           role="tabpanel"
           aria-labelledby="${day.replace(/\//g, "_")}_tab">
        <div id="${day.replace(/\//g, "_")}_chart"></div>
      </div>
    `
    this.panel.appendChild(div.content.cloneNode(true))
    new PeriodChart(
      document.getElementById(`${day.replace(/\//g, "_")}_chart`),
      this.days[day],
      `chart_${day.replace(/\//g, "_")}`
    )
  }
  createPeriodChart(){
    this.periodChart = new PeriodChart(this.target, this.data);
    this.emptyTabs()
    this.prepTabs()

    for(const day in this.days){
      this.populateTab(day)
      this.populatePanel(day)
    }
    $.unblockUI();
    Waves.attach('.waves-light', ['waves-effect', 'waves-light', 'rgba-white-slight']);
  }
}