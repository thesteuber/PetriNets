# petri-nets
## Domain

## Use Cases

## Installation
First, install the petri-nets following:
- [NodeJS](https://nodejs.org/en/) (LTS recommended)
- [MongoDB](https://www.mongodb.com/)

Second, start mongodb locally by running the `mongod` executable in your mongodb installation (you may need to create a `data` directory or set `--dbpath`).

Then, run `webgme start` from the project root to start . Finally, navigate to `http://localhost:8888` to start using petri-nets!

## Start Modeling

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
