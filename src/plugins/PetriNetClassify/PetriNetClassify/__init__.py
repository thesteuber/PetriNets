"""
This is where the implementation of the plugin code goes.
The PetriNetClassify-class is imported from both run_plugin.py and run_debug.py
"""
import sys
import logging
from webgme_bindings import PluginBase

# Setup a logger
logger = logging.getLogger('PetriNetClassify')
logger.setLevel(logging.INFO)
handler = logging.StreamHandler(sys.stdout)  # By default it logs to stderr..
handler.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
logger.addHandler(handler)

class PetriNetClassify(PluginBase):
    def main(self):
        core = self.core
        root_node = self.root_node
        active_node = self.active_node
        nodes = core.load_sub_tree(active_node)
        META = self.META

        def get_system_schematics(active_node):
            nodes = core.load_sub_tree(active_node)
            nodesbypath = {}
            name2path = {}
            paths2arc = {}
            places = []
            transitions = []

            places2transitions = {}
            transitions2places = {}

            for node in nodes:
                nodesbypath[core.get_path(node)] = node
                name2path[core.get_attribute(node, 'name')] = core.get_path(node)
                if core.is_instance_of(node, META['Place']):
                    places2transitions[core.get_path(node)] = []
                    places.append(core.get_path(node))
                if core.is_instance_of(node, META['Transition']):
                    transitions2places[core.get_path(node)] = []
                    transitions.append(core.get_path(node))
            
            for node in nodes:
                if core.is_instance_of(node, META['Place to Transition Arc']) or core.is_instance_of(node, META['Transition to Place Arc']):
                    srcport = core.get_pointer_path(node, 'src')
                    dstport = core.get_pointer_path(node, 'dst')
                    if srcport != dstport:
                        src = nodesbypath[srcport]
                        dst = nodesbypath[dstport]
                        if core.is_instance_of(node, META['Place to Transition Arc']):
                            places2transitions[core.get_path(src)].append(core.get_path(dst))
                        if core.is_instance_of(node, META['Transition to Place Arc']):
                            transitions2places[core.get_path(src)].append(core.get_path(dst))
                        paths2arc["{0}__{1}".format(core.get_path(src), core.get_path(dst))] = node
            return places2transitions, transitions2places, nodesbypath, name2path, paths2arc, places, transitions

        # State machine - a petri net is a state machine 
        # if every transition has exactly one inplace and one outplace. 
        def is_state_machine(places2transitions, transitions2places):
            transitions2inplaces = {}
            for place in places2transitions:
                for transition in places2transitions[place]:
                    if transition in transitions2inplaces: return False 
                    transitions2inplaces[transition] = [place]
            
            for transition in transitions2places:
                if len(transitions2places[transition]) != 1: return False

            return True

        # Marked graph - a petri net is a marked graph 
        # if every place has exactly one out transition and one in transition. 
        def is_marked_graph(places2transitions, transitions2places):
            places2intransitions = {}
            for transition in transitions2places:
                for place in transitions2places[transition]:
                    if place in places2intransitions: return False 
                    places2intransitions[place] = [transition]
            
            for place in places2transitions:
                if len(places2transitions[place]) != 1: return False

            return True
        
        # Free-choice petri net - 
        # if the intersection of the inplaces sets of two transitions are not empty, 
        # then the two transitions should be the same 
        # (or in short, each transition has its own unique set if inplaces) 
        def is_free_choice(places2transitions):
            seenTransitions = {}
            for place in places2transitions:
                for transition in places2transitions[place]:
                    if transition in seenTransitions: return False
                    seenTransitions[transition] = transition
            return True

        

        def traverse(start, path2node, places2transitions, transitions2places):
            visited = set()
            queue = []
            queue.append(start)
            while len(queue) > 0:
                current = queue.pop(0)
                visited.add(current)
                if core.is_instance_of(path2node[current], META['Place']):
                    for neighbor in places2transitions[current]:
                        if neighbor not in visited:
                            queue.append(neighbor)

                if core.is_instance_of(path2node[current], META['Transition']):
                    for neighbor in transitions2places[current]:
                        if neighbor not in visited:
                            queue.append(neighbor)
            return visited

        # Workflow net - a petri net is a workflow net 
        # if it has exactly one source place s where *s = ∅, 
        # one sink place o where o* = ∅, and every x ∈ P ∪ T is on a path from s to o. 

        #1. has unique dedicated place (no transitions to 1 place is the starting place), i place
        #2. there's a clear end, unique, no out transitions from a place, o place
        #3. every other transition and place are on a path from i to o
        def is_workflow_net(places2transitions, transitions2places, places, transitions, nodesbypath):
            transitions2inplaces = {}
            for place in places2transitions:
                for transition in places2transitions[place]:
                    if transition not in transitions2inplaces: 
                        transitions2inplaces[transition] = []
                    transitions2inplaces[transition].append(place)

            places2intransitions = {}
            for transition in transitions2places:
                for place in transitions2places[transition]:
                    if place not in places2intransitions:
                        places2intransitions[place] = []
                    places2intransitions[place].append(transition)
            
            #1 unique starting point
            initialPlacePath = ""
            for place in places:
                if place not in places2intransitions:
                    if initialPlacePath != "": #not unique starting point
                        return False
                    initialPlacePath = place

            finalPlacePath = ""
            for place in places:
                if len(places2transitions[place]) == 0:
                    if finalPlacePath != "": #not unique ending point
                        return False
                    finalPlacePath = place

            if initialPlacePath == "" or finalPlacePath == "":
                logger.warn('Missing clear and unique initial or final place')
                return False

            allVisited = traverse(initialPlacePath, nodesbypath, places2transitions, transitions2places)
            for place in places:
                if place not in allVisited:
                    return False
                
            for transition in transitions:
                if transition not in allVisited:
                    return False

            return True
        
        places2transitions, transitions2places, nodesbypath, name2path, paths2arc, places, transitions = get_system_schematics(active_node)
        # logger.warn('Is State Machine: {0}'.format(is_state_machine(places2transitions, transitions2places)))
        # logger.warn('Is Marked Graph: {0}'.format(is_marked_graph(places2transitions, transitions2places)))
        # logger.warn('Is Free Choice: {0}'.format(is_free_choice(places2transitions)))
        # logger.warn('Is Workflow Net: {0}'.format(is_workflow_net(places2transitions, transitions2places, places, transitions, nodesbypath)))

        fullClassification = ""
        if is_state_machine(places2transitions, transitions2places): fullClassification = fullClassification + "State Machine, "
        if is_marked_graph(places2transitions, transitions2places): fullClassification = fullClassification + "Marked Graph, "
        if is_free_choice(places2transitions): fullClassification = fullClassification + "Free Choice, "
        if is_workflow_net(places2transitions, transitions2places, places, transitions, nodesbypath): fullClassification = fullClassification + "Workflow Net"
        if fullClassification == "": fullClassification = "Unknown Classification"

        core.set_attribute(active_node, 'LastClassification', fullClassification)

        commit_info = self.util.save(root_node, self.commit_hash, 'master', 'Python plugin updated the model')
        logger.info('committed :{0}'.format(commit_info))


