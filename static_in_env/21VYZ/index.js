

/*----   GLOBAL VARIABLES   ----*/

var pergamino_box = null;

var selected_reason = null;
var selected_country = null;
var selected_agreement = null;
var selected_agreement_countries = null;


var reason_render_state = 0;
var is_pergamino_closed = true;
var is_pergamino_showed = false;


var regular_circle_radius =  5;
var hover_circle_radius = 8;
var country_selected_circle_radius = 10;
var aggr_selected_circle_radius = 18;
var regular_stroke_width = 1;

var parseDate = d3.timeFormat("%d %B, %Y");



/*----   COLOR VARIABLES   ----*/

var regular_orange_fill = '#d68037';

var very_light_gray_fill = 'rgb(208,208,208)';
var very_light_gray_stroke = '#3a3a3a';

var light_orange_fill = 'rgba(162,101,49,0.8)';
var light_orange_fill_2 = 'rgba(162,101,49)';
var light_orange_stroke = '#513c2e';

var very_light_orange_fill = '#ffdf98';
var very_light_organge_stroke = '#c77f32';

var light_gray_fill = 'rgba(58, 58, 58, 0.06)';
var light_gray_stroke = 'rgba(98, 103, 133, 0.11)';

var dark_gray_fill = '#4b4b4b';
var dark_gray_stroke = light_gray_stroke;

var very_dark_gray = '#313335';

var circle_opacity = 0.6;

var stroke_agreement = '#ffc729';



