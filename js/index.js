
require([
    "dojo/_base/lang",
    'dojo/_base/array',
    "esri/Map",
    "esri/WebMap",
    "esri/request",
    "esri/geometry/Extent",
    "esri/layers/support/LabelClass",
    "esri/layers/FeatureLayer",
    "esri/views/MapView",
    "esri/core/promiseUtils",
    "esri/widgets/Legend",
    "esri/widgets/Home",
    "esri/widgets/Slider",
    "esri/widgets/Fullscreen",
    "esri/widgets/Expand",
], function (
    lang,
    array,
    Map,
    WebMap,
    esriRequest,
    Extent,
    LabelClass,
    FeatureLayer,
    MapView,
    promiseUtils,
    Legend,
    Home,
    Slider,
    Fullscreen,
    Expand
) {
    //--------------------------------------------------------------------------
    //
    //  Setup Map and View
    //
    //--------------------------------------------------------------------------

    var chart;

    // Get date
    // var today = new Date();
    // var _today = "'" + today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate() + " 00:00:00'";

    // var yesterday = new Date();
    // var _yesterday = "'" + yesterday.getFullYear() + "-" + (yesterday.getMonth() + 1) + "-" + (yesterday.getDate() - 1 + " 00:00:00'");
        var today = new Date(new Date().setHours(0, 0, 0, 0));
        var yesterday = new Date(new Date().setHours(-24, 0, 0, 0));

    var _today = new Date(new Date().setHours(0, 0, 0, 0));
    var _yesterday = new Date(new Date().setHours(-24, 0, 0, 0));


    var labelClass = {
        // autocasts as new LabelClass()
        symbol: {
            type: "text",  // autocasts as new TextSymbol()
            color: [
                51,
                51,
                51,
                255
            ],
            haloSize: 0.75,
            haloColor: [
                255,
                255,
                255,
                255
            ],
            font: {
                size: 9.75,
                style: "normal",
                decoration: "none",
                weight: "bold",
                family: "Arial"
            }
        },
        labelPlacement: "always-horizontal",
        labelExpressionInfo: {
            expression: "Round( ($feature.CasosConfirmados * 100000) / $feature.Habitantes )"
        }
    };

    var defaultSym = {
        type: "simple-fill", // autocasts as new SimpleFillSymbol()
        outline: {
            // autocasts as new SimpleLineSymbol()
            color: [194,
                194,
                194,
                64],
            width: "0.5px"
        }
    };

    var renderer = {
        type: "simple", // autocasts as new SimpleRenderer()
        symbol: defaultSym,
        label: "Afectados por cada 100.000 habitantes",
        visualVariables: [
            {
                type: "color",
                // field: "CasosConfirmados",
                valueExpression: "($feature.CasosConfirmados * 100000) / $feature.Habitantes",
                stops: [
                    {
                        "value": 30,
                        "color": [
                            255,
                            252,
                            212,
                            255
                        ],
                        "label": "< 30"
                    },
                    {
                        "value": 133.5,
                        "color": [
                            177,
                            205,
                            194,
                            255
                        ],
                        "label": null
                    },
                    {
                        "value": 297,
                        "color": [
                            98,
                            158,
                            176,
                            255
                        ],
                        "label": "297"
                    },
                    {
                        "value": 431.5,
                        "color": [
                            56,
                            98,
                            122,
                            255
                        ],
                        "label": null
                    },
                    {
                        "value": 566,
                        "color": [
                            13,
                            38,
                            68,
                            255
                        ],
                        "label": "> 566"
                    }
                ]
            }
        ]
    }

    var url = new URL(window.location.href);
    if (url.search != "") {
        if (url.searchParams.get("ccaa") != null) {
            var ccaa = url.searchParams.get("ccaa");
            var _ccaa = " AND CCAA = " + ccaa
        }
        else {
            var _ccaa = ""
        }
    }
    else {
        var _ccaa = ""
    }

    var layer = new FeatureLayer({
        portalItem: {
            // id: "2900a255ae0f47779bf9b2036e9d0d87"
            id: "9ec5c536afd643459e5bf40c71124a03"
        },
        // definitionExpression: "Fecha >= DATE " + _yesterday + " AND Fecha <= DATE " + _today + _ccaa + "",
        definitionExpression: "HoraActualizacion >= DATE " + _yesterday + " AND HoraActualizacion <= DATE " + _today + _ccaa + "",

        title: "Cifras afectados COVID-19 por provincia",
        outFields: ["*"],
        visible: true,
        labelingInfo: [labelClass],
        renderer: renderer,
        popupEnabled: false,
    });

    // layer.queryExtent

    var map = new Map({
        basemap: {
            portalItem: {
                id: "02ef9624f4ee403d8f4c723fcf8c1bbf"
            }
        },
        layers: [layer]
    });

    var view = new MapView({
        map: map,
        container: "viewDiv",
        center: [-6, 40],
        zoom: window.screen.availHeight < 800 ? 3 : 5,
        constraints: {
            minZoom: window.screen.availHeight < 800 ? 3 : 5,
            snapToZoom: false
        },
        // This ensures that when going fullscreen
        // The top left corner of the view extent
        // stays aligned with the top left corner
        // of the view's container
        resizeAlign: "top-left"
    });

    var view2 = new MapView({
        map: map,
        container: "islandDiv",
        center: [-15.90309972564007, 28.477520596071557],
        zoom: 5,
        constraints: {
            minZoom: 3,
            snapToZoom: false
        },
        // This ensures that when going fullscreen
        // The top left corner of the view extent
        // stays aligned with the top left corner
        // of the view's container
        // resizeAlign: "top-left"
    });
    view2.ui.components = [];
    view.ui.add("islandDiv", "bottom-left")

    //--------------------------------------------------------------------------
    //
    //  Setup UI
    //
    //--------------------------------------------------------------------------

    var applicationDiv = document.getElementById("applicationDiv");
    var sliderDay = document.getElementById("sliderDay");
    var sliderValue = document.getElementById("sliderValue");
    var playButton = document.getElementById("playButton");
    var titleDiv = document.getElementById("titleDiv");
    var animation = null;

    var slider = new Slider({
        container: "slider",
        max: today.getTime(),
        min: 1585519200000,  // 30  marzo
        values: [1585519200000],
        step: 2678400000,
        rangeLabelsVisible: true,
        visibleElements: {
            labels: true,
            rangeLabels: true
        },
        labelsVisible: true
    });

    slider.labelFormatFunction = function (value, type) {
        return new Date(value).getDate() + " de " + getMonth(value)
    }

    // When user drags the slider:
    //  - stops the animation
    //  - set the visualized year to the slider one.
    function inputHandler(event) {
        stopAnimation();
        setYear(event.value);
    }
    slider.on("thumb-drag", inputHandler);

    // Toggle animation on/off when user
    // clicks on the play button
    playButton.addEventListener("click", function () {
        if (playButton.classList.contains("toggled")) {
            stopAnimation();
        } else {
            startAnimation();
        }
    });

    // Add Home, Legend and FullScreen widgets
    view.ui.empty("top-left");
    view.ui.add(titleDiv, "top-left");
    view.ui.add(
        new Home({
            view: view
        }),
        "top-left"
    );
    view.ui.add(
        new Fullscreen({
            view: view,
            element: applicationDiv
        }),
        "top-right"
    );

    view.ui.add(
        new Expand({
            content: new Legend({
                view: view,
                style: {
                    type: "classic"
                },
            }),
            id: "legendExpand",
            view: view,
            expanded: view.width < 600 ? false : true
        }),
        "top-left"
    );

    // view.ui.add([charts], "bottom-right");
    var historicData = new Expand({
        content: charts
    });
    view.ui.add(historicData, "bottom-right");


    view.watch("width", lang.hitch(this, function (newVal) {
        if (newVal <= 600) {
            // clear the view's default UI components if
            // app is used on a small device
            view.ui.components = ["attribution"];
            if (view.ui.find("legendExpand").expanded == true) {
                view.ui.find("legendExpand").collapse();
            }
        }
        else {
            view.ui.find("legendExpand").expand()
            view.ui.components = ["attribution", "navigation-toggle", "compass", "zoom"];

        }
    }));

    view.watch("height", lang.hitch(this, function (newVal) {
        if (newVal <= 750) {
            view.constraints.minZoom = 3
        }
        else {
            view.constraints.minZoom = 5
        }
    }))

    // When the layerview is available, setup hovering interactivity
    view.whenLayerView(layer).then(lang.hitch(this, function (layerview) {
        // Si hay parámetro de CCAA, cambiamos extent
        var _query = {
            spatialRelationship: "intersects",
            where: "CCAA = " + ccaa,
            returnQueryGeometry: true
        }
        if (ccaa && ccaa != undefined) {
            layerview.layer.queryExtent(_query).then(lang.hitch(this, function (evt) {
                view.extent = evt.extent
            }))
            document.getElementById('islandDiv').style.display = "none";
        }
        //

        var query = {
            outFields: ["*"],
            returnGeometry: false,
            spatialRelationship: "intersects",
            where: "1=1"
        };


        layerview.layer.queryFeatures(query).then(lang.hitch(this, function (result) {
            this.result = result;
        }));

        function setupHoverTooltip(layerview) {
            var highlight;

            var tooltip = createTooltip();

            var hitTest = promiseUtils.debounce(function (event) {
                return view.hitTest(event).then(function (hit) {
                    var results = hit.results.filter(function (result) {
                        return result.graphic.layer === layer;

                    });

                    if (!results.length) {
                        return null;
                    }

                    return {
                        graphic: results[0].graphic,
                        screenPoint: hit.screenPoint
                    };
                });
            });

            var hitTest2 = promiseUtils.debounce(function (event) {
                return view2.hitTest(event).then(function (hit) {
                    var results = hit.results.filter(function (result) {
                        return result.graphic.layer === layer;

                    });

                    if (!results.length) {
                        return null;
                    }

                    return {
                        graphic: results[0].graphic,
                        screenPoint: hit.screenPoint
                    };
                });
            });

            view.on("pointer-move", function (event) {
                return hitTest(event).then(
                    function (hit) {
                        // remove current highlighted feature
                        if (highlight) {
                            highlight.remove();
                            highlight = null;
                        }

                        // highlight the hovered feature
                        // or hide the tooltip
                        if (hit) {
                            // Query for chart
                            // var query = {
                            //     outFields: ["*"],
                            //     returnGeometry: false,
                            //     spatialRelationship: "intersects",
                            //     where: "ine_code = " + hit.graphic.attributes.ine_code
                            // };
                            // layerview.layer.queryFeatures(query).then(lang.hitch(this, function (result) {
                            //     debugger
                            // }))

                            var graphic = hit.graphic;
                            var screenPoint = hit.screenPoint;

                            highlight = layerview.highlight(graphic);

                            tooltip.show(
                                screenPoint,

                                "<b>" + graphic.getAttribute("Texto") + "  (" + graphic.getAttribute("NombreCCAA") + ")  " + new Date(graphic.getAttribute("Fecha")).toLocaleDateString() + "</b><br><br>" +
                                "<table>" +
                                "<tr>" +
                                "<td>Casos confirmados: </td>" +
                                "<td><b>" + isNegative(graphic.getAttribute("CasosConfirmados")) + "</b></td>" +
                                "</tr>" +
                                "<tr>" +
                                "<td>Hospitalizados: </td>" +
                                "<td><b>" + isNegative(graphic.getAttribute("Hospitalizados")) + "</b></td>" +
                                "</tr>" +
                                "<tr>" +
                                "<td>Recuperados: </td>" +
                                "<td><b>" + isNegative(graphic.getAttribute("Recuperados")) + "</b></td>" +
                                "</tr>" +
                                "<tr>" +
                                "<td>Fallecimientos: </td>" +
                                "<td><b>" + isNegative(graphic.getAttribute("Fallecidos")) + "</b></td>" +
                                "</tr>" +
                                "<tr>" +
                                "<td>Casos en UCI: </td>" +
                                "<td><b>" + isNegative(graphic.getAttribute("UCI")) + "</b></td>" +
                                "</tr>" +
                                "<td>Tipo de fuente: </td>" +
                                "<td><b>" + isNull(graphic.getAttribute("TipoFuente")) + "</b></td>" +
                                "</tr>" +

                                "</table>" +
                                "<br><br><i>Clic para ver histórico</i>"
                            );

                        } else {
                            tooltip.hide();
                            // view.popup.close()
                        }
                    },
                    function () { }
                );
            });

            view2.on("pointer-move", function (event) {
                return hitTest2(event).then(
                    function (hit) {
                        // remove current highlighted feature
                        if (highlight) {
                            highlight.remove();
                            highlight = null;
                        }

                        // highlight the hovered feature
                        // or hide the tooltip
                        if (hit) {
                            // Query for chart
                            // var query = {
                            //     outFields: ["*"],
                            //     returnGeometry: false,
                            //     spatialRelationship: "intersects",
                            //     where: "ine_code = " + hit.graphic.attributes.ine_code
                            // };
                            // layerview.layer.queryFeatures(query).then(lang.hitch(this, function (result) {
                            //     debugger
                            // }))

                            var graphic = hit.graphic;
                            var screenPoint = hit.screenPoint;
                            screenPoint.y = screenPoint.y + 500

                            highlight = layerview.highlight(graphic);

                            tooltip.show(
                                screenPoint,

                                "<b>" + graphic.getAttribute("Texto") + "  (" + graphic.getAttribute("NombreCCAA") + ")  " + new Date(graphic.getAttribute("Fecha")).toLocaleDateString() + "</b><br><br>" +
                                "<table>" +
                                "<tr>" +
                                "<td>Casos confirmados: </td>" +
                                "<td><b>" + isNegative(graphic.getAttribute("CasosConfirmados")) + "</b></td>" +
                                "</tr>" +
                                "<tr>" +
                                "<td>Hospitalizados: </td>" +
                                "<td><b>" + isNegative(graphic.getAttribute("Hospitalizados")) + "</b></td>" +
                                "</tr>" +
                                "<tr>" +
                                "<td>Recuperados: </td>" +
                                "<td><b>" + isNegative(graphic.getAttribute("Recuperados")) + "</b></td>" +
                                "</tr>" +
                                "<tr>" +
                                "<td>Fallecimientos: </td>" +
                                "<td><b>" + isNegative(graphic.getAttribute("Fallecidos")) + "</b></td>" +
                                "</tr>" +
                                "<tr>" +
                                "<td>Casos en UCI: </td>" +
                                "<td><b>" + isNegative(graphic.getAttribute("UCI")) + "</b></td>" +
                                "</tr>" +
                                "<td>Tipo de fuente: </td>" +
                                "<td><b>" + isNull(graphic.getAttribute("TipoFuente")) + "</b></td>" +
                                "</tr>" +

                                "</table>" +
                                "<br><br><i>Clic para ver histórico</i>"
                            );

                        } else {
                            tooltip.hide();
                            // view.popup.close()
                        }
                    },
                    function () { }
                );
            });

            view.on("click", function (event) {
                // Refresh data of 3 variables
                if (chart != undefined) {
                    chart.data.datasets[0].data = [];
                    chart.data.datasets[1].data = [];
                    chart.data.datasets[2].data = [];

                    chart.update();
                }
                return hitTest(event).then(
                    function (hit) {
                        if (hit) {
                            historicData.expand();

                            var graphic = hit.graphic;

                            var _arrayFilter = array.filter(this.result.features, function (item) {
                                return (item.attributes.CodigoProv == graphic.attributes.CodigoProv && item.attributes.Fecha <= graphic.attributes.Fecha)
                            });
                            var arrayFilter = _arrayFilter.sort(function (a, b) {
                                return a.attributes.Fecha - b.attributes.Fecha
                            })

                            var arrayConfirmedCases = [];
                            var arrayRecovered = [];
                            var arrayDeceased = [];
                            var arrayDates = [];
                            for (i = 0; i < arrayFilter.length; i++) {
                                arrayConfirmedCases.push(arrayFilter[i].attributes.CasosConfirmados)
                                arrayRecovered.push(arrayFilter[i].attributes.Recuperados)
                                arrayDeceased.push(arrayFilter[i].attributes.Fallecidos)
                                arrayDates.push(new Date(arrayFilter[i].attributes.Fecha).toLocaleDateString())
                            }

                            var config = {
                                type: 'line',
                                data: {
                                    labels: arrayDates,
                                    datasets: [{
                                        label: 'Casos confirmados',
                                        fill: false,
                                        backgroundColor: "blue",
                                        borderColor: "blue",
                                        data: arrayConfirmedCases
                                    },
                                    {
                                        label: 'Recuperados',
                                        backgroundColor: "green",
                                        borderColor: "green",
                                        data: arrayRecovered,
                                        fill: false,
                                    },
                                    {
                                        label: 'Fallecidos',
                                        backgroundColor: "red",
                                        borderColor: "red",
                                        data: arrayDeceased,
                                        fill: true,
                                    }
                                    ]
                                },
                                options: {
                                    responsive: true,
                                    title: {
                                        display: true,
                                        text: graphic.getAttribute('Texto')
                                    },
                                    tooltips: {
                                        mode: 'index',
                                        intersect: false,
                                    },
                                    hover: {
                                        mode: 'nearest',
                                        intersect: true
                                    },
                                    scales: {
                                        xAxes: [{
                                            display: true,
                                            scaleLabel: {
                                                display: false,
                                                labelString: 'Mes'
                                            }
                                        }],
                                        yAxes: [{
                                            display: true,
                                            scaleLabel: {
                                                display: true,
                                                labelString: 'Casos'
                                            }
                                        }]
                                    }
                                }
                            };

                            chart = new Chart(document.getElementById('resultCanvas').getContext("2d"), config)

                        }
                    }
                )
            })

            view2.on("click", function (event) {
                // Refresh data of 3 variables
                if (chart != undefined) {
                    chart.data.datasets[0].data = [];
                    chart.data.datasets[1].data = [];
                    chart.data.datasets[2].data = [];

                    chart.update();
                }
                return hitTest2(event).then(
                    function (hit) {
                        if (hit) {
                            historicData.expand();

                            var graphic = hit.graphic;

                            var _arrayFilter = array.filter(this.result.features, function (item) {
                                return (item.attributes.CodigoProv == graphic.attributes.CodigoProv && item.attributes.Fecha <= graphic.attributes.Fecha)
                            });
                            var arrayFilter = _arrayFilter.sort(function (a, b) {
                                return a.attributes.Fecha - b.attributes.Fecha
                            })

                            var arrayConfirmedCases = [];
                            var arrayRecovered = [];
                            var arrayDeceased = [];
                            var arrayDates = [];
                            for (i = 0; i < arrayFilter.length; i++) {
                                arrayConfirmedCases.push(arrayFilter[i].attributes.CasosConfirmados)
                                arrayRecovered.push(arrayFilter[i].attributes.Recuperados)
                                arrayDeceased.push(arrayFilter[i].attributes.Fallecidos)
                                arrayDates.push(new Date(arrayFilter[i].attributes.Fecha).toLocaleDateString())
                            }

                            var config = {
                                type: 'line',
                                data: {
                                    labels: arrayDates,
                                    datasets: [{
                                        label: 'Casos confirmados',
                                        fill: false,
                                        backgroundColor: "blue",
                                        borderColor: "blue",
                                        data: arrayConfirmedCases
                                    },
                                    {
                                        label: 'Recuperados',
                                        backgroundColor: "green",
                                        borderColor: "green",
                                        data: arrayRecovered,
                                        fill: false,
                                    },
                                    {
                                        label: 'Fallecidos',
                                        backgroundColor: "red",
                                        borderColor: "red",
                                        data: arrayDeceased,
                                        fill: true,
                                    }
                                    ]
                                },
                                options: {
                                    responsive: true,
                                    title: {
                                        display: true,
                                        text: graphic.getAttribute('Texto')
                                    },
                                    tooltips: {
                                        mode: 'index',
                                        intersect: false,
                                    },
                                    hover: {
                                        mode: 'nearest',
                                        intersect: true
                                    },
                                    scales: {
                                        xAxes: [{
                                            display: true,
                                            scaleLabel: {
                                                display: false,
                                                labelString: 'Mes'
                                            }
                                        }],
                                        yAxes: [{
                                            display: true,
                                            scaleLabel: {
                                                display: true,
                                                labelString: 'Casos'
                                            }
                                        }]
                                    }
                                }
                            };

                            chart = new Chart(document.getElementById('resultCanvas').getContext("2d"), config)

                        }
                    }
                )
            })
        }
        setupHoverTooltip(layerview);

    }));


    // Set to day before the last
    setYear(today.getTime() - 86400000);


    view.popup = {
        dockEnabled: true,
        dockOptions: {
            buttonEnabled: false,
            position: "bottom-right",
            breakpoint: false
        }
    }
    view.popup.viewModel.actions = [];

    //--------------------------------------------------------------------------
    //
    //  Methods
    //
    //--------------------------------------------------------------------------

    /**
     * Limit map navigation
     */
    function limitMapExtent(view) {
        var initialExtent = view.extent;
        view.watch('stationary', function (event) {
            if (!event) {
                return;
            }
            //If the map has moved to the point where it's center is
            //outside the initial boundaries, then move it back to the
            //edge where it moved out
            var currentCenter = view.extent.center;
            if (!initialExtent.contains(currentCenter)) {

                var newCenter = view.extent.center;

                //check each side of the initial extent and if the
                //current center is outside that extent,
                //set the new center to be on the edge that it went out on
                if (currentCenter.x < initialExtent.xmin) {
                    newCenter.x = initialExtent.xmin;
                }
                if (currentCenter.x > initialExtent.xmax) {
                    newCenter.x = initialExtent.xmax;
                }
                if (currentCenter.y < initialExtent.ymin) {
                    newCenter.y = initialExtent.ymin;
                }
                if (currentCenter.y > initialExtent.ymax) {
                    newCenter.y = initialExtent.ymax;
                }
                view.goTo(newCenter);
            }
        });
    }

    /**
     * Sets the current visualized construction year.
     */
    function setYear(value) {
        // sliderValue.innerHTML = Math.floor(value);
        var day = getDay(value);
        sliderDay.innerHTML = day;
        sliderValue.innerHTML = new Date(value).getDate() + " de " + getMonth(value) + " " + new Date(value).getFullYear()
        slider.viewModel.setValue(0, value);

        // Formateamos fecha
        var _date = new Date(value).getFullYear() + "-" + (new Date(value).getMonth() + 1) + "-" + new Date(value).getDate();
        var _date_ = new Date(value + 86400000).getFullYear() + "-" + (new Date(value + 86400000).getMonth() + 1) + "-" + new Date(value + 86400000).getDate()

        // layer.definitionExpression = "Fecha >= DATE '" + _date + "' AND Fecha < DATE '" + _date_ + "'" + _ccaa;
        layer.definitionExpression = "HoraActualizacion >= DATE '" + _date + "' AND HoraActualizacion <= DATE '" + _date_ + "'" + _ccaa;

        // layer.renderer = renderer;

    }

    /**
     */

    function isNegative(value) {
        if (value == -1) {
            return "No hay datos disponibles"
        }
        else {
            return new Intl.NumberFormat('de-DE').format(value)
        }
    }

    function isNull(value) {
        if (value == null) {
            return "Sin datos"
        }
        else {
            return value
        }
    }

    /**
     * Starts the animation that cycle
     * through the construction years.
     */
    function startAnimation() {
        stopAnimation();
        animation = animate(slider.values[0]);
        playButton.classList.add("toggled");
    }

    /**
     * Stops the animations
     */
    function stopAnimation() {
        if (!animation) {
            return;
        }

        animation.remove();
        animation = null;
        playButton.classList.remove("toggled");
    }

    /**
     * Animates the color visual variable continously
     */
    function animate(startValue) {
        var animating = true;
        var value = startValue;

        var frame = function (timestamp) {
            if (!animating) {
                return;
            }

            value += 86400000;
            // value += 86400000 / 4;
            // if (value > 1586131200000) {
            //     value = 1582502400000;
            // }
            if (value > today.getTime()) {
                value = 1585519200000;
            }

            setYear(value);

            // Update at 30fps
            setTimeout(function () {
                requestAnimationFrame(frame);
            }, 1700);
        };

        frame();
        layer.refresh();
        // layerview.refresh()

        return {
            remove: function () {
                animating = false;
            }
        };
    }

    /**
     * Creates a tooltip to display a the construction year of a building.
     */
    function createTooltip() {
        var tooltip = document.createElement("div");
        var style = tooltip.style;

        tooltip.setAttribute("role", "tooltip");
        tooltip.classList.add("tooltip");

        var textElement = document.createElement("div");
        textElement.classList.add("esri-widget");
        tooltip.appendChild(textElement);

        view.container.appendChild(tooltip);

        var x = 0;
        var y = 0;
        var targetX = 0;
        var targetY = 0;
        var visible = false;

        // move the tooltip progressively
        function move() {

            x += (targetX - x) * 0.1;
            y += (targetY - y) * 0.1;

            if (Math.abs(targetX - x) < 1 && Math.abs(targetY - y) < 1) {
                x = targetX;
                y = targetY;
            } else {
                requestAnimationFrame(move);
            }

            style.transform =
                "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px, 0)";
        }

        return {
            show: function (point, text) {
                if (!visible) {
                    x = point.x;
                    y = point.y;
                }

                // targetX = point.x;
                // targetY = point.y;

                if (point.y  <= (window.innerHeight / 2) ) {
                    targetY = point.y + 400
                }
                else {
                    targetY = point.y;
                }
                if (point.x <= (window.innerHeight / 2)) {
                    targetX = point.x + 200
                }
                else {
                    targetX = point.x
                }

                console.log("X: " + point.x + "  -  innerHeight: " + window.innerHeight)
                console.log("Y: " + point.y + "  -  innerWidth: " + window.innerWidth)

                style.opacity = 1;
                visible = true;
                textElement.innerHTML = text;

                move();
            },

            hide: function () {
                style.opacity = 0;
                visible = false;
            }
        };
    }

    function getDay(value) {
        switch (new Date(value).getDay()) {
            case 0:
                day = "Domingo";
                break;
            case 1:
                day = "Lunes";
                break;
            case 2:
                day = "Martes";
                break;
            case 3:
                day = "Miércoles";
                break;
            case 4:
                day = "Jueves";
                break;
            case 5:
                day = "Viernes";
                break;
            case 6:
                day = "Sábado";
        }
        return day;
    }

    function getMonth(value) {
        switch (new Date(value).getMonth()) {
            case 0:
                month = "Enero";
                break;
            case 1:
                month = "Febrero";
                break;
            case 2:
                month = "Marzo";
                break;
            case 3:
                month = "Abril";
                break;
            case 4:
                month = "Mayo";
                break;
            case 5:
                month = "Junio";
                break;
            case 6:
                month = "Julio";
                break;
            case 7:
                month = "Agosto";
                break;
            case 8:
                month = "Septiembre";
                break;
            case 9:
                month = "Octubre";
                break;
            case 10:
                month = "Noviembre";
                break;
            case 11:
                month = "Diciembre";
                break;
        }
        return month;
    }
});
