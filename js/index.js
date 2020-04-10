
require([
    "esri/Map",
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
    Map,
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

    // Get date
    var today = new Date();
    var _today = "'" + today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();

    var labelClass = {
        // autocasts as new LabelClass()
        symbol: {
            type: "text",  // autocasts as new TextSymbol()
            color: "green",
            font: {  // autocast as new Font()
                family: "Playfair Display",
                size: 12,
                weight: "bold"
            }
        },
        labelPlacement: "above-center",
        labelExpressionInfo: {
            expression: "$feature.cases_per_cienmil"
        }
    };

    var layer = new FeatureLayer({
        portalItem: {
            id: "2900a255ae0f47779bf9b2036e9d0d87"
        },
        definitionExpression: "date >= DATE '2020-3-20' AND date <= DATE '2020-3-21'",
        title: "Cifras afectados. COVID-19  (casos por 100.000 habitantes)",
        outFields: ["*"],
        labelingInfo: [labelClass]
    });

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
        center: [-4, 40.727724],
        zoom: 5,
        constraints: {
            snapToZoom: false
        },
        // This ensures that when going fullscreen
        // The top left corner of the view extent
        // stays aligned with the top left corner
        // of the view's container
        resizeAlign: "top-left"
    });

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
        // max: 1586131200000,
        min: 1582502400000,
        values: [1582502400000],
        step: 2678400000,
        rangeLabelsVisible: true,
        visibleElements: {
            labels: true,
            rangeLabels: true
        },
        labelsVisible: true
    });

    slider.labelFormatFunction = function (value, type) {
        // return new Date(value).toLocaleDateString()
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
                style: "card"
            }),
            view: view,
            expanded: true
        }),
        "bottom-left"
    );



    // When the layerview is available, setup hovering interactivity
    view.whenLayerView(layer).then(setupHoverTooltip);
    // Set to 20 March
    setYear(1584658800000)

    //--------------------------------------------------------------------------
    //
    //  Methods
    //
    //--------------------------------------------------------------------------

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

        layer.definitionExpression = "date >= DATE '" + _date + "' AND date < DATE '" + _date_ + "'";


    }

    /**
     * Sets up a moving tooltip that displays
     * the construction year of the hovered building.
     */
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
                        var graphic = hit.graphic;
                        var screenPoint = hit.screenPoint;

                        highlight = layerview.highlight(graphic);
                        tooltip.show(
                            screenPoint,
                            // "Built in " + graphic.getAttribute("CNSTRCT_YR")
                            // "Fecha: " + new Date(graphic.getAttribute("date")).toLocaleDateString() + "<br><br>" +

                            "<b>" + graphic.getAttribute("province") + ".  " + new Date(graphic.getAttribute("date")).toLocaleDateString() + "</b><br>" +

                            "<ul>" +
                            "<li>Nuevos casos: <b>" + isNegative(graphic.getAttribute("new_cases")) + "</b></li>" +
                            "<li>Recuperados: <b>" + isNegative(graphic.getAttribute("recovered")) + "</b></li>" +
                            "<li>Hospitalizados: <b>" + isNegative(graphic.getAttribute("hospitalized")) + "</b></li>" +
                            "<li>Casos en UCI: <b>" + isNegative(graphic.getAttribute("intensive_care")) + "</b></li>" +
                            "<li>Casos por 100.000 hab: <b>" + isNegative(graphic.getAttribute("cases_per_cienmil")) + "</b></li>" +
                            "<li>Casos acumulados: <b>" + isNegative(graphic.getAttribute("cases_accumulated")) + "</b></li>" +
                            "</ul>"

                        );
                    } else {
                        tooltip.hide();
                    }
                },
                function () { }
            );
        });
    }

    /**
     */

    function isNegative(value) {
        if (value == -1) {
            return "-"
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

            // value += 86400000;
            value += 86400000 / 4;
            if (value > 1586131200000) {
                value = 1582502400000;
            }

            setYear(value);

            // Update at 30fps
            setTimeout(function () {
                requestAnimationFrame(frame);
            }, 700);
        };

        frame();
        layer.refresh();

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

                targetX = point.x;
                targetY = point.y;
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