Promise.all([
    d3.json("https://raw.githubusercontent.com/Hlaboa/21peace_viz/master/Data%20Visualization/Data/21reasons.json"),
    d3.json("https://raw.githubusercontent.com/andybarefoot/andybarefoot-www/master/maps/mapdata/custom50.json"),
    d3.json("https://raw.githubusercontent.com/Hlaboa/21peace_viz/master/Data%20Visualization/Data/pax_data.json"),
    d3.json("https://raw.githubusercontent.com/Hlaboa/21peace_viz/master/Data%20Visualization/Data/pax_data_chart.json"),

]).then((files) => {


    // Load data....

    const data_reasons = files[0];
    const data_country = files[1];
    const data_pax = files[2];
    const data_pax_chart = files[3];


    // Function to wrap text in SVG
    const wrap = (text, width) => {
        text.each(function () {
            var text = d3.select(this),
                words = text.text().split(/\s+/).reverse(),
                word,
                line = [],
                line_number = 0,
                line_height = 1.1,
                x = text.attr("x"),
                y = text.attr("y"),
                dy = 0,
                tspan = text.text(null)
                            .append("tspan")
                            .attr("x", x)
                            .attr("y", y)
                            .attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan")
                                .attr("x", x)
                                .attr("y", y)
                                .attr("dy", ++line_number * line_height + dy + "em")
                                .text(word);
                    }
                }
            });
    };


    // ----    RENDER EXPLANATION
    const renderExplanation = () => {

        d3.select("p.reason_title")
            .data(data_reasons
                .filter(d => d.id == selected_reason))
            .text(d => d.reason)
                .style('font-size', '2em')
                .style('font-style', 'italic')
                .style('color', very_dark_gray)
                .style("opacity", 0)
            .transition().duration(2000).ease(d3.easeLinear)
                .style("opacity", 1);


        d3.select("p.text_explanation")
            .data(data_reasons
                .filter(d => d.id == selected_reason))
            .text(d => d.explanation)
                .style('font-size', '1.3em')
                .style('font-style', 'italic')
                .style('color', very_dark_gray)
                .style("opacity", 0)
            .transition().duration(2000).ease(d3.easeLinear)
                .style("opacity", 1);


        if (reason_render_state == 1) {
            d3.select("#reason_image")
                .append('img')
                    .attr('class', 'reason_selected')
        }

        d3.select("img.reason_selected")
            .data(data_reasons
                .filter(d => d.id == selected_reason))

                .attr("src", d => GLOBAL_PATH + "/static/21VYZ/Assets/reasons_img/".concat(d.id, ".png"))
                .style("opacity", 0)
            .transition().duration(2000).ease(d3.easeLinear)
                .style("opacity", 1);

    };

    const selection_explanation =
        d3.select(".explanation")
            .append('g');

    selection_explanation.call(renderExplanation);


    // ----    UPDATE EXPLANATION
    for (let input of document.querySelectorAll('input')) {
        input.onchange = (e) => {

            selected_reason = e.target.value;
            reason_render_state = (reason_render_state == 0) ? 1 : 2;

            selection_explanation.call(renderExplanation);

            /* Update Map */
            selected_country = null;
            selected_agreement = null;
            updateMap();

            // ----    RESTORE SCATTER STYLE
            svg_chart.call(renderChart, {
                width: chartDiv.clientWidth,
                height: chartDiv.clientHeight,
            });

            // ---- HIDE PERGAMINO
            selected_agreement = null;
            is_pergamino_showed = false;
            renderAgreement();

        }
    };



    // ----    MAP
    w = 3000;
    h = 1250;

    // Define map projection
    var projection = d3.geoEquirectangular()
        .center([0, 15])
        .scale([w / (2 * Math.PI)])
        .translate([w / 2, h / 2]);

    // Define map path
    var path = d3.geoPath(projection);

    // Create function to apply zoom to countries_group
    const zoomed = () => {

        t = d3.event.transform;

        countries_group
            .attr("transform", "translate(" + [t.x, t.y] + ")scale(" + t.k + ")");
    };

    // Define map zoom behaviour
    var zoom = d3
        .zoom()
        .on("zoom", zoomed);

    // ¿?
    getTextBox = (selection) => {
        selection
            .each(function (d) {
                d.bbox = this
                    .getBBox();
            });
    };


    // Function that calculates zoom/pan limits and sets zoom to default value
    const initiateZoom = () => {

        min_zoom = Math.max($("#map_holder").width() / w, $("#map_holder").height() / h);
        max_zoom = 20 * min_zoom;

        zoom
            .scaleExtent([min_zoom, max_zoom])
            .translateExtent([[0, 0], [w, h]]);


        mid_x = ($("#map_holder").width() - min_zoom * w) / 2;
        mid_y = ($("#map_holder").height() - min_zoom * h) / 2;

        svg.call(zoom.transform, d3.zoomIdentity.translate(mid_x, mid_y).scale(min_zoom));
    };

    // on window resize
    $(window).resize(() => {

        // Resize SVG
        svg
            .attr("width", $("#map_holder").width())
            .attr("height", $("#map_holder").height())

        initiateZoom();

        svg_chart.call(renderChart, {
                width: chartDiv.clientWidth,
                height: chartDiv.clientHeight
            });
    });


    /*------   MAP  ------*/

    // create an SVG
    var svg =
        d3.select("#map_holder")
            .append("svg")
                .attr("width", $("#map_holder").width())
                .attr("height", $("#map_holder").height())
            .call(zoom);


    // bind data and create one path per GeoJSON feature
    countries_group =
        svg.append("g")
            .attr("id", "map");


    // add a background rectangle
    countries_group
        .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", w)
            .attr("height", h);


    var countries =
        countries_group.selectAll("path")
            .data(data_country.features)
            .enter()
            .append("path")
                .attr("d", path)
                .attr("id", (d, i) => "country" + d.properties.iso_a3)
                .attr("class", "country")
                .style("fill", light_gray_fill)
                .style("stroke", light_gray_stroke);


    country_labels =
        countries_group.selectAll("g")
            .data(data_country.features)
            .enter()
            .append("g")
                .attr("class", "country_label")
                .attr("id", (d) => ("country_label" + d.properties.iso_a3))
                .attr("transform", (d) => ("translate(" + path.centroid(d)[0] + "," + path.centroid(d)[1] + ")"));


    const updateMap = () => {

        countries
            // ----    COUNTRY MOUSEOVER
            .on("mouseover", function (d, i) {

                d3.select(".country_selected" + d.properties.iso_a3)
                        .style('fill', light_orange_fill)
                        .style('stroke', light_orange_stroke);

                d3.select("#country_label_selected" + d.properties.iso_a3)
                        .style("visibility", "visible");

                let countries_all = data_pax.filter(d => selected_reason == d.reason).map(d => d.LocISO);
                if (countries_all.includes(d.properties.iso_a3) == true) {

                    const agts = data_pax_chart
                        .filter(agg => selected_reason == agg.reason)
                        .filter(agg => agg.LocISO.includes(d.properties.iso_a3))
                        .filter(agg => !agg.LocISO.includes(selected_country))
                        .map(r => r.AgtId);

                    agts.forEach(agt => {

                        d3.select('#aggr_'+agt)
                            .transition().duration(400)
                                .style('fill', light_orange_fill_2)
                                .style('stroke', light_orange_stroke)
                                .style('stroke-width', regular_stroke_width)
                                .attr('r', hover_circle_radius);
                    })
                }
            })

            // ----    COUNTRY MOUSEOUT
            .on("mouseout", function (d, i) {
                if (d.properties.iso_a3 != selected_country) {

                    d3.select(".country_selected" + d.properties.iso_a3)
                            .style('fill', dark_gray_fill)
                            .style('stroke', dark_gray_stroke);

                } else {

                    d3.select(this)
                            .style('fill', regular_orange_fill)
                            .style('stroke', light_orange_stroke);
                }

                d3.select("#country_label_selected" + d.properties.iso_a3)
                            .style("visibility", "hidden");

                let countries_all = data_pax.filter(d => selected_reason == d.reason).map(d => d.LocISO);

                if (countries_all.includes(d.properties.iso_a3) == true) {

                    const agts = data_pax_chart
                        .filter(agg => selected_reason == agg.reason)
                        .filter(agg => agg.LocISO.includes(d.properties.iso_a3))
                        .filter(agg => !agg.LocISO.includes(selected_country))
                        .map(r => r.AgtId);

                    agts.forEach(agt => {

                        d3.select('#aggr_'+agt)
                            .transition().duration(400)
                                .style('fill', null)
                                .style('stroke', null)
                                .style('stroke-width', regular_stroke_width)
                                .style('fill-opacity', '0.6')
                                .attr('r', regular_circle_radius)
                    })
                }
            })

            // ----    COUNTRY CLICK
            .on("click", function (d, i) {
                d3.select(".country_selected" + d.properties.iso_a3)
                        .attr('id', 'country_on');

                let countries_all = data_pax.filter(d => selected_reason == d.reason).map(d => d.LocISO);
                if (countries_all.includes(d.properties.iso_a3) == true) {

                    d3.select(".country_selected" + selected_country)
                            .style('fill', dark_gray_fill)
                            .style('stroke', dark_gray_stroke);

                    d3.select(this)
                            .style('fill', regular_orange_fill)
                            .style('stroke', light_orange_stroke);

                    selected_country = d.properties.iso_a3;

                    const agts =
                        data_pax_chart
                            .filter(agg => selected_reason == agg.reason)
                            .filter(agg => agg.LocISO.includes(d.properties.iso_a3))
                            .map(r => r.AgtId);

                    /* RESTORE SCATTER STYLE */
                    d3.selectAll('.circle')
                        .transition().duration(500)
                            .style('fill', null)
                            .style('stroke', null)
                            .style('stroke-width', regular_stroke_width)
                            .style('fill-opacity', '0.6')
                            .attr('r', regular_circle_radius);

                    agts.forEach(agt => {
                        d3.select('#aggr_'+agt)
                            .transition()
                                .style('fill', null)
                                .style('stroke', null)
                                .style('stroke-width', regular_stroke_width)
                                .attr('r', regular_circle_radius-3)
                            .transition().duration(2500).ease(d3.easeElastic)
                                .style('fill', regular_orange_fill)
                                .style('stroke', light_orange_stroke)
                                .style('stroke-width', regular_stroke_width)
                                .style('fill-opacity', '0.8')
                                .attr('r', country_selected_circle_radius)
                    });

                    /* RESTORE AGREEMENT PERGAMINO */
                    selected_agreement = null;
                    is_pergamino_showed = false;
                    renderAgreement();

                }
            })

            .transition().duration(1200)
                .attr("class", (d, i) => {
                    let countries_all = data_pax.filter(d => selected_reason == d.reason).map(d => d.LocISO);
                    return countries_all.includes(d.properties.iso_a3) ? "country_selected" + d.properties.iso_a3 : "country"
                })
                .style("fill", light_gray_fill)
                .style("stroke", light_gray_stroke)
            .transition().duration(1200)
                .style("fill", (d, i) => {
                    let countries_all = data_pax.filter(d => selected_reason == d.reason).map(d => d.LocISO);
                    return countries_all.includes(d.properties.iso_a3) ? dark_gray_fill : light_gray_fill
                })
                .style("stroke", (d, i) => {
                    let countries_all = data_pax.filter(d => selected_reason == d.reason).map(d => d.LocISO);
                    return countries_all.includes(d.properties.iso_a3) ? dark_gray_stroke : light_gray_stroke
                })
                .style('stroke-width', regular_stroke_width);

        country_labels
                .attr("id", (d, i) => {
                        let countries_all = data_pax.filter(d => selected_reason == d.reason).map(d => d.LocISO);
                        return countries_all.includes(d.properties.iso_a3) ? "country_label_selected" + d.properties.iso_a3 : "country_label" + d.properties.iso_a3
                    });


        };

    country_labels
        .append("text")
            .attr("class", "country_name")
            .style("text-anchor", "middle")
            .attr("dx", 0)
            .attr("dy", -60)
        .text((d) => d.properties.name)
            .style('font-size', '2.5em')
        .call(getTextBox);

    country_labels
        .insert("rect", "text")
            .attr("class", "country_label_bg")
            .attr("transform", (d) => "translate(" + (d.bbox.x - 25) + "," + (d.bbox.y) + ")")
            .attr("width", (d) => d.bbox.width + 50)
            .attr("height", (d) => d.bbox.height);

    country_labels.exit().remove();

    initiateZoom();

    var svg_chart = d3
            .select(".chart_box")
            .append("svg")
                .attr("width", 800)
                .attr("height", 190);


    const renderChart = (selection, props) => {

        const {
            width,
            height
        } = props;


        let margin_left = 50;
        let margin_top = 0;
        let xAxisLabelOffset = 10;
        let yAxisLabelOffset = -60;

        const innerWidth = width - margin_left;
        const innerHeight = height - margin_top;


        selection
                .attr('width', width)
                .attr('height', height);


        let g = selection.selectAll('.container')
            .data([null]);

        const gEnter = g
            .enter()
            .append('g')
                .attr('class', 'container');

        g = gEnter
            .merge(g)
              .attr('transform', `translate(${margin_left}, ${margin_top})`);

        const xAxisGEnter = gEnter
            .append('g')
                .attr('class', 'x-axis');

        const xAxisG = xAxisGEnter
            .merge(g.select('.x-axis'))
                .attr('transform', `translate(0, ${innerHeight})`);

        xAxisGEnter
            .append('text')
                .attr('class', 'axis-label')
                .attr('y', xAxisLabelOffset)
            .merge(xAxisG.select('.axis-label'))
                .attr('x', innerWidth / 2)
            .text('xLabel');


         const yAxisGEnter = gEnter
            .append('g')
                .attr('class', 'y_axis');

        const yAxisG = yAxisGEnter
            .merge(g.select('.y_axis'))
                .attr('transform', `translate(${innerWidth}, 0)`);

        yAxisGEnter
            .append('text')
                .attr('class', 'axis-label')
                .attr('y', yAxisLabelOffset)
            .merge(yAxisG.select('.axis-label'))
                .attr('y', innerHeight * 2)
            .text('yLabel');



        const xScale = d3.scaleTime()
            .domain([d3.min(data_pax_chart, (d) =>  d.Dat), d3.max(data_pax_chart, (d) =>  d.Dat)])
            .range([70, width-70]);

        const yScale = d3.scaleOrdinal()
            .domain(['Pre-negotiation/Process', 'Substantive-Partial', 'Substantive-Comprehensive', 'Implementation/Renegotiation', 'Renewal', 'Ceasefire related', 'Other'])
            .range([30, 50, 70, 90, 110, 130, 150]);

        const xAxis = d3.axisBottom()
            .scale(xScale);

        const yAxis = d3.axisLeft()
            .scale(yScale);


        const circles = g.selectAll('.circle')
            .data(data_pax_chart
                .filter(d => d.reason == selected_reason));


        const render_circles = () => {

            circles
                .enter()
                .append('circle')
                    .attr('class', 'circle')
                .merge(circles)
                    .attr('id', (d, i) => 'aggr_' + d.AgtId)
                    .attr('r', (d, i) => {

                        is_in_country = d.LocISO.includes(selected_country);
                        is_selected_aggr = (d.AgtId == selected_agreement);

                        return (is_selected_aggr) ? aggr_selected_circle_radius : ((is_in_country) ? country_selected_circle_radius : regular_circle_radius)
                    })


                /*----  CIRCLE MOUSEOVER ----*/
                .on("mouseover", (d, i) => {

                    if (selected_agreement != d.AgtId) {

                        d3.select('#aggr_' + d.AgtId)
                                .style('cursor', 'pointer');

                        if (d.LocISO.includes(selected_country)) {

                            d3.select('#aggr_' + d.AgtId)
                                .transition().duration(400)
                                    .style('fill', 'rgb(209,144,51)')
                                    .style('stroke', light_orange_stroke)
                                    .style('stroke-width', regular_stroke_width)
                                    .attr('r', country_selected_circle_radius+2);

                        } else {

                            d3.select('#aggr_' + d.AgtId)
                                .transition().duration(400)
                                    .style('fill', light_orange_fill_2)
                                    .style('stroke', light_orange_stroke)
                                    .style('stroke-width', regular_stroke_width)
                                    .attr('r', hover_circle_radius);
                        }
                    }
                })

                /*----  CIRCLE MOUSEOUT ----*/
                .on("mouseout", (d, i) => {

                    if (selected_agreement != d.AgtId) {

                        if (!d.LocISO.includes(selected_country)) {

                            d3.select('#aggr_' + d.AgtId)
                                .transition().duration(400)
                                    .style('fill', null)
                                    .style('stroke', null)
                                    .style('stroke-width', regular_stroke_width)
                                    .style('fill-opacity', '0.6')
                                    .attr('r', regular_circle_radius)

                        } else {

                            d3.select('#aggr_' + d.AgtId)
                                .transition().duration(400)
                                    .style('fill', regular_orange_fill)
                                    .style('stroke', light_orange_stroke)
                                    .style('fill-opacity', '0.8')
                                    .attr('r', country_selected_circle_radius)

                        }
                    }
                })

                /*----  CIRCLE CLICK ----*/
                .on("click", (d, i) => {

                    /* Update flags */
                    selected_agreement_countries = d.LocISO;

                    /* No previously selected agreement */
                    if(selected_agreement == null){
                    }


                    /* Previously selected agreement was orange */
                    else if(data_pax_chart
                        .filter(d => d.reason == selected_reason)
                        .filter(d => d.AgtId == selected_agreement)[0].LocISO.includes(selected_country)){

                        d3.select('#aggr_' + selected_agreement)
                                .transition().duration(400)
                                    .style('fill', regular_orange_fill)
                                    .style('stroke', light_orange_stroke)
                                    .style('stroke-width', regular_stroke_width)
                                    .style('fill-opacity', '0.8')
                                    .attr('r', country_selected_circle_radius)
                    }

                    /* Previously selected agreement was gray */
                    else{
                        d3.select('#aggr_' + selected_agreement)
                                .transition().duration(600)
                                    .style('fill', null)
                                    .style('stroke', null)
                                    .style('stroke-width', regular_stroke_width)
                                    .style('fill-opacity', '0.6')
                                    .attr('r', regular_circle_radius)
                    }

                    /* Previously selected agreement was gray */
                    d3.select('#aggr_' + d.AgtId)
                            .transition().duration(500).ease(d3.easeElastic)
                                .style('fill', very_light_gray_fill)
                                .style('stroke', very_light_gray_stroke)
                                .style('stroke-width', regular_stroke_width)
                                .style('fill-opacity', circle_opacity)
                                .attr('r', aggr_selected_circle_radius);


                    selected_agreement = d.AgtId;

                    if (!d.LocISO.includes(selected_country)) {

                        d3.select('#aggr_' + d.AgtId)
                            .transition().duration(2500).ease(d3.easeElastic)
                                .style('fill', very_light_gray_fill)
                                .style('stroke', very_light_gray_stroke)
                                .style('stroke-width', regular_stroke_width)
                                .style('fill-opacity', circle_opacity)
                                .attr('r', aggr_selected_circle_radius);
                    } else {

                        d3.select('#aggr_' + d.AgtId)
                            .transition().duration(2500).ease(d3.easeElastic)
                                .style('fill', very_light_orange_fill)
                                .style('stroke', stroke_agreement)
                                .style('stroke-width', regular_stroke_width)
                                .style('fill-opacity', circle_opacity)
                                .attr('r', aggr_selected_circle_radius)
                    }

                    is_pergamino_showed=true;
                    renderAgreement();

                    d3.selectAll(".circle")
                        .sort((a, b) => (a.AgtId != d.AgtId) ? 1 : -1)   // sorting, selected circle is pushed back
                })


                /*----  STARTING ANIMATION ----*/
                .transition().delay((d, i) => (i * 3)).duration(1500)
                        .attr("cx", (d) => xScale(d.Dat))
                        .attr("cy", (d) => yScale(d.Stage))
                        .style('fill', (d,i) => {
                            is_in_country = d.LocISO.includes(selected_country);
                            is_selected_aggr = (d.AgtId == selected_agreement);


                            return (is_selected_aggr)
                                ? ((is_in_country) ? very_light_orange_fill : very_light_gray_fill)
                                : ((is_in_country) ? regular_orange_fill : null)
                        })
                        .style('fill-opacity', (d,i) => {
                            is_in_country = d.LocISO.includes(selected_country);
                            is_selected_aggr = (d.AgtId == selected_agreement);

                            return (is_selected_aggr)
                                ? ((is_in_country) ? circle_opacity : circle_opacity)
                                : ((is_in_country) ? 0.8 : circle_opacity)
                        })
                        .style('stroke', (d,i) => {
                            is_in_country = d.LocISO.includes(selected_country);
                            is_selected_aggr = (d.AgtId == selected_agreement);

                            return (is_selected_aggr)
                                ? ((is_in_country) ? stroke_agreement : very_light_gray_stroke)
                                : ((is_in_country) ? light_orange_stroke : null)
                        })
                        .style('stroke-width', regular_stroke_width)
                        .attr('r', (d, i) => {regular_circle_radius

                                    is_in_country = d.LocISO.includes(selected_country);
                                    is_selected_aggr = (d.AgtId == selected_agreement);

                                    return (is_selected_aggr) ? aggr_selected_circle_radius : ((is_in_country) ? country_selected_circle_radius : regular_circle_radius)
                                });

            circles.exit().remove();
        };

        render_circles();

        xAxisG
            .call(xAxis)
                .attr("transform", "translate(0, 160)");

        yAxisG
            .call(yAxis)
                .attr("transform", "translate(65, 0)")
        .selectAll(".tick text")
            .attr("transform", "rotate(-10)")
            .attr('dy', '0.1em')

    };

    const render = () => {
        chartDiv = d3.select(".chart_box").node();

        svg_chart.call(renderChart, {
        width: chartDiv.clientWidth,
        height: chartDiv.clientHeight,
        });

    };
    render();

    const create_agreement = () => {

        pergamino_box =
            d3.select(".agreement_box")
                .append('svg')
                    .attr('class', 'agreementSelected')
                    .attr('width', 355)
                    .attr('height', 480);

        pergamino_container =
            pergamino_box
                .append('g')
                    .attr('class', 'full_pergamino');

        pergamino_image =
            pergamino_container
            .append('g')
                .attr('class', 'image_pergamino')
                .attr('fill', dark_gray_fill)
                .attr('transform', "scale(0.06, 0)");


        pergamino_image
            .append('path')
                .attr('d','M496 6809 c-78 -13 -171 -65 -242 -134 -136 -133 -191 -340 -158 -600 25 -202 35 -271 44 -300 5 -16 11 -50 14 -75 17 -135 38 -273 51 -335 8 -38 19 -128 25 -200 17 -229 31 -377 46 -490 8 -60 19 -148 25 -195 6 -47 14 -119 20 -160 5 -41 13 -124 18 -185 6 -60 12 -123 15 -140 9 -45 26 -291 32 -460 6 -156 7 -150 -51 -465 -9 -47 -22 -144 -30 -216 -8 -73 -22 -167 -31 -210 -8 -44 -19 -106 -24 -139 -5 -33 -15 -109 -24 -170 -9 -60 -23 -189 -31 -285 -25 -289 -53 -512 -95 -755 -16 -96 -32 -442 -25 -543 6 -87 45 -267 78 -358 47 -130 119 -213 232 -266 l70 -33 390 1 c539 1 1498 21 1685 34 97 7 239 9 380 4 124 -4 366 -6 538 -5 172 1 370 -3 440 -9 70 -6 345 -15 612 -20 267 -5 532 -15 590 -21 149 -17 406 -17 452 -1 53 19 137 105 207 212 57 87 61 98 61 149 -1 70 -27 121 -100 197 -52 54 -115 93 -151 94 -21 0 -45 74 -64 200 -9 58 -22 133 -30 167 -31 132 -58 697 -44 918 5 66 13 210 19 320 6 110 17 243 25 295 21 136 45 494 45 673 0 140 -13 300 -40 507 -6 41 -17 161 -25 265 -9 105 -26 244 -38 310 -21 116 -22 141 -20 675 l1 555 30 173 c36 206 55 250 133 304 72 50 104 88 144 173 49 102 61 164 45 245 -15 76 -29 107 -72 156 -61 69 -175 107 -322 105 -45 0 -290 -12 -546 -25 -256 -14 -589 -30 -740 -35 -352 -12 -1774 -13 -1945 -1 -167 12 -617 56 -765 75 -173 22 -767 39 -854 24z m659 -49 c83 -5 182 -14 222 -20 40 -6 224 -26 410 -45 l338 -33 1030 2 c1077 3 988 0 2055 56 205 11 219 11 293 -9 43 -11 91 -30 107 -41 41 -29 88 -106 96 -156 21 -145 -73 -332 -199 -393 -50 -24 -188 -41 -327 -40 -75 1 -89 3 -65 10 17 5 42 11 56 13 15 3 52 12 84 22 46 15 58 16 65 5 12 -20 51 -7 106 35 33 25 45 31 39 18 -28 -70 -17 -69 61 1 59 52 110 133 101 158 -2 7 -14 -11 -26 -39 -21 -49 -95 -134 -106 -122 -3 3 -2 24 4 47 12 54 -4 53 -44 -2 -33 -46 -92 -90 -107 -81 -5 3 -2 14 8 25 24 26 4 24 -55 -5 -27 -14 -57 -23 -68 -20 -11 3 -40 -4 -63 -16 -25 -13 -53 -20 -68 -17 -18 3 -26 0 -29 -14 -7 -24 -35 -24 -255 -4 -346 30 -581 37 -1833 50 -992 11 -1526 10 -1835 -4 -173 -7 -349 -11 -390 -9 l-75 3 36 22 c89 56 132 256 85 390 -12 33 -12 45 -2 58 11 15 13 15 25 1 20 -23 51 -20 51 5 0 11 -5 29 -11 41 -20 38 0 29 47 -21 63 -67 79 -67 71 -1 -6 46 -5 49 12 38 10 -6 30 -30 45 -54 35 -55 51 -57 41 -6 l-6 37 31 -35 31 -35 -6 30 c-8 37 -53 98 -66 89 -6 -3 -19 2 -30 12 -29 26 -33 11 -8 -32 l22 -39 -54 53 c-30 28 -58 52 -61 52 -4 0 2 -19 12 -42 11 -24 20 -56 20 -73 l0 -30 -39 43 c-21 23 -41 49 -45 57 -5 13 -75 49 -82 42 -2 -2 7 -19 21 -39 13 -19 27 -48 31 -64 l7 -29 -27 25 c-15 13 -37 40 -49 60 -20 34 -38 52 -44 46 -2 -2 8 -27 21 -57 14 -29 22 -56 19 -59 -3 -3 -8 1 -10 8 -9 23 -94 122 -106 122 -7 0 -6 4 3 10 19 12 291 12 485 0z m-534 -33 c41 -21 69 -54 35 -41 -9 3 -16 1 -16 -5 0 -6 11 -11 24 -11 14 0 27 -4 31 -9 8 -13 -58 -25 -100 -18 -19 3 -35 2 -37 -3 -5 -15 -106 -28 -119 -16 -8 7 -10 7 -6 0 6 -11 -82 -91 -96 -86 -5 1 -6 -6 -3 -16 7 -21 -14 -79 -29 -80 -5 0 -11 -5 -13 -11 -2 -7 3 -8 13 -5 13 5 15 2 10 -19 -10 -38 12 -129 44 -178 32 -50 138 -119 183 -119 18 0 28 -5 28 -15 0 -8 5 -15 10 -15 6 0 10 5 10 10 0 15 391 12 408 -3 10 -8 16 -7 21 2 6 9 70 16 232 23 301 13 427 14 1094 6 314 -3 726 -7 916 -8 272 -1 352 -4 373 -15 14 -8 26 -10 26 -4 0 5 52 9 120 9 98 0 122 -3 126 -15 8 -20 24 -19 24 1 0 8 5 12 11 8 13 -7 173 -9 186 -1 4 3 33 3 63 2 30 -2 101 -4 158 -5 56 -1 102 -4 102 -8 0 -4 48 -7 108 -8 168 -1 412 -25 412 -41 0 -7 5 -13 11 -13 5 0 7 5 4 10 -4 6 10 10 34 10 22 0 42 -5 44 -12 4 -10 8 -10 15 1 10 13 131 19 151 7 5 -4 46 -7 90 -7 45 0 81 -5 81 -10 0 -5 5 -9 10 -9 6 0 10 7 10 15 0 8 5 15 10 15 12 0 12 -3 4 -24 -3 -9 -12 -16 -20 -16 -7 0 -11 -6 -8 -13 3 -8 -2 -14 -11 -14 -18 0 -19 9 -4 24 7 7 7 13 1 17 -6 3 -13 -2 -17 -13 -3 -10 -16 -22 -28 -27 -18 -6 -14 -8 21 -11 36 -4 43 -7 37 -21 -3 -9 -9 -39 -12 -65 -3 -27 -9 -43 -13 -36 -4 6 -13 8 -20 4 -7 -4 -16 -2 -21 6 -6 11 -9 11 -9 1 0 -7 11 -18 25 -24 41 -18 31 -67 -13 -61 l-27 3 25 -12 c14 -6 27 -13 29 -14 2 -2 -4 -11 -14 -20 -11 -12 -13 -19 -5 -24 13 -8 3 -61 -14 -72 -8 -6 -8 -10 1 -16 8 -5 9 -13 3 -22 -5 -9 -5 -20 3 -28 8 -11 7 -16 -6 -23 -21 -12 -23 -31 -2 -23 8 4 15 2 15 -4 0 -5 -14 -12 -30 -15 -16 -4 -30 -11 -30 -16 0 -6 13 -8 30 -4 23 4 30 2 30 -11 0 -9 -7 -16 -16 -16 -15 0 -15 -2 0 -25 16 -24 16 -25 -6 -25 -21 -1 -22 -2 -5 -14 19 -15 23 -36 6 -36 -8 0 -8 -4 -2 -12 16 -21 16 -320 1 -330 -10 -6 -10 -8 0 -8 7 0 12 -13 12 -30 0 -20 -5 -30 -15 -30 -8 0 -15 -4 -15 -10 0 -5 7 -7 15 -4 19 8 21 -26 3 -44 -9 -9 -10 -15 -2 -20 13 -9 17 -172 3 -172 -11 0 -12 -37 0 -42 14 -5 21 -118 8 -118 -8 0 -9 -3 -1 -8 16 -10 45 -203 33 -218 -6 -8 -4 -15 6 -24 8 -7 15 -24 15 -39 0 -21 -2 -23 -11 -11 -9 12 -10 11 -4 -5 4 -11 8 -24 9 -30 1 -5 6 -21 10 -34 6 -16 4 -26 -5 -32 -10 -6 -11 -9 -1 -9 15 0 13 -100 -3 -100 -5 0 -2 -5 8 -11 20 -12 23 -55 5 -62 -10 -4 -9 -8 2 -17 11 -9 12 -13 3 -17 -18 -7 -16 -23 2 -23 10 0 15 -10 15 -30 0 -16 -4 -30 -10 -30 -5 0 -10 -4 -10 -10 0 -5 7 -10 15 -10 8 0 15 -7 15 -15 0 -9 -6 -15 -12 -14 -19 3 -48 -12 -48 -24 0 -7 4 -7 12 1 19 19 45 14 52 -10 10 -39 7 -96 -6 -102 -9 -3 -7 -8 6 -17 15 -9 16 -13 5 -21 -11 -7 -11 -11 -1 -15 6 -2 12 -18 12 -34 0 -18 -4 -28 -10 -24 -5 3 -10 4 -10 1 0 -2 -3 -11 -6 -20 -4 -12 0 -16 15 -16 24 0 29 -25 6 -34 -8 -3 -15 -13 -14 -23 0 -11 3 -13 6 -5 2 6 9 12 14 12 14 0 10 -26 -6 -40 -8 -7 -15 -17 -15 -22 0 -7 5 -6 14 1 11 9 13 -1 15 -54 1 -56 -1 -65 -16 -66 -17 -1 -17 -2 0 -6 20 -5 22 -24 5 -41 -9 -9 -9 -12 0 -12 18 0 16 -95 -3 -110 -14 -11 -13 -14 1 -25 12 -8 13 -14 6 -19 -6 -4 -9 -13 -6 -21 4 -8 -1 -18 -10 -21 -9 -3 -16 -11 -16 -16 0 -6 7 -8 15 -4 18 7 21 -20 3 -28 -10 -5 -10 -7 -1 -12 10 -4 12 -28 7 -92 -7 -115 -13 -154 -24 -147 -5 3 -11 1 -15 -5 -3 -5 1 -10 9 -10 9 0 15 -8 15 -17 -3 -42 -15 -78 -27 -79 -6 -1 -19 -2 -27 -3 -8 0 -15 -6 -15 -11 0 -6 11 -8 25 -4 23 6 25 3 25 -24 0 -17 -6 -33 -12 -36 -8 -4 -9 -8 -3 -11 6 -3 9 -38 7 -85 -3 -68 -7 -82 -25 -95 l-21 -15 22 0 c17 0 22 -4 18 -17 -2 -10 -10 -124 -17 -253 -7 -129 -17 -241 -22 -247 -6 -9 -6 -13 1 -13 6 0 11 -12 10 -27 0 -16 3 -93 7 -171 6 -115 5 -146 -5 -152 -11 -7 -10 -11 2 -24 15 -14 19 -51 22 -204 1 -28 5 -52 9 -52 5 0 7 -10 6 -22 -1 -13 4 -36 10 -53 7 -16 13 -58 14 -92 1 -35 5 -63 8 -63 3 0 11 -33 17 -72 6 -40 14 -84 18 -98 5 -24 5 -25 -11 -5 -12 15 -18 17 -24 7 -12 -19 -170 -14 -194 6 -16 15 -17 14 -11 -1 5 -13 0 -17 -20 -17 -20 0 -24 4 -20 18 5 16 5 16 -9 0 -16 -20 -37 -24 -37 -7 0 7 -7 8 -17 4 -10 -5 -36 -10 -58 -12 -22 -2 -49 -4 -60 -6 -14 -1 -21 5 -23 21 -2 12 -7 20 -12 17 -4 -3 -6 -13 -3 -23 4 -18 -7 -19 -202 -18 -114 1 -208 -1 -210 -4 -6 -10 -137 -10 -155 0 -11 6 -21 6 -24 1 -8 -12 -129 -1 -138 13 -6 8 -10 8 -15 0 -11 -15 -143 -16 -161 -2 -10 9 -15 9 -22 -2 -10 -17 -139 -23 -157 -8 -9 7 -13 7 -13 -2 0 -9 -11 -11 -39 -6 -23 3 -42 2 -46 -4 -9 -14 -52 -12 -58 3 -4 9 -8 9 -14 1 -5 -7 -33 -11 -68 -9 -33 1 -65 -2 -70 -6 -6 -4 -48 -9 -94 -10 -62 -1 -85 2 -92 12 -7 11 -9 10 -9 -3 0 -17 -16 -18 -201 -18 -217 0 -487 17 -506 32 -7 5 -14 5 -18 -2 -8 -13 -62 -13 -70 0 -9 14 -42 12 -48 -2 -3 -10 -7 -10 -17 -1 -9 8 -20 8 -42 1 -28 -10 -43 -6 -43 13 0 5 -4 8 -10 7 -5 -2 -9 -6 -8 -10 2 -4 -43 -5 -100 -2 -56 3 -117 5 -134 5 -23 -1 -33 3 -33 13 0 13 -4 13 -27 1 -30 -16 -43 -12 -43 12 0 14 -2 14 -18 2 -9 -8 -28 -13 -42 -12 -14 1 -77 5 -140 8 -63 4 -116 10 -118 16 -5 12 -32 12 -32 -1 0 -5 -4 -10 -10 -10 -5 0 -10 7 -10 15 0 17 -26 21 -32 4 -2 -6 -27 -8 -71 -3 -43 4 -64 10 -55 15 9 6 6 9 -9 9 -13 0 -23 -4 -23 -10 0 -14 -92 0 -112 17 -11 10 -18 11 -23 4 -7 -12 -55 -15 -55 -3 0 4 -34 6 -75 5 -41 -1 -77 2 -80 7 -3 4 -13 6 -23 3 -10 -2 -31 3 -47 11 -30 16 -51 12 -25 -4 13 -8 12 -10 -2 -10 -9 0 -20 5 -24 11 -4 8 -9 7 -15 -2 -4 -7 -12 -10 -16 -5 -4 4 0 13 10 20 27 21 20 28 -9 9 -31 -20 -120 -28 -130 -12 -4 8 -10 7 -16 -2 -7 -10 -9 -8 -5 7 3 17 1 20 -14 17 -10 -3 -16 -9 -13 -14 5 -9 -24 -14 -56 -11 -59 7 -214 0 -257 -11 -37 -10 -54 -11 -58 -3 -3 8 -7 7 -11 -1 -3 -7 -12 -13 -20 -13 -8 0 -14 -4 -14 -10 0 -5 5 -10 11 -10 8 0 7 -5 -1 -15 -7 -9 -21 -13 -31 -10 -22 7 -25 -5 -7 -23 10 -10 6 -11 -17 -7 -31 6 -65 -8 -52 -22 5 -4 12 -2 16 5 5 9 15 10 31 4 20 -7 21 -10 6 -15 -10 -4 -14 -11 -11 -17 3 -6 -4 -10 -16 -10 -16 0 -19 -3 -11 -13 14 -17 4 -57 -14 -57 -8 0 -14 -4 -14 -10 0 -5 7 -10 15 -10 20 0 19 -15 -2 -36 -20 -20 -25 -54 -7 -54 14 0 7 -41 -9 -52 -6 -4 -4 -13 6 -23 19 -18 23 -45 7 -45 -5 0 -10 -5 -10 -11 0 -5 4 -8 9 -4 6 3 22 -18 36 -47 35 -70 77 -112 136 -138 51 -21 64 -40 29 -40 -11 0 -20 5 -20 12 0 9 -3 9 -12 0 -23 -23 -41 -14 -34 16 l6 27 -16 -22 c-9 -13 -24 -23 -33 -23 -14 0 -14 2 -1 10 12 8 10 10 -10 10 -23 1 -24 2 -7 14 9 7 17 18 17 25 0 7 -13 2 -30 -10 -16 -13 -33 -20 -37 -16 -3 4 0 7 7 7 9 0 6 8 -9 24 -14 15 -19 26 -12 31 6 3 11 11 11 17 0 7 -9 2 -21 -10 -11 -13 -17 -28 -13 -35 4 -6 -2 -4 -14 7 -12 10 -20 23 -19 30 1 6 -4 10 -10 9 -7 -2 -13 4 -13 12 0 8 -4 15 -10 15 -5 0 -10 9 -10 19 0 10 -7 21 -15 25 -8 3 -15 11 -15 17 0 7 3 9 6 6 10 -10 44 12 44 28 0 8 -4 15 -10 15 -5 0 -10 -6 -10 -13 0 -7 -9 -13 -19 -14 -14 -1 -23 8 -31 32 -10 30 -9 37 9 56 12 13 18 25 15 28 -3 3 -10 -2 -15 -12 -15 -27 -26 -20 -34 21 -3 20 -9 48 -12 61 -4 17 -2 22 6 17 7 -5 11 0 11 13 0 12 -6 21 -14 21 -8 0 -16 7 -20 15 -3 9 0 15 8 15 14 0 26 21 26 43 0 6 -6 2 -14 -9 -12 -16 -17 -17 -28 -6 -11 11 -10 15 2 25 20 16 23 37 5 37 -8 0 -15 5 -15 11 0 7 11 9 31 5 27 -5 29 -4 15 10 -9 8 -16 20 -16 27 0 6 -7 2 -15 -9 -14 -18 -14 -17 -15 13 0 25 6 36 27 48 16 9 21 14 12 12 -9 -3 -22 -1 -30 4 -12 8 -12 10 1 19 12 8 13 12 2 19 -10 6 -13 29 -11 77 3 83 5 87 30 73 32 -16 34 -3 5 24 -31 29 -36 80 -8 96 9 6 12 11 6 11 -6 0 -11 14 -11 30 0 24 5 30 21 30 l21 1 -22 18 c-24 20 -16 46 10 35 10 -3 17 -1 17 5 0 6 -6 11 -14 11 -19 0 -29 17 -22 37 5 12 9 13 21 3 9 -7 19 -10 23 -6 4 4 -2 15 -13 24 -15 13 -19 27 -17 60 2 23 7 42 12 42 5 0 6 15 3 34 -4 29 -2 34 18 40 22 6 23 7 6 20 -20 15 -22 42 -4 50 10 5 10 7 0 12 -18 8 -16 25 1 18 19 -7 27 30 11 53 -7 10 -11 30 -8 45 4 20 9 24 26 20 14 -3 18 -1 13 6 -4 7 -14 12 -22 12 -8 0 -14 5 -14 10 0 6 4 10 8 10 8 0 32 43 32 57 0 3 -6 3 -13 0 -17 -6 -13 63 5 75 11 8 11 10 -1 15 -11 5 -11 7 0 14 11 7 12 12 2 28 -14 22 -9 77 8 97 8 10 8 14 0 14 -6 0 -11 7 -11 15 0 8 5 15 11 15 7 0 9 12 5 34 -5 23 -3 36 6 39 10 4 10 8 -2 16 -16 11 -8 15 25 11 11 -1 16 2 12 7 -5 4 -14 8 -20 8 -7 0 -13 10 -15 23 -3 21 4 26 38 23 8 0 5 4 -8 11 -26 13 -28 26 -7 34 8 4 15 11 15 16 0 6 -6 5 -15 -2 -13 -10 -15 -9 -15 9 0 12 4 20 9 16 5 -3 12 -1 16 5 3 5 1 10 -4 10 -6 0 -11 9 -11 20 0 11 7 20 15 20 8 0 15 5 15 10 0 6 -4 10 -10 10 -5 0 -10 5 -10 10 0 6 7 10 15 10 19 0 19 7 1 26 -14 14 -11 48 5 70 5 6 7 13 4 16 -3 3 1 40 10 82 8 43 17 110 21 151 6 63 10 74 28 80 18 6 19 8 4 12 -10 2 -18 11 -18 20 0 10 6 14 20 10 23 -6 27 11 5 19 -16 7 -21 34 -6 34 5 0 11 7 14 14 4 10 1 13 -7 10 -10 -4 -11 5 -5 43 12 64 14 75 29 171 10 61 18 82 29 83 11 0 12 2 4 6 -7 2 -13 21 -13 40 0 30 2 34 15 23 11 -9 15 -9 15 -1 0 6 -7 14 -16 18 -13 5 -13 7 -2 14 10 7 10 9 1 9 -10 0 -13 27 -13 99 0 70 4 101 13 104 8 4 9 8 1 14 -18 13 -27 80 -12 86 10 4 10 7 0 15 -8 5 -13 23 -11 43 2 19 0 54 -4 79 -3 25 -11 96 -18 159 -10 95 -10 114 2 122 12 8 12 10 0 18 -8 5 -12 18 -8 30 3 12 1 24 -4 27 -18 11 -10 44 12 44 12 0 17 4 14 11 -4 6 -13 8 -20 5 -9 -3 -16 6 -21 27 -4 20 -2 33 5 35 16 5 14 22 -3 22 -8 0 -15 14 -18 35 -2 19 0 35 5 35 5 0 4 7 -3 15 -6 8 -9 19 -5 25 9 14 32 13 38 -2 2 -7 8 -9 13 -5 12 11 -24 37 -42 30 -8 -3 -14 1 -14 11 0 9 5 16 11 16 6 0 1 12 -10 26 -14 18 -18 31 -12 38 6 7 6 17 1 26 -5 8 -7 25 -3 37 3 14 1 23 -6 23 -21 0 -12 47 12 59 21 11 21 11 -5 6 -16 -3 -28 -1 -28 5 0 5 7 10 16 10 9 0 14 5 12 11 -2 6 -7 9 -12 7 -14 -5 -28 44 -16 56 13 13 13 29 -1 20 -7 -4 -10 7 -9 32 1 22 1 41 0 44 -5 14 -10 51 -15 103 -4 43 -3 57 6 52 8 -5 9 -1 4 16 -4 13 -12 26 -16 27 -16 6 -10 44 8 58 17 12 17 13 1 19 -26 10 -24 45 2 38 11 -3 20 0 20 6 0 6 -9 11 -20 11 -25 0 -28 9 -34 80 -2 30 -9 67 -14 82 -17 43 -26 148 -13 148 6 0 11 5 11 11 0 6 -7 9 -15 5 -10 -4 -15 1 -15 15 0 16 5 20 20 16 11 -3 23 -1 26 4 3 5 -2 9 -10 9 -9 0 -16 4 -16 10 0 5 -7 7 -15 4 -21 -8 -19 16 3 33 15 13 15 14 0 9 -12 -4 -16 1 -15 17 0 12 6 25 12 29 6 5 4 8 -6 8 -12 0 -20 21 -32 93 -8 50 -16 101 -16 112 0 11 -3 34 -6 51 -5 22 -2 36 11 49 17 17 17 17 -5 10 -23 -7 -24 -6 -19 39 3 26 1 46 -4 46 -5 0 -7 9 -3 19 3 11 2 22 -3 25 -4 2 -7 20 -5 38 2 18 4 47 4 63 0 43 8 65 25 65 8 0 14 5 14 11 0 6 -7 9 -15 5 -16 -6 -18 5 -9 40 4 15 11 20 25 17 10 -3 19 0 19 6 0 6 -6 11 -14 11 -11 0 -12 8 -4 41 12 44 30 58 52 40 7 -6 16 -8 19 -4 9 9 -13 33 -30 33 -20 0 -11 23 15 36 12 6 19 13 16 17 -3 3 4 20 16 37 19 26 24 29 38 18 13 -11 15 -10 10 4 -8 20 11 38 77 71 67 34 164 36 226 4z m75 -142 c7 -27 18 -32 30 -13 4 6 2 14 -4 16 -17 5 -15 22 3 22 8 0 18 -12 21 -27 4 -16 11 -31 17 -34 23 -16 36 -174 15 -182 -10 -4 -10 -8 -2 -14 17 -12 -1 -54 -21 -47 -8 3 -15 2 -15 -3 0 -4 -9 -14 -21 -21 -19 -12 -20 -11 -14 7 4 15 1 20 -15 23 -20 3 -22 10 -23 86 -1 47 2 84 8 86 6 3 2 5 -7 5 -22 1 -24 21 -3 21 8 0 15 6 15 14 0 9 -7 12 -20 9 -29 -8 -25 11 5 23 17 6 22 13 17 22 -6 9 -15 10 -35 3 -19 -7 -28 -6 -37 4 -9 11 -4 14 27 18 21 2 41 4 45 5 4 1 10 -9 14 -23z m-149 -31 c26 -17 65 -69 56 -78 -18 -18 -119 2 -135 27 -31 47 -35 -121 -5 -183 24 -48 71 -100 92 -100 11 0 15 -5 11 -15 -3 -8 -1 -15 4 -15 5 0 11 8 15 19 5 15 20 20 81 26 42 4 77 5 80 2 2 -2 -5 -15 -16 -30 -33 -42 -160 -75 -174 -44 -5 9 -7 9 -12 0 -8 -18 -34 -4 -34 19 0 17 -2 18 -15 8 -12 -10 -19 -10 -27 -2 -9 9 -9 12 0 12 7 0 12 5 12 11 0 8 -5 8 -15 -1 -19 -15 -47 4 -38 26 3 9 -1 14 -11 14 -10 0 -16 7 -14 17 2 10 -3 18 -9 19 -24 3 -25 4 -14 18 9 11 8 15 -5 20 -13 5 -14 9 -4 21 10 12 10 15 -1 16 -10 0 -11 2 -1 6 18 7 15 23 -5 24 -11 0 -13 3 -6 6 8 3 11 14 7 28 -5 20 -1 25 20 31 14 3 26 11 26 16 0 6 -7 8 -15 5 -47 -18 -1 67 48 88 34 15 68 11 104 -11z m583 -5773 c96 -5 243 -17 325 -25 143 -15 551 -47 850 -66 378 -24 1180 -41 1226 -26 30 10 531 27 899 31 212 2 521 6 686 11 402 10 486 -4 567 -90 51 -54 97 -134 97 -170 0 -39 -90 -185 -154 -249 -90 -91 -173 -103 -496 -72 -86 9 -366 20 -630 25 -261 5 -527 14 -590 20 -63 6 -266 10 -450 9 -184 -1 -432 1 -550 5 -129 4 -279 3 -375 -4 -127 -8 -813 -24 -1442 -34 -46 0 -83 2 -83 7 0 4 3 7 8 7 4 0 20 11 35 25 20 19 27 22 27 10 0 -18 13 -19 41 -5 13 7 19 7 19 0 0 -18 48 -11 63 10 13 18 16 19 27 5 7 -8 18 -15 26 -15 8 0 3 11 -12 27 l-26 28 -18 -23 c-21 -25 -40 -29 -40 -7 0 20 -19 19 -42 -2 -17 -15 -18 -15 -18 5 0 30 -11 28 -45 -8 -32 -33 -45 -38 -45 -15 0 24 -27 29 -55 11 -22 -14 -25 -15 -25 -1 0 19 -19 19 -44 0 -11 -8 -29 -12 -43 -9 -12 4 -23 2 -23 -4 0 -5 -7 -12 -15 -16 -11 -4 -9 3 6 23 12 16 19 35 17 42 -2 7 -14 -4 -26 -24 -12 -21 -27 -37 -34 -37 -7 0 -2 -6 12 -13 24 -13 57 -8 101 14 10 4 21 3 28 -4 8 -8 19 -7 42 7 35 20 34 21 43 -16 l6 -28 -145 0 -145 0 44 43 c51 48 62 80 76 217 16 147 -13 245 -101 351 -22 26 -39 48 -39 50 0 4 110 -1 440 -20z m-536 13 c9 -3 12 -12 8 -22 -5 -15 -3 -15 10 -4 14 11 21 11 43 -4 33 -22 77 -81 52 -71 -9 3 -19 2 -22 -3 -3 -5 -26 -8 -50 -7 l-45 2 25 18 c32 24 32 37 -1 37 -22 0 -24 -3 -15 -14 10 -12 8 -17 -8 -26 -12 -6 -21 -17 -21 -25 0 -21 -30 -19 -46 3 -12 15 -13 15 -14 1 0 -9 7 -22 15 -29 8 -7 15 -9 15 -5 0 5 3 6 6 3 3 -4 0 -17 -7 -30 -15 -27 -16 -30 -25 -130 -9 -100 5 -139 47 -134 16 1 32 6 36 9 3 4 29 6 57 6 28 -1 43 -3 34 -6 -20 -5 -24 -19 -8 -25 15 -5 0 -68 -16 -68 -8 0 -14 -6 -14 -14 0 -19 -39 -31 -53 -17 -15 15 -27 14 -27 -4 0 -21 -23 -19 -53 5 -14 11 -30 20 -36 20 -15 0 -14 23 2 39 10 10 6 11 -17 5 -21 -5 -27 -4 -22 5 4 6 3 11 -3 11 -18 0 -50 75 -54 129 -3 37 -1 51 9 51 7 0 16 5 19 11 4 6 0 9 -11 7 -14 -2 -18 2 -16 17 2 11 7 21 12 23 4 2 6 16 4 31 -6 34 24 104 63 149 22 26 65 50 110 62 1 0 8 -3 17 -6z');

        pergamino_image
            .append('path')
                .attr('d',"M5394 6664 l-6 -25 -23 21 c-22 21 -24 21 -33 4 -10 -18 -11 -18 -30 0 -22 19 -53 19 -60 -2 -3 -9 3 -11 22 -6 16 4 26 2 26 -5 0 -5 9 -15 20 -21 17 -9 22 -7 28 11 8 21 10 21 36 -14 32 -42 48 -40 39 3 -8 45 9 37 66 -27 27 -32 53 -54 57 -50 4 3 0 28 -8 54 -9 27 -14 50 -12 52 14 15 104 -102 104 -136 0 -12 5 -23 10 -23 14 0 13 36 -1 63 -29 54 -107 127 -138 127 -13 0 -11 -19 5 -67 4 -10 -12 1 -36 25 -24 23 -47 42 -51 42 -5 0 -12 -12 -15 -26z");

        pergamino_image
            .append('path')
                .attr('d', "M877 6324 c-4 -4 -7 -20 -7 -35 0 -40 -10 -59 -31 -59 -10 0 -24 -8 -31 -18 -7 -10 -21 -21 -30 -25 -27 -10 -22 -30 5 -21 12 4 37 6 55 5 25 -1 40 6 64 29 l30 31 -7 -37 -6 -37 42 37 c50 42 63 45 55 11 -8 -31 -3 -31 36 -4 30 22 39 19 51 -16 2 -6 15 -4 33 5 16 8 32 16 37 18 4 2 7 -7 7 -19 l0 -23 20 21 c10 12 33 24 49 28 30 6 71 -8 71 -24 0 -24 32 -17 59 11 28 30 30 30 52 14 33 -23 47 -20 16 4 -33 26 -49 25 -77 -5 -23 -25 -24 -25 -44 -6 -29 25 -61 32 -98 19 -22 -8 -36 -8 -48 0 -14 9 -22 7 -36 -9 -22 -25 -34 -24 -34 2 0 22 0 22 -62 2 -10 -3 -18 0 -18 6 0 16 -31 13 -54 -4 -29 -22 -32 -19 -28 20 5 44 -8 45 -31 2 -18 -33 -57 -66 -57 -48 0 6 4 12 9 16 11 6 25 87 19 105 -2 6 -7 8 -11 4z");

        pergamino_image
            .append('path')
                .attr('d', "M812 762 c-7 -2 -12 -13 -12 -25 l-1 -22 -18 23 c-20 23 -31 28 -31 13 0 -12 47 -61 60 -61 5 0 10 9 10 20 0 30 13 24 34 -15 11 -19 26 -41 34 -48 13 -10 14 -7 10 21 -7 47 4 40 35 -24 30 -61 53 -64 44 -7 -6 33 -5 34 12 19 20 -18 31 -12 31 16 0 10 5 18 10 18 6 0 10 -6 10 -12 0 -7 12 -26 26 -43 l25 -30 -5 41 c-5 32 -1 47 13 65 l19 24 29 -27 c33 -32 53 -36 53 -11 0 14 3 13 16 -5 19 -27 34 -28 34 -2 0 11 7 20 15 20 8 0 12 6 9 14 -7 19 -34 9 -34 -12 0 -13 -3 -12 -21 4 -17 16 -22 16 -30 4 -8 -13 -13 -11 -29 8 -15 18 -25 22 -42 17 -33 -11 -48 -25 -48 -47 0 -10 -4 -16 -10 -13 -5 3 -10 15 -10 25 0 32 -19 32 -39 0 l-19 -32 -7 41 c-10 59 -25 50 -25 -15 0 -64 -11 -64 -41 2 -21 44 -49 59 -49 27 -1 -15 -5 -13 -23 8 -13 14 -28 24 -35 21z");

        pergamino_image
            .append('path')
                .attr('d', "M5495 660 c-4 -6 -1 -17 5 -25 15 -18 -1 -20 -17 -4 -18 18 -43 2 -43 -28 l0 -27 -34 33 c-38 37 -69 38 -74 3 -4 -29 -16 -28 -31 4 -10 23 -16 26 -45 21 -19 -3 -38 -1 -44 5 -8 8 -16 7 -27 -2 -12 -10 -21 -10 -38 -1 -15 7 -54 9 -117 6 -52 -3 -129 -7 -170 -8 -41 -2 -99 -4 -128 -5 -30 -1 -51 -6 -47 -11 5 -9 152 -7 333 5 69 5 100 3 118 -7 18 -9 30 -10 42 -2 12 7 22 7 35 -1 12 -8 22 -8 37 2 18 11 22 9 38 -18 20 -36 55 -38 60 -2 4 29 8 28 54 -13 42 -38 58 -38 58 1 0 31 20 31 50 -1 13 -14 27 -25 32 -25 13 0 9 34 -8 58 -41 60 55 -4 103 -68 41 -54 53 -61 53 -29 0 25 -106 138 -128 137 -10 -1 -27 2 -39 6 -12 4 -24 2 -28 -4z");

        pergamino_image
            .append('path')
                .attr('d', "M5566 245 c-4 -14 -14 -25 -22 -25 -9 0 -34 -16 -55 -35 -22 -19 -48 -35 -59 -35 -25 0 -25 4 2 40 12 16 18 33 13 37 -4 5 -10 2 -12 -5 -3 -7 -16 -25 -29 -40 l-24 -27 6 33 c8 39 1 40 -38 7 -40 -34 -60 -33 -52 2 7 28 7 28 -17 10 -37 -27 -90 -49 -105 -43 -8 3 -14 14 -14 25 0 18 -2 19 -27 5 -34 -17 -48 -18 -72 -2 -15 9 -26 9 -46 0 -20 -10 -31 -10 -41 -1 -10 8 -22 8 -45 0 -47 -16 -168 -13 -223 5 -35 12 -53 14 -69 6 -21 -10 -21 -11 4 -11 15 -1 46 -8 70 -17 28 -10 61 -14 90 -10 25 2 51 1 59 -4 8 -5 27 -2 47 8 28 13 37 14 55 3 16 -10 26 -10 49 -1 21 9 33 9 42 1 9 -7 24 -8 48 -1 45 13 49 13 49 -5 0 -18 47 -20 84 -4 19 9 29 9 39 1 9 -8 24 -9 48 -2 18 6 34 10 35 10 1 0 4 -9 7 -21 5 -17 9 -19 26 -10 11 6 22 7 25 2 3 -5 30 -3 61 4 60 14 90 40 100 88 9 36 0 47 -9 12z");


        pergamino_text =
            pergamino_container
                .append('g')
                    .attr('class', 'text_pergamino')
                    .attr('width', 200)
                    .attr('opacity', 0);

        pergamino_text
            .append('text')
                .attr('font-size',16)
                .attr('id', 'pp_name')
                .attr('font-weight', "bold")
                .attr('font-style', "oblique")
                .attr('x',60)
                .attr('y',150)
            .text('Peace process:');

        pergamino_text
            .append('text')
                .attr('font-size',16)
                .attr('id', 'pp_name_value')
                .attr('font-weight', "normal")
                .attr('font-style', "normal")
                .attr('x',60)
                .attr('y',170)
            .text('')
                .attr('class', 'pp_name_value');

        pergamino_text
                .append('text')
                    .attr('font-size',16)
                    .attr('id', 'agt_type')
                    .attr('font-weight', "bold")
                    .attr('font-style', "oblique")
                    .attr('x',60)
                    .attr('y',112)
                .text('Type: ')
                .append('tspan')
                    .text((d, i) => '')
                    .attr('font-weight', "normal")
                    .attr('font-style', "normal")
                    .attr('class', 'agt_type_value');

        pergamino_text
                .append('text')
                    .attr('font-size',16)
                    .attr('class', 'agt_date')
                    .attr('id', 'agt_date')
                    .attr('font-weight', "bold")
                    .attr('font-style', "oblique")
                    .attr('x',60)
                    .attr('y',82)
                .text('Date: ')
                .append('tspan')
                    .text('')
                    .attr('font-weight', "normal")
                    .attr('font-style', "normal")
                    .attr('class', 'agt_date_value');

        pergamino_text
            .append('text')
                .attr('font-size',16)
                .attr('id', 'agt')
                .attr('font-weight', "bold")
                .attr('font-style', "oblique")
                .attr('x',60)
                .attr('y',215)
            .text('Peace agreement:');

        pergamino_text
                .append('text')
                    .attr('font-size',16)
                    .attr('id', 'agt_value')
                    .attr('font-weight', "normal")
                    .attr('font-style', "normal")
                    .attr('x',60)
                    .attr('y',235)
                    .attr('width', 300)
                .text('')
                    .attr('class', 'agt_value')
    };
    create_agreement()

    const renderAgreement = () => {

        if (is_pergamino_showed == true){

            d3.selectAll('text.pp_name_value')
                .data(data_pax_chart.filter(d => selected_reason == d.reason).filter(d => selected_agreement == d.AgtId))
                .text((d, i) => d.PPName)
                .call(wrap, 250);

            d3.selectAll('tspan.agt_type_value')
                .data(data_pax_chart.filter(d => selected_reason == d.reason).filter(d => selected_agreement == d.AgtId))
                .text((d, i) => d.Agtp);

            d3.selectAll('tspan.agt_date_value')
                .data(data_pax_chart.filter(d => selected_reason == d.reason).filter(d => selected_agreement == d.AgtId))
                .text((d, i) => parseDate(d.Dat));

            d3.selectAll('text.agt_value')
                .data(data_pax_chart.filter(d => selected_reason == d.reason).filter(d => selected_agreement == d.AgtId))
                .text((d, i) =>'" ' + d.Agt + ' "')
                .call(wrap, 250);


            if(is_pergamino_closed == true){

                d3.selectAll('.image_pergamino')
                    .transition().duration(1600)
                        .attr('opacity', 1)
                        .attr('transform', "scale(0.06, 0.066)");

                d3.selectAll('.text_pergamino')
                    .transition().delay(500).duration(1600)
                        .attr('opacity', 1);

                /*Flags*/
                d3.selectAll('img.flag_country_1')
                    .attr('src', (r,i) => (selected_agreement_countries.length == 1)
                            ? GLOBAL_PATH + '/static/21VYZ/Assets/country_flags/'+selected_agreement_countries+'.svg'
                            : '')
                        .style('opacity', 0)
                    .transition().delay(500).duration(2000)
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 1) ? 1 : 0);

                d3.selectAll('p.text_country_1')
                    .text((r,i) => (selected_agreement_countries.length == 1)
                            ? ((selected_agreement_countries=="RKS")
                                ? 'Kosovo'
                                : data_country.features.filter(s => s.properties.iso_a3 == selected_agreement_countries).map(s => s.properties.name))
                            : '')
                        .style('opacity', 0)
                    .transition().delay(500).duration(2000)
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 1) ? 1 : 0);

                d3.selectAll('img.flag_country_1_1')
                    .attr('src', (r,i) => (selected_agreement_countries.length == 2)
                            ? GLOBAL_PATH + '/static/21VYZ/Assets/country_flags/'+selected_agreement_countries[0]+'.svg'
                            : '')
                        .style('opacity', 0)
                    .transition().delay(500).duration(2000)
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 1 : 0);

                d3.selectAll('img.flag_country_1_2')
                    .attr('src', (r,i) => (selected_agreement_countries.length == 2)
                            ? GLOBAL_PATH + '/static/21VYZ/Assets/country_flags/'+selected_agreement_countries[1]+'.svg'
                            : '')
                        .style('opacity', 0)
                    .transition().delay(500).duration(2000)
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 1 : 0);

                d3.selectAll('p.text_country_1_1')
                    .text((r,i) => (selected_agreement_countries.length == 2)
                            ? ((selected_agreement_countries[1]=="RKS")
                                ? 'Kosovo'
                                : data_country.features.filter(s => s.properties.iso_a3 == selected_agreement_countries[1]).map(s => s.properties.name))
                            : '')
                        .style('opacity', 0)
                    .transition().delay(1200).duration(500)
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 1 : 0);

                d3.selectAll('p.text_country_1_2')
                    .text((r,i) => (selected_agreement_countries.length == 2)
                            ? ((selected_agreement_countries[0]=="RKS")
                                ? 'Kosovo'
                                : data_country.features.filter(s => s.properties.iso_a3 == selected_agreement_countries[0]).map(s => s.properties.name))
                            : '')
                        .style('opacity', 0)
                    .transition().delay(1200).duration(500)
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 1 : 0);


                d3.selectAll('p.text_multi_country')
                        .style('opacity', 0)
                    .transition().delay(1200).duration(500)
                        .style('opacity', (r,i) => (selected_agreement_countries.length > 2) ? 1 : 0);


                const show_icon = () => {
                    $("a.download_icon")
                        .attr('href', 'https://peaceagreements.org/masterdocument/'+selected_agreement)
                        .css('visibility', 'visible')
                };

                d3.selectAll('img.download_image')
                            .style('opacity', 0)
                        .transition().delay(500).duration(1000)
                            .style('opacity', 0.9);

                setTimeout(show_icon, 500);

                is_pergamino_closed = false;

            }
            else{


                /*Flags*/
                d3.selectAll('img.flag_country_1')
                    .transition().duration(300)
                        .style('opacity',(r,i) => (selected_agreement_countries.length == 1) ? 0.3 : 0)
                    .transition().duration(500)
                        .attr('src', (r,i) => (selected_agreement_countries.length == 1)
                            ? GLOBAL_PATH + '/static/21VYZ/Assets/country_flags/'+selected_agreement_countries+'.svg'
                            : '')
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 1) ? 1 : 0);


                d3.selectAll('p.text_country_1')
                    .transition().duration(300)
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 1) ? 0.3 : 0)
                    .transition().duration(500)
                        .text((r,i) => (selected_agreement_countries.length == 1)
                            ? ((selected_agreement_countries=="RKS")
                                ? 'Kosovo'
                                : data_country.features.filter(s => s.properties.iso_a3 == selected_agreement_countries).map(s => s.properties.name))
                            : '')
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 1) ? 1 : 0);


                d3.selectAll('img.flag_country_1_1')
                    .transition().duration(300)
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 0.3 : 0)
                    .transition().duration(500)
                        .attr('src', (r,i) => (selected_agreement_countries.length == 2)
                                ? GLOBAL_PATH + '/static/21VYZ/Assets/country_flags/'+selected_agreement_countries[0]+'.svg'
                                : '')
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 1 : 0);

                d3.selectAll('img.flag_country_1_2')
                    .transition().duration(300)
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 0.3 : 0)
                    .transition().duration(500)
                        .attr('src', (r,i) => (selected_agreement_countries.length == 2)
                                ? GLOBAL_PATH + '/static/21VYZ/Assets/country_flags/'+selected_agreement_countries[1]+'.svg'
                                : '')
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 1 : 0);

                d3.selectAll('p.text_country_1_1')
                    .transition().duration(300)
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 0.3 : 0)
                    .transition().duration(500)
                        .text((r,i) => (selected_agreement_countries.length == 2)
                                ? ((selected_agreement_countries[1]=="RKS")
                                    ? 'Kosovo'
                                    : data_country.features.filter(s => s.properties.iso_a3 == selected_agreement_countries[1]).map(s => s.properties.name))
                                : '')
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 1 : 0);

                d3.selectAll('p.text_country_1_2')
                    .transition().duration(300)
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 0.3 : 0)
                    .transition().duration(500)
                        .text((r,i) => (selected_agreement_countries.length == 2)
                                ? ((selected_agreement_countries[0]=="RKS")
                                    ? 'Kosovo'
                                    : data_country.features.filter(s => s.properties.iso_a3 == selected_agreement_countries[0]).map(s => s.properties.name))
                                : '')
                        .style('opacity', (r,i) => (selected_agreement_countries.length == 2) ? 1 : 0);


                d3.selectAll('p.text_multi_country')
                        .style('opacity', 0)
                    .transition().duration(500)
                        .style('opacity', (r,i) => (selected_agreement_countries.length > 2) ? 1 : 0);


                const show_icon = () => {

                    $("a.download_icon")
                        .attr('href', 'https://peaceagreements.org/masterdocument/'+selected_agreement)
                        .css('visibility', 'visible')};
                setTimeout(show_icon, 100);

            }

        } else{

            d3.selectAll('.image_pergamino')
                .transition().duration(1600)
                    .attr('opacity', 0)
                    .attr('transform', "scale(0.06, 0)");

            d3.selectAll('.text_pergamino')
                .transition().duration(1000)
                    .attr('opacity', 0);


            const hide_icon = () => {

                $("a.download_icon")
                    .attr('href', '')
                    .css('visibility', 'hidden');

            };

            setTimeout( hide_icon, 1000);

            is_pergamino_closed = true;


            /*Flags*/

            selected_agreement_countries=null;

            d3.selectAll('img.download_image')
                    .style('opacity', 0.9)
                .transition().duration(400)
                    .style('opacity', 0);

            d3.selectAll('img.flag_country_1')
                .transition().duration(800)
                    .style('opacity', 0)
                .transition().duration(10)
                    .attr('src', '');

            d3.selectAll('p.text_country_1')
                .transition().duration(800)
                    .style('opacity', 0)
                .transition().duration(10)
                    .text('');

            d3.selectAll('img.flag_country_1_1')
                .transition().duration(800)
                    .style('opacity', 0)
                .transition().duration(10)
                    .attr('src', '');

            d3.selectAll('img.flag_country_1_2')
                .transition().duration(800)
                    .style('opacity', 0)
                .transition().duration(10)
                    .attr('src', '');

            d3.selectAll('p.text_country_1_1')
                .transition().duration(800)
                    .style('opacity', 0)
                .transition().duration(10)
                    .text('');

            d3.selectAll('p.text_country_1_2')
                .transition().duration(800)
                    .style('opacity', 0)
                .transition().duration(10)
                    .text('');

            d3.selectAll('p.text_multi_country')
                .transition().duration(800)
                    .style('opacity', 0);
        }

    };


}).catch(function(err) {
    console.log('Error loading data')
});