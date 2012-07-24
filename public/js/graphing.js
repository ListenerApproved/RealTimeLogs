"use strict"; 

jQuery(function($) { 
  var lastLineNum = 0
  function graphData(name) {
    var value = 0,
    values = [],
    i = 0,
    last;
      return context.metric(function(start, stop, step, callback) {
      start = +start, stop = +stop;
      if (isNaN(last)) last = start;
      while (last < stop) {
        last += step;
        value = window.linenum - lastLineNum;
        lastLineNum = window.linenum
        if (window.graphEnabled) {
          values.push(value);
        }
      }
      callback(null, values = values.slice((start - stop) / step));
    }, name);
  }

  var topbarSize = $(".topbarWrapper").width()
  var autoWidth = Math.round(window.innerWidth - topbarSize - 200)

  var context = cubism.context()
      .serverDelay(0)
      .clientDelay(0)
      .step(1e4)
      .size(autoWidth);

  var foo = graphData("foo");

  d3.select("#graphBar").call(function(div) {
    div.datum(foo);

    div.append("div")
        .attr("class", "horizon")
        .call(context.horizon()
          .height(40)
          .colors(["#FFFFFF","#FFFFFF","#FFFFFF","#FFFFFF","#00CC33","#BBFF66","#FFBB00","#FF0000"])
          .title(" "));
  });

  // On mousemove, reposition the chart values to match the rule.
  context.on("focus", function(i) {
    d3.selectAll(".value").style("right", i == null ? null : context.size() - i + "px");
  });
});
