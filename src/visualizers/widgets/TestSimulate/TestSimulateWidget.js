/*globals define, WebGMEGlobal*/

/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Thu Dec 08 2022 02:38:56 GMT-0600 (Central Standard Time).
 */

define(['jointjs', 'css!./styles/TestSimulateWidget.css'], function (joint) {
    'use strict';

    var WIDGET_CLASS = 'test-simulate';

    function TestSimulateWidget(logger, container) {
        this._logger = logger.fork('Widget');

        this._el = container;

        this.nodes = {};
        this.initNodes = {};
        this._vertexId2Node = {};
        this.places = {};
        this.initPlaces = {};
        this.transitions = {};
        this.initTransitions = {};
        this.id2t2pa = {};
        this.id2p2ta = {};
        this._initialize();

        
        this._logger.debug('ctor finished');
    }

    TestSimulateWidget.prototype._initialize = function () {
        var width = this._el.width(),
            height = this._el.height(),
            self = this;

        // set widget class
        this._el.addClass(WIDGET_CLASS);

        // Create a dummy header
        //this._el.append('<h3>TestSimulate Events:</h3>');

        // Registering to events can be done with jQuery (as normal)
        // this._el.on('dblclick', function (event) {
        //     event.stopPropagation();
        //     event.preventDefault();
        //     self.onBackgroundDblClick();
        // });

        this._jointPN = new joint.dia.Graph;
        this._jointPaper = new joint.dia.Paper({
            el: this._el,
            width : width,
            height: height,
            model: this._jointPN,
            interactive: false
        });

        // add event calls to elements
        this._jointPaper.on('element:pointerdblclick', function(elementView) {
            const currentElement = elementView.model;
            let node = self._vertexId2Node[currentElement.id];
            
            if (node.metaType == 'Transition' && node.enabled){
                node.inplaces.forEach(inplaceId => {
                    let inplace = self.places[inplaceId];
                    inplace.childrenIds.shift();
                });
                node.outplaces.forEach(outplaceID => {
                    let outplace = self.places[outplaceID];
                    outplace.childrenIds.push('tt');
                });
                self.fireEvent(node);
            }
            // if (self._webgmeSM) {
            //     // console.log(self._webgmeSM.id2state[currentElement.id]);
            //     self._setCurrentState(self._webgmeSM.id2state[currentElement.id]);
            // }
        });
    };

    TestSimulateWidget.prototype.onWidgetContainerResize = function (width, height) {
        this._logger.debug('Widget is resizing...');
    };

    TestSimulateWidget.prototype.fireEvent = function (transition) {
        const self = this;
        transition.outLinks.forEach(outLink => {
            const linkView = outLink.findView(self._jointPaper);
            linkView.sendToken(joint.V('circle', { r: 10, fill: 'black' }), {duration:500}, function() {
               self._decorateMachine();
            });
        })
    };

    TestSimulateWidget.prototype._reset = function () {
        alert("reset triggered");
        const self = this;
        self.nodes = {...self.initNodes};
        self.places = {...self.initPlaces};
        self.transitions = {...self.initTransitions};
        self._decorateMachine();
    };

    TestSimulateWidget.prototype._decorateMachine = function() {
        const self = this;
        Object.keys(self.places).forEach(placeId => {
            let place = self.places[placeId];
            place.joint.attr('label/text', place.name + ' - ' + place.childrenIds.length + ' markings');
        });

        var atleast1enabled = false;
        Object.keys(self.transitions).forEach(transitionId => {
            let transition = self.transitions[transitionId];
            var enabled = true;
            transition.inplaces.forEach(inplaceId => {
                let inplace = self.places[inplaceId];
                if (inplace.childrenIds.length == 0){
                    enabled = false;
                }
            });
            var bodyFill = '#333333';
            transition.enabled = false;
            if (enabled) 
            {
                bodyFill = '#00b200';
                transition.enabled = true;
                atleast1enabled = true;
            }
            transition.joint.attr('body/fill', bodyFill);
        });
        if (!atleast1enabled) {
            alert("There are no enabled transitions!");
        }
    };

    TestSimulateWidget.prototype._buildPetriNet = function (nodes, places, transitions, id2t2pa, id2p2ta) {
        const self = this;
        self._jointPN.clear();
        self.nodes = nodes;
        self.initNodes = {...nodes};
        self.places = places;
        self.initPlaces = {...places};
        self.transitions = transitions;
        self.initTransitions = {...transitions};
        self.id2t2pa = id2t2pa;
        self.id2p2ta = id2p2ta;

        var id2Node = {};
        if (nodes) {
            
            //alert(JSON.stringify(desc, null, 2));
            var atleast1enabled = false;
            console.log(JSON.stringify(nodes, null, 2));
            nodes.forEach(node => {
                // console.log("A node....");
                // console.log(JSON.stringify(node, null, 2));
                if (node.metaType == "Place"){
                    const vertex = new joint.shapes.standard.Circle({
                        position: node.position,
                        size: { width: 100, height: 100 },
                        attrs: {
                            root: {
                                title: 'Place'
                            },
                            body: {
                                fill: 'white',
                                cursor: 'pointer'
                            },
                            label: {
                                textAnchor: 'top',
                                textVerticalAnchor: 'top',
                                text: node.name + ' - ' + node.childrenIds.length + ' markings',
                                fontWeight: 'bold'
                            }
                        }
                    });
                    console.log(JSON.stringify(vertex, null, 2));
                    vertex.addTo(self._jointPN);
                    node.joint = vertex;
                    self._vertexId2Node[vertex.id] = node;
                    id2Node[node.id] = node;
                }
                else if (node.metaType == "Transition"){
                    var enabled = true;
                    console.log("PLACES");
                    console.log(JSON.stringify(places, null, 2));
                    node.inplaces.forEach(inplaceId => {
                        let inplace = places[inplaceId];
                        if (inplace.childrenIds.length == 0){
                            enabled = false;
                        }
                    });
                    var bodyFill = '#333333';
                    if (enabled) 
                    {
                        bodyFill = '#00b200';
                        node.enabled = true;
                        atleast1enabled = true;
                    }
                    const vertex = new joint.shapes.standard.Rectangle({
                        position: node.position,
                        size: { width: 20, height: 50 },
                        attrs: {
                            root: {
                                title: 'Place'
                            },
                            body: {
                                fill: bodyFill,
                                cursor: 'pointer'
                            },
                            label: {
                                textAnchor: 'top',
                                textVerticalAnchor: 'top',
                                text: node.name,
                                fontWeight: 'bold'
                            }
                        }
                    });
                    console.log(JSON.stringify(vertex, null, 2));
                    vertex.addTo(self._jointPN);
                    node.joint = vertex;
                    self._vertexId2Node[vertex.id] = node;
                    id2Node[node.id] = node;
                }
            }); 
            
            nodes.forEach(node => {
                console.log("A node after first round....");
                console.log(JSON.stringify(node, null, 2));

                if (node.metaType == "Transition to Place Arc" || node.metaType == "Place to Transition Arc"){
                    const link = new joint.shapes.standard.Link({
                        source: {id: id2Node[node.src].joint.id},
                        target: {id: id2Node[node.dst].joint.id},
                        attrs: {
                            line: {
                                strokeWidth: 2
                            },
                            wrapper: {
                                cursor: 'default'
                            }
                        },
                        labels: [{
                            position: {
                                distance: 0.5,
                                offset: 0,
                                args: {
                                    keepGradient: true,
                                    ensureLegibility: true
                                }
                            },
                            attrs: {
                                text: {
                                    fontWeight: 'bold'
                                }
                            }
                        }]
                    });
                    link.addTo(self._jointPN);
                    if (node.metaType == "Transition to Place Arc"){
                        let transition1 = id2Node[node.src];
                        transition1.outLinks.push(link);
                    }
                }
            }); 
        }

        self._jointPaper.updateViews();
        //self._decorateMachine();
    };
    
    TestSimulateWidget.prototype.destroyPetriNet = function () {
        
    };

    TestSimulateWidget.prototype.removeNode = function (gmeId) {
        var desc = this.nodes[gmeId];
        this._el.append('<div>Removing node "' + desc.name + '"</div>');
        delete this.nodes[gmeId];
    };

    TestSimulateWidget.prototype.updateNode = function (desc) {
        if (desc) {
            this._logger.debug('Updating node:', desc);
            this._el.append('<div>Updating node "' + desc.name + '"</div>');
        }
    };

    /* * * * * * * * Visualizer event handlers * * * * * * * */

    TestSimulateWidget.prototype.onNodeClick = function (/*id*/) {
        // This currently changes the active node to the given id and
        // this is overridden in the controller.
    };

    TestSimulateWidget.prototype.onBackgroundDblClick = function () {
        this._el.append('<div>Background was double-clicked!!</div>');
    };

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    TestSimulateWidget.prototype.destroy = function () {
    };

    TestSimulateWidget.prototype.onActivate = function () {
        this._logger.debug('TestSimulateWidget has been activated');
    };

    TestSimulateWidget.prototype.onDeactivate = function () {
        this._logger.debug('TestSimulateWidget has been deactivated');
    };

    return TestSimulateWidget;
});
