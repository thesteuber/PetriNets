/*globals define, WebGMEGlobal*/
/**
 * Generated by VisualizerGenerator 1.7.0 from webgme on Thu Dec 08 2022 02:38:56 GMT-0600 (Central Standard Time).
 */

define([
    'js/Constants',
    'js/Utils/GMEConcepts',
    'js/NodePropertyNames'
], function (
    CONSTANTS,
    GMEConcepts,
    nodePropertyNames
) {

    'use strict';

    function TestSimulateControl(options) {

        this._logger = options.logger.fork('Control');

        this._client = options.client;

        // Initialize core collections and variables
        this._widget = options.widget;
        this._nodes = new Array();
        this.id2t2pa = {};
        this.id2p2ta = {};
        this.id2place = {}
        this.id2transition = {};
        
        this._currentNodeId = null;
        this._currentNodeParentId = undefined;

        this._initWidgetEventHandlers();

        this._logger.debug('ctor finished');
    }

    TestSimulateControl.prototype._initWidgetEventHandlers = function () {
        this._widget.onNodeClick = function (id) {
            // Change the current active object
            WebGMEGlobal.State.registerActiveObject(id);
        };
    };

    /* * * * * * * * Visualizer content update callbacks * * * * * * * */
    // One major concept here is with managing the territory. The territory
    // defines the parts of the project that the visualizer is interested in
    // (this allows the browser to then only load those relevant parts).
    TestSimulateControl.prototype.selectedObjectChanged = function (nodeId) {
        var desc = this._getObjectDescriptor(nodeId),
            self = this;

        self._logger.debug('activeObject nodeId \'' + nodeId + '\'');

        // Remove current territory patterns
        if (self._currentNodeId) {
            self._client.removeUI(self._territoryId);
        }

        self._currentNodeId = nodeId;
        self._currentNodeParentId = undefined;

        if (typeof self._currentNodeId === 'string') {
            // Put new node's info into territory rules
            self._selfPatterns = {};
            self._selfPatterns[nodeId] = {children: 0};  // Territory "rule"

            self._widget.setTitle(desc.name.toUpperCase());

            if (typeof desc.parentId === 'string') {
                self.$btnModelHierarchyUp.show();
            } else {
                self.$btnModelHierarchyUp.hide();
            }

            self._currentNodeParentId = desc.parentId;

            self._territoryId = self._client.addUI(self, function (events) {
                self._eventCallback(events);
            });

            // Update the territory
            self._client.updateTerritory(self._territoryId, self._selfPatterns);

            self._selfPatterns[nodeId] = {children: 1};
            self._client.updateTerritory(self._territoryId, self._selfPatterns);
        }
    };

    // This next function retrieves the relevant node information for the widget
    TestSimulateControl.prototype._getObjectDescriptor = function (nodeId) {
        var node = this._client.getNode(nodeId),
            objDescriptor;
        if (node) {
            objDescriptor = {
                id: node.getId(),
                name: node.getAttribute(nodePropertyNames.Attributes.name),
                childrenIds: node.getChildrenIds(),
                parentId: node.getParentId(),
                isConnection: GMEConcepts.isConnection(nodeId)
            };
        }

        return objDescriptor;
    };

    /* * * * * * * * Node Event Handling * * * * * * * */
    TestSimulateControl.prototype._eventCallback = function (events) {
        const self = this;
        console.log(events);

        var i = events ? events.length : 0,
            event;

        while (i--) {
            event = events[i];
            switch (event.etype) {

            case CONSTANTS.TERRITORY_EVENT_LOAD:
                this._onLoad(event.eid);
                break;
            // case CONSTANTS.TERRITORY_EVENT_UPDATE:
            //     this._onUpdate(event.eid);
            //     break;
            // case CONSTANTS.TERRITORY_EVENT_UNLOAD:
            //     this._onUnload(event.eid);
            //     break;
            default:
                break;
            }
        }

        events.forEach(event => {
            if (event.eid && 
                event.eid === self._currentNodeId ) {
                    if (event.etype == 'load' || event.etype == 'update') {
                        self._networkRootLoaded = true;
                    } else {
                        self.clearPetriNet();
                        return;
                    }
                }
        });

        if (events.length && events[0].etype === 'complete' && self._networkRootLoaded) {
            // complete means we got all requested data and we do not have to wait for additional load cycles
            self._initPetriNet();
        }
    };

    TestSimulateControl.prototype.clearPetriNet = function () {
        const self = this;
        self._networkRootLoaded = false;
        self._widget.destroyPetriNet();
    };

    TestSimulateControl.prototype._initPetriNet = function (gmeId) {
        const self = this;
        //just for the ease of use, lets create a META dictionary
        const rawMETA = self._client.getAllMetaNodes();
        const META = {};
        rawMETA.forEach(node => {
            META[node.getAttribute('name')] = node.getId(); //we just need the id...
        });

        console.log("PLACES BEFORE WIDGET");
        console.log(JSON.stringify(self.id2place, null, 2));

        console.log("Transitions BEFORE WIDGET");
        console.log(JSON.stringify(self.id2transition, null, 2));

        console.log("id2t2pa BEFORE WIDGET");
        console.log(JSON.stringify(self.id2t2pa, null, 2));

        console.log("id2p2ta BEFORE WIDGET");
        console.log(JSON.stringify(self.id2p2ta, null, 2));
        
        Object.keys(self.id2p2ta).forEach(nodeid => {
            var nodeP2T = self.id2p2ta[nodeid];
            let place = self.id2place[nodeP2T.src];
            let transition = self.id2transition[nodeP2T.dst];
            transition.inplaces.push(place.id);
            place.outtransitions.push(transition.id);
        })
        Object.keys(self.id2t2pa).forEach(nodeid => {
            var nodeT2P = self.id2t2pa[nodeid];
            let transition = self.id2transition[nodeT2P.src];
            let place = self.id2place[nodeT2P.dst];
            transition.outplaces.push(place.id);
            place.intransitions.push(transition.id);
        })
        


        this._widget._buildPetriNet(self._nodes, self.id2place, self.id2transition, self.id2t2pa, self.id2p2ta);

        // var description = this._getObjectDescriptor(gmeId);
        // console.log(JSON.stringify(description, null, 2));
        // const node = self._client.getNode(description.id);
        // console.log(JSON.stringify(node.getRegistry('position'), null, 2));
        // this._widget.addNode(description);
    };

    TestSimulateControl.prototype._onLoad = function (gmeId) {
        const self = this;
        const rawMETA = self._client.getAllMetaNodes();
        const META = {};
        rawMETA.forEach(node => {
            META[node.getAttribute('name')] = node.getId(); //we just need the id...
        });

        var description = this._getObjectDescriptor(gmeId);
        const node = self._client.getNode(description.id);
        var nodeType = "";
        
        
        var betterNode = {};
        if (node.isTypeOf(META['Place']))
        {
            betterNode.intransitions = [];
            betterNode.outtransitions = [];
            self.id2place[description.id] = betterNode;
            console.log("node id = "+description.id);
            nodeType = "Place"
        }
        if (node.isTypeOf(META['Petri Net']))
            nodeType = "Petri Net"
        if (node.isTypeOf(META['Transition']))
        {
            betterNode.inplaces = [];
            betterNode.outplaces = [];
            betterNode.outLinks = [];
            self.id2transition[description.id] = betterNode;
            nodeType = "Transition"
        }
        if (node.isTypeOf(META['Token']))
            nodeType = "Token"
        if (node.isTypeOf(META['Transition to Place Arc']))
        {
            self.id2t2pa[description.id] = betterNode;
            nodeType = "Transition to Place Arc";
        }
        if (node.isTypeOf(META['Place to Transition Arc']))
        {
            self.id2p2ta[description.id] = betterNode;
            nodeType = "Place to Transition Arc";
        }
        
        betterNode.id = description.id;
        betterNode.name = description.name,
        betterNode.childrenIds = description.childrenIds,
        betterNode.parentId = description.parentId,
        betterNode.isConnection = description.isConnection,
        betterNode.metaType = nodeType,
        betterNode.position = node.getRegistry('position'),
        betterNode.src = node.getPointerId('src'),
        betterNode.dst = node.getPointerId('dst')

        this._nodes.push(betterNode);
    };

    TestSimulateControl.prototype._onUpdate = function (gmeId) {
        var description = this._getObjectDescriptor(gmeId);
        
        this._widget.updateNode(description);
    };

    TestSimulateControl.prototype._onUnload = function (gmeId) {
        this._widget.removeNode(gmeId);
    };

    TestSimulateControl.prototype._stateActiveObjectChanged = function (model, activeObjectId) {
        if (this._currentNodeId === activeObjectId) {
            // The same node selected as before - do not trigger
        } else {
            this.selectedObjectChanged(activeObjectId);
        }
    };

    /* * * * * * * * Visualizer life cycle callbacks * * * * * * * */
    TestSimulateControl.prototype.destroy = function () {
        this._detachClientEventListeners();
        this._removeToolbarItems();
    };

    TestSimulateControl.prototype._attachClientEventListeners = function () {
        this._detachClientEventListeners();
        WebGMEGlobal.State.on('change:' + CONSTANTS.STATE_ACTIVE_OBJECT, this._stateActiveObjectChanged, this);
    };

    TestSimulateControl.prototype._detachClientEventListeners = function () {
        WebGMEGlobal.State.off('change:' + CONSTANTS.STATE_ACTIVE_OBJECT, this._stateActiveObjectChanged);
    };

    TestSimulateControl.prototype.onActivate = function () {
        this._attachClientEventListeners();
        this._displayToolbarItems();

        if (typeof this._currentNodeId === 'string') {
            WebGMEGlobal.State.registerActiveObject(this._currentNodeId, {suppressVisualizerFromNode: true});
        }
    };

    TestSimulateControl.prototype.onDeactivate = function () {
        this._detachClientEventListeners();
        this._hideToolbarItems();
    };

    /* * * * * * * * * * Updating the toolbar * * * * * * * * * */
    TestSimulateControl.prototype._displayToolbarItems = function () {

        if (this._toolbarInitialized === true) {
            for (var i = this._toolbarItems.length; i--;) {
                this._toolbarItems[i].show();
            }
        } else {
            this._initializeToolbar();
        }
    };

    TestSimulateControl.prototype._hideToolbarItems = function () {

        if (this._toolbarInitialized === true) {
            for (var i = this._toolbarItems.length; i--;) {
                this._toolbarItems[i].hide();
            }
        }
    };

    TestSimulateControl.prototype._removeToolbarItems = function () {

        if (this._toolbarInitialized === true) {
            for (var i = this._toolbarItems.length; i--;) {
                this._toolbarItems[i].destroy();
            }
        }
    };

    TestSimulateControl.prototype._initializeToolbar = function () {
        var self = this,
            toolBar = WebGMEGlobal.Toolbar;

        this._toolbarItems = [];

        this._toolbarItems.push(toolBar.addSeparator());

        /************** RESET ****************/
        this.$btnModelHierarchyUp = toolBar.addButton({
            title: 'Reset',
            icon: 'glyphicon glyphicon-repeat',
            clickFn: function (/*data*/) {
                //self._widget._reset();
                self._widget._buildPetriNet(self._nodes, self.id2place, self.id2transition, self.id2t2pa, self.id2p2ta);
            }
        });
        this._toolbarItems.push(this.$btnModelHierarchyUp);
        this.$btnModelHierarchyUp.hide();

        /************** CLASSIFY ****************/
        this.$btnModelHierarchyUp = toolBar.addButton({
            title: 'Classify',
            icon: '	glyphicon glyphicon-tag',
            clickFn: function (/*data*/) {
                const context = self._client.getCurrentPluginContext('PetriNetClassify',self._currentNodeId, []);
                // !!! it is important to fill out or pass an empty object as the plugin config otherwise we might get errors...
                context.pluginConfig = {};
                self._client.runServerPlugin(
                    'PetriNetClassify', 
                    context, 
                    function(err, result){
                        // here comes any additional processing of results or potential errors.
                        console.log('plugin err:', err);
                        console.log('plugin result:', result);
                });
            }
        });
        this._toolbarItems.push(this.$btnModelHierarchyUp);
        this.$btnModelHierarchyUp.hide();


        /************** Go to hierarchical parent button ****************/
        this.$btnModelHierarchyUp = toolBar.addButton({
            title: 'Go to parent',
            icon: 'glyphicon glyphicon-circle-arrow-up',
            clickFn: function (/*data*/) {
                WebGMEGlobal.State.registerActiveObject(self._currentNodeParentId);
            }
        });
        this._toolbarItems.push(this.$btnModelHierarchyUp);
        this.$btnModelHierarchyUp.hide();

        /************** Checkbox example *******************/

        this.$cbShowConnection = toolBar.addCheckBox({
            title: 'toggle checkbox',
            icon: 'gme icon-gme_diagonal-arrow',
            checkChangedFn: function (data, checked) {
                self._logger.debug('Checkbox has been clicked!');
            }
        });
        this._toolbarItems.push(this.$cbShowConnection);

        this._toolbarInitialized = true;
    };

    return TestSimulateControl;
});
