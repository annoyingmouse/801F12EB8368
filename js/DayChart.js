import * as d3 from "https://cdn.skypack.dev/d3@7";

export class DayChart{
  constructor(target, data, name) {
    this.target = target
    this.data = data
    this.name = name
    this.margin = {
      top: 40,
      right: 150,
      bottom: 60,
      left: 30
    }
    this.width = 1170 - this.margin.left - this.margin.right
    this.height = 600 - this.margin.top - this.margin.bottom
    this.target.innerHTML = ''
    this.legend_x = 'meas_date'
    this.legend_y = 'meas_speed'
    this.data.forEach(d => {
      d.date = moment(d.meas_date)
    })
    this.drawChart()
  }
  createContainer(){
    this.div = document.createElement('div')
    this.div.setAttribute('id', this.name)
    this.target.appendChild(this.div)
  }
  createSVG(){
    this.svg = d3.select(`#${this.name}`)
      .append("div")
      .classed("svg-container", true)
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${this.width + this.margin.left + this.margin.right} ${this.height + this.margin.top + this.margin.bottom}`)
      .attr("width", this.width + this.margin.left + this.margin.right)
      .attr("height", this.height + this.margin.top + this.margin.bottom)
      .append("g")
      .attr("transform", `translate(${this.margin.left},${this.margin.top})`)
  }
  minMax(){
    this.min_x = d3.min(this.data, d => d[this.legend_x])
    this.max_x = d3.max(this.data, d => d[this.legend_x])
    this.min_y = 0
    this.max_y = 80
  }
  X(){
    this.x = d3.scaleTime()
      .domain([this.min_x, this.max_x])
      .range([ 0, this.width ])

    this.svg.append('g')
      .classed('x axis', true)
      .attr("transform", `translate(0, ${this.height})`)
      .call(d3.axisBottom(this.x)
        .tickFormat(d3.timeFormat("%H:%M"))
        .ticks(Math.floor(( Date.parse(this.max_x) - Date.parse(this.min_x) ) / 3600000)))

    this.svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", this.width)
      .attr("y", this.height+50 )
      .text(this.legend_x)
  }
  Y(){
    this.y = d3.scaleLinear()
      .domain([this.min_y, this.max_y])
      .range([ this.height, 0])

    this.svg.append("g")
      .call(d3.axisLeft(this.y))

    this.svg.append("text")
      .attr("text-anchor", "end")
      .attr("x", 0)
      .attr("y", -20 )
      .text(this.legend_y)
      .attr("text-anchor", "start")
  }
  createToolTip(){
    this.tooltip = d3.select(`#${this.name}`)
      .append("div")
      .style("opacity", 0)
      .attr("class", "tooltip")
      .style("background-color", "black")
      .style("border-radius", "5px")
      .style("padding", "10px")
      .style("color", "white")
      .style("position", "absolute")
  }

  showTooltip = (event, d) => {
    console.log()
    this.tooltip
      .transition()
      .duration(200);
    this.tooltip
      .style("opacity", 1)
      .html(`Time: ${d[this.legend_x].toLocaleString(navigator.language, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })}. Speed: ${d[this.legend_y]}`)
      .style("left", (event.x)/2 + "px")
      .style("top", (event.y)/2-50 + "px");
  }

  moveTooltip = (event, d) => {
    this.tooltip
      .style("left", (event.x)/2 + "px")
      .style("top", (event.y)/2-50 + "px");
  }

  hideTooltip = (event, d) => {
    this.tooltip
      .transition()
      .duration(200)
      .style("opacity", 0);
  }
  drawChart(){
    this.createContainer()
    this.createSVG()
    this.minMax()
    this.X()
    this.Y()
    this.createToolTip()

    this.svg.append('g')
      .selectAll("dot")
      .data(this.data)
      .join("circle")
      .attr("class", 'bubble')
      .attr("cx", d => this.x(d[this.legend_x]))
      .attr("cy", d => this.y(Number(d[this.legend_y])))
      .attr("r", 3)
      .style("fill", d => d[this.legend_y] > 30 ? `#F00` : `#0F0`)
      .on("mouseover", this.showTooltip )
      .on("mousemove", this.moveTooltip )
      .on("mouseleave", this.hideTooltip )

  }
  
}