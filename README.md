# petri-nets
## Domain
The domain of the petri-net modeling language is an evolution of a simple state machine. While being able to serve as a simple state machine, petri-nets extend a bit beyound in most cases. A petri-net consists of Places, Transitions, Tokens, and Arcs. Tokens are used to make Places much like an integer count. There can never be an arc between two Transitions or two Places directly. The path of a petri-net must follow a Place-Transition-Place-Transition-....-Transition-Place pattern, where - are arcs. A transition is considered enabled if all of the Place that have an arc to the Transition (the Transition's inplaces) have at least 1 token or marking. The transition can then fire and in doing so, removes a marking/token from each of the inplaces in the transition and places a token onto each of its outplaces.

## Use Cases
For use cases where a simple single state is just not enough. For instance, tracking inventory such that a purchase in a system triggers the chance for many transitions to occur. All of these transitions can be simulated with a petri-net!

## Installation
First, install the petri-nets following:
- [NodeJS](https://nodejs.org/en/) (LTS recommended)
- [MongoDB](https://www.mongodb.com/)

Second, start mongodb locally by running the `mongod` executable in your mongodb installation (you may need to create a `data` directory or set `--dbpath`).

Then, run `webgme start` from the project root to start . Finally, navigate to `http://localhost:8888` to start using petri-nets!

## Start Modeling
Getting started is easy! First create a new project with a seed of "PetriNet." 

### Examples
Some example petri-nets will be seen on the project leveraging the seed:
![image](https://user-images.githubusercontent.com/105262527/206585746-bc076c9d-566a-4fb1-b0d4-79c0059f7971.png)

#### Example 1 is a petri-net implementation of a Point of Sale system, where the markings track stages possible in the process.

#### Example 2 is a small looping example where when simulated, the markings will never deadlock.

#### Example 3 is a buffered message queue implementation.

#### State Machine is an example of a how a petri-net can be used as a State Machine.

#### Workflow Net is an example of a petri net with clear and unique initial and end places, and every node in the petri graph is reachable via the initial place.

## Features
### Test Simulation
With a Petri Note node selected, click the TestSimulate button to start simulating the project:
![image](https://user-images.githubusercontent.com/105262527/206584986-7e5fe6c2-fea4-47a8-8fc9-86ee399faca6.png)

By double clicking any enabled (green) transition, markings will propogate throughout the system!

### Reset
During a simulation, you may press the following tool bar button to reset the simulation:
![image](https://user-images.githubusercontent.com/105262527/206585368-927d6343-ad57-4703-bc08-7d32cf39cb0f.png)

### Classification
During a simulation, you may press the following tool bar button to classify the petri-net:
![image](https://user-images.githubusercontent.com/105262527/206585435-91b6ccaf-c507-40c2-abd5-38310942126c.png)

Once the plugin finishes, the petri-net attribute "LastClassification" will be updated:
![image](https://user-images.githubusercontent.com/105262527/206585540-bddf1224-f50b-42eb-998c-f6511dcf190b.png)
